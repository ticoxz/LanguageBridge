import os
import time
import asyncio
import queue
import threading
from typing import AsyncGenerator
from google.cloud import speech
import google.generativeai as genai
from collections import defaultdict

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
            print("DEBUG: Queue feeder started", flush=True)
            try:
                async for content in audio_generator:
                    count += 1
                    bridge_queue.put(content)
                    if count % 50 == 0:
                        print(f"DEBUG: Fed {count} chunks", flush=True)
                print("DEBUG: Audio generator done", flush=True)
                bridge_queue.put(None)
            except Exception as e:
                print(f"Feeder error: {e}", flush=True)
                bridge_queue.put(None)
        
        feeder_task = asyncio.create_task(feed_queue())
        result_queue = asyncio.Queue()
        session_done = {"value": False}
        
        def transcribe_thread():
            print("DEBUG: Transcribe thread started", flush=True)
            
            while not session_done["value"]:
                try:
                    print("DEBUG: Starting Google Speech stream...", flush=True)
                    
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
                    
                    print("DEBUG: Waiting for responses...", flush=True)
                    count = 0
                    for response in responses:
                        count += 1
                        if count % 10 == 0:
                            print(f"DEBUG: Got {count} responses", flush=True)
                        loop.call_soon_threadsafe(result_queue.put_nowait, response)
                    
                    print(f"DEBUG: Stream ended ({count} responses)", flush=True)
                    
                except Exception as e:
                    print(f"DEBUG: Stream error: {e}", flush=True)
                    import traceback
                    traceback.print_exc()
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
            # gemini-pro has separate quota from flash models
            self.model = genai.GenerativeModel('gemini-pro')
            self.active = True
        else:
            print("Warning: No Gemini API Key provided.")
            self.active = False

    async def generate_replies(self, text: str, target_lang: str = "auto"):
        if not self.active:
            return {
                "translation": f"[Mock] {text}",
                "replies": ["Ok", "Tell me more", "Next"]
            }

        # Auto-detect language and translate to opposite
        prompt = f"""
        Analyze the following text and:
        1. Detect if it's in Spanish or English
        2. If Spanish, translate to English
        3. If English, translate to Spanish
        4. Provide 3 short, professional smart replies in the SAME language as the input
        
        Input Text: "{text}"
        
        Output Format (JSON):
        {{
            "detected_language": "es" or "en",
            "translation": "Translated text here",
            "replies": ["Reply 1", "Reply 2", "Reply 3"]
        }}
        """
        
        try:
            response = await self.model.generate_content_async(prompt)
            import json
            text_resp = response.text.strip()
            if text_resp.startswith("```json"):
                text_resp = text_resp[7:-3]
            data = json.loads(text_resp)
            return data
        except Exception as e:
            print(f"LLM Error: {e}")
            return {
                "translation": f"[Error] {text}",
                "replies": ["Error"]
            }
