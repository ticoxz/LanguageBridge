import os
import time
import asyncio
import queue
import threading
import logging
from typing import AsyncGenerator
from google.cloud import speech
import google.generativeai as genai
from collections import defaultdict
from cache_manager import translation_cache

logger = logging.getLogger(__name__)

class UsageManager:
    """Tracks usage per session/user to enforce limits."""
    def __init__(self):
        self._usage = defaultdict(float)
        self._start_times = {}

    def start_session(self, session_id: str):
        self._start_times[session_id] = time.time()

    def update_usage(self, session_id: str):
        if session_id in self._start_times:
            current_time = time.time()
            elapsed = current_time - self._start_times[session_id]
            self._usage[session_id] += elapsed
            self._start_times[session_id] = current_time
            return self._usage[session_id]
        return self._usage[session_id]

    def is_limit_exceeded(self, session_id: str, limit_seconds: int = 86400) -> bool:
        return self._usage[session_id] >= limit_seconds

    def end_session(self, session_id: str):
        self.update_usage(session_id)
        if session_id in self._start_times:
            del self._start_times[session_id]

class Transcriber:
    """Wraps Google Cloud Speech-to-Text Streaming API."""
    def __init__(self, language_code: str = "es-ES"):
        self.client = speech.SpeechClient()
        self.language_code = language_code
        
        # Speaker diarization config
        # Speaker diarization - more sensitive settings
        diarization_config = speech.SpeakerDiarizationConfig(
            enable_speaker_diarization=True,
            min_speaker_count=1,  # Allow 1+ speakers (more flexible)
            max_speaker_count=10,  # Allow up to 10 speakers
        )
        
        self.config = speech.RecognitionConfig(
            encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
            sample_rate_hertz=16000,
            language_code=self.language_code,
            alternative_language_codes=["en-US"],  # Auto-detect Spanish or English
            enable_automatic_punctuation=True,
            diarization_config=diarization_config,
        )
        self.streaming_config = speech.StreamingRecognitionConfig(
            config=self.config,
            interim_results=True
        )

    async def transcribe_stream(self, audio_generator: AsyncGenerator[bytes, None]):
        """Bridges async generator to sync Google Cloud Client."""
        bridge_queue = queue.Queue()
        loop = asyncio.get_event_loop()
        
        # Feed queue from async generator
        async def feed_queue():
            count = 0
            logger.debug("DEBUG: Queue feeder started")
            try:
                async for content in audio_generator:
                    count += 1
                    bridge_queue.put(content)
                    if count % 50 == 0:
                        logger.debug(f"DEBUG: Fed {count} chunks")
                logger.debug("DEBUG: Audio generator done")
                bridge_queue.put(None)
            except Exception as e:
                logger.error(f"Feeder error: {e}")
                bridge_queue.put(None)
        
        feeder_task = asyncio.create_task(feed_queue())
        result_queue = asyncio.Queue()
        session_done = {"value": False}
        
        def transcribe_thread():
            logger.debug("DEBUG: Transcribe thread started")
            
            while not session_done["value"]:
                try:
                    logger.debug("DEBUG: Starting Google Speech stream...")
                    
                    def request_gen():
                        while True:
                            try:
                                content = bridge_queue.get(timeout=2)
                            except queue.Empty:
                                continue
                            
                            if content is None:
                                session_done["value"] = True
                                return
                            
                            if len(content) > 0:
                                yield speech.StreamingRecognizeRequest(audio_content=content)
                    
                    responses = self.client.streaming_recognize(
                        config=self.streaming_config,
                        requests=request_gen()
                    )
                    
                    logger.debug("DEBUG: Waiting for responses...")
                    count = 0
                    for response in responses:
                        count += 1
                        if count % 10 == 0:
                            logger.debug(f"DEBUG: Got {count} responses")
                        loop.call_soon_threadsafe(result_queue.put_nowait, response)
                    
                    logger.debug(f"DEBUG: Stream ended ({count} responses)")
                    
                except Exception as e:
                    logger.error(f"DEBUG: Stream error: {e}")
                    # import traceback
                    # traceback.print_exc()
                    time.sleep(1)
                    if session_done["value"]:
                        break
            
            loop.call_soon_threadsafe(result_queue.put_nowait, None)
        
        thread = threading.Thread(target=transcribe_thread)
        thread.start()
        
        try:
            while True:
                item = await result_queue.get()
                if item is None:
                    break
                if isinstance(item, Exception):
                    yield f"[Error: {item}]", True, None
                    break
                
                if not item.results:
                    continue
                result = item.results[0]
                if not result.alternatives:
                    continue
                
                transcript = result.alternatives[0].transcript
                is_final = result.is_final
                
                # Extract speaker tag (only available in final results with diarization)
                speaker_tag = None
                if is_final and hasattr(result.alternatives[0], 'words') and result.alternatives[0].words:
                    # Get speaker tag from first word (all words in result have same speaker)
                    first_word = result.alternatives[0].words[0]
                    if hasattr(first_word, 'speaker_tag'):
                        speaker_tag = first_word.speaker_tag
                
                yield transcript, is_final, speaker_tag
        finally:
            await feeder_task
            thread.join()

