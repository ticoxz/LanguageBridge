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
        self.config = speech.RecognitionConfig(
            encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
            sample_rate_hertz=16000,
            language_code=self.language_code,
            enable_automatic_punctuation=True,
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
                    yield f"[Error: {item}]", True
                    break
                
                if not item.results:
                    continue
                result = item.results[0]
                if not result.alternatives:
                    continue
                
                transcript = result.alternatives[0].transcript
                is_final = result.is_final
                yield transcript, is_final
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
        """Optimized for speed: Only translation."""
        if not self.active:
            return {"translation": f"[Mock] {text}"}

        prompt = f"""
        Task: Translate (ES<->EN).
        Input: "{text}"
        Output JSON: {{"detected_language": "es|en", "translation": "text"}}
        """
        return await self._call_gemini(prompt, default={"translation": f"[Error] {text}"})

    async def generate_smart_replies(self, text: str) -> dict:
        """Generate replies separately."""
        if not self.active:
            return {"replies": ["Mock R1", "Mock R2"]}

        prompt = f"""
        Task: 2 short smart replies (max 5 words, match input lang).
        Input: "{text}"
        Output JSON: {{"replies": ["r1", "r2"]}}
        """
        return await self._call_gemini(prompt, default={"replies": []})

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
            logger.error(f"Gemini Error: {e}")
            return default