class MockTranscriber:
    """Mock transcriber for testing."""
    async def transcribe_stream(self, audio_generator: AsyncGenerator[bytes, None]):
        count = 0
        async for _ in audio_generator:
            count += 1
            if count % 20 == 0:
                yield f"Simulated text {count}", True
            else:
                yield f"Simulated...", False

class SmartAssistant:
    """Wraps LLM (Gemini) for Translation and Smart Replies."""
    def __init__(self, api_key: str = None):
        if api_key:
            genai.configure(api_key=api_key)
            # Using gemini-flash-latest which is confirmed working in tests
            self.model = genai.GenerativeModel('gemini-flash-latest')
            self.active = True
        else:
            logger.warning("Warning: No Gemini API Key provided.")
            self.active = False

    async def translate_text(self, text: str) -> dict:
        """Optimized for speed: Only translation with caching."""
        if not self.active:
            return {"translation": f"[Mock] {text}"}

        # Check cache first
        cached = translation_cache.get(text)
        if cached:
            logger.debug(f"✅ Cache HIT for: {text[:30]}...")
            return cached

        prompt = f"""
        Task: Translate (ES<->EN).
        Input: "{text}"
        Output JSON: {{"detected_language": "es|en", "translation": "text"}}
        """
        result = await self._call_gemini(prompt, default={"translation": f"[Error] {text}"})
        
        # If quota error, wrap it in translation field for frontend
        if "error" in result and result["error"] == "QUOTA_EXCEEDED":
            return {"translation": f"⚠️ {result['message']}"}
        
        # Cache successful translations
        if "translation" in result and not result.get("error"):
            translation_cache.set(text, result)
            logger.debug(f"💾 Cached translation for: {text[:30]}...")
        
        return result

    async def generate_smart_replies(self, text: str, level: str = "intermediate", tone: str = "casual", target_speaker: str = None) -> dict:
        """Generate context-aware smart replies with personalization."""
        if not self.active:
            return {"replies": ["[Mock] Reply 1", "[Mock] Reply 2"]}

        # Level-based complexity
        level_prompts = {
            "beginner": "very simple, max 3 words, basic vocabulary (e.g., 'Yes', 'I agree', 'Sounds good')",
            "intermediate": "short and clear, max 5 words, common phrases",
            "advanced": "professional, 5-10 words, varied vocabulary",
            "native": "natural with idioms, any length, native expressions"
        }
        
        # Tone-based style
        tone_prompts = {
            "formal": "professional and respectful",
            "casual": "friendly and relaxed",
            "friendly": "warm and approachable"
        }
        
        target_prefix = f"→ {target_speaker}: " if target_speaker else ""
        
        prompt = f"""
        Task: Generate 2 smart replies to{' ' + target_speaker if target_speaker else ''}: "{text}"
        Style: {level_prompts.get(level, level_prompts['intermediate'])}, {tone_prompts.get(tone, tone_prompts['casual'])} tone
        Format: {f'Prefix each reply with "→ {target_speaker}: "' if target_speaker else 'No prefix needed'}
        Output JSON: {{"replies": ["{target_prefix}reply1", "{target_prefix}reply2"]}}
        """
        return await self._call_gemini(prompt, default={"replies": [f"{target_prefix}Could not generate.", f"{target_prefix}Try again."]})
    async def generate_summary(self, text: str) -> dict:
        """Generate a session summary."""
        if not self.active or not text:
            return {"summary": "Summary unavailable (Mock/Empty)."}

        prompt = f"""
        Task: Brief bullet-point summary of this transcript (max 5 points).
        Input: "{text[-3000:]}"  # Context limit check
        Output JSON: {{"summary": "- Key point 1...\\n- Key point 2..."}}
        """
        return await self._call_gemini(prompt, default={"summary": "Could not generate summary."})

    async def _call_gemini(self, prompt: str, default: dict) -> dict:
        try:
            response = await self.model.generate_content_async(prompt)
            import json
            
            try:
                text_resp = response.text.strip()
            except ValueError:
                if response.candidates and response.candidates[0].content.parts:
                    text_resp = "".join([p.text for p in response.candidates[0].content.parts]).strip()
                else:
                    raise ValueError("Empty response")

            if text_resp.startswith("```json"):
                text_resp = text_resp[7:-3]
            return json.loads(text_resp)
        except Exception as e:
            error_msg = str(e)
            
            # Check if it's a quota/rate limit error
            if "ResourceExhausted" in error_msg or "429" in error_msg or "quota" in error_msg.lower():
                logger.error(f"Gemini Quota Exceeded: {e}")
                # Extract retry delay if available
                if "retry" in error_msg.lower():
                    return {"error": "QUOTA_EXCEEDED", "message": "Gemini API quota exceeded. Please wait a few minutes and try again."}
                return {"error": "QUOTA_EXCEEDED", "message": "API quota exceeded. Please wait 1-2 minutes."}
            
            logger.error(f"Gemini Error: {e}")
            return default
