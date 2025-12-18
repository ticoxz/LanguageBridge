import os
import asyncio
import json
import logging
import time
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from services import Transcriber, MockTranscriber, SmartAssistant, UsageManager
from dotenv import load_dotenv
from debug_utils import log_crash

load_dotenv()

# Configure logging to file
logging.basicConfig(
    filename='debug_backend.log',
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    force=True
)

app = FastAPI(title="LanguageBridge API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Managers
usage_manager = UsageManager()
llm_api_key = os.getenv("GEMINI_API_KEY")
assistant = SmartAssistant(api_key=llm_api_key)

# Determine Transcriber
# Using Mock if no creds file found to avoid crash on startup
creds_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
if creds_path and os.path.exists(creds_path):
    print("Using Google Cloud Speech Transcriber")
    transcriber_class = Transcriber
else:
    print("WARNING: GOOGLE_APPLICATION_CREDENTIALS not found. Using Mock Transcriber.")
    transcriber_class = MockTranscriber

@app.get("/")
def health_check():
    return {"status": "ok", "service": "LanguageBridge Endpoint"}

@app.get("/cache/stats")
def cache_stats():
    from cache_manager import translation_cache
    return translation_cache.get_stats()

@app.websocket("/ws/audio")
async def audio_stream(websocket: WebSocket, user_id: str = Query(..., description="User ID for usage tracking")):
    await websocket.accept()
    
    # Check limit immediately
    if usage_manager.is_limit_exceeded(user_id):
        await websocket.send_json({"error": "LIMIT_EXCEEDED", "message": "15-minute free tier limit reached."})
        await websocket.close()
        return

    usage_manager.start_session(user_id)
    print(f"Session started for user: {user_id}")

    # Queues for passing data between loops
    audio_queue = asyncio.Queue()
    session_transcript = []  # Store full session text
    
    async def audio_generator():
        """Yields audio chunks from the queue."""
        while True:
            chunk = await audio_queue.get()
            if chunk is None:
                break
            yield chunk

    transcriber = transcriber_class()
    
    # We run the transcription loop as a task
    transcription_task = None
    
    try:
        # Speaker context for handling interruptions
        speaker_context = {}  # {speaker_tag: {"fragment": str, "timestamp": float}}
        CONTEXT_TIMEOUT = 10  # seconds
        
        # Start transcription task
        async def process_transcription():
            nonlocal speaker_context
            current_translation_task = None
            last_speaker = None
            
            async for transcript, is_final, speaker_tag in transcriber.transcribe_stream(audio_generator()):
                if usage_manager.is_limit_exceeded(user_id):
                     await websocket.send_json({"error": "LIMIT_EXCEEDED"})
                     # We should probably stop here, but let's just notify
                
                # Context Continuation: Handle interrupted speech
                current_time = time.time()
                full_transcript = transcript
                
                if is_final and speaker_tag:
                    # Check if this speaker was interrupted recently
                    if speaker_tag in speaker_context:
                        ctx = speaker_context[speaker_tag]
                        time_diff = current_time - ctx["timestamp"]
                        
                        # If within timeout and speaker changed (was interrupted)
                        if time_diff < CONTEXT_TIMEOUT and last_speaker != speaker_tag:
                            # Concatenate previous fragment
                            full_transcript = ctx["fragment"] + " " + transcript
                            print(f"🔗 Context continuation for Speaker {speaker_tag}: '{ctx['fragment']}' + '{transcript}'", flush=True)
                            # Clear the context since we used it
                            del speaker_context[speaker_tag]
                    
                    # Update last speaker
                    last_speaker = speaker_tag
                
                # Store context for potential interruption (only for final transcripts)
                if is_final and speaker_tag and len(transcript.strip().split()) >= 3:
                    speaker_context[speaker_tag] = {
                        "fragment": full_transcript,
                        "timestamp": current_time
                    }
                
                # Send transcript update (use full_transcript with context if available)
                print(f"📝 Transcript: '{full_transcript}' (final={is_final}, speaker={speaker_tag})", flush=True)
                await websocket.send_json({
                    "type": "transcript",
                    "text": full_transcript,
                    "is_final": is_final,
                    "speaker": speaker_tag
                })
                
                # Predictive translation: Start translating on interim results with 3+ words
                word_count = len(full_transcript.strip().split())
                
                if word_count >= 3:
                    # Cancel previous interim translation if still running
                    if current_translation_task and not current_translation_task.done() and not is_final:
                        current_translation_task.cancel()
                    
                    async def run_translation_flow(text_to_translate, is_final_translation):
                        try:
                            print(f"DEBUG: Starting {'FINAL' if is_final_translation else 'INTERIM'} translation for: {text_to_translate[:50]}...", flush=True)

                            # Execute both tasks in parallel to reduce total latency
                            try:
                                trans_task = asyncio.create_task(assistant.translate_text(text_to_translate))
                                
                                # Only generate replies for final transcripts
                                if is_final_translation:
                                    replies_task = asyncio.create_task(assistant.generate_smart_replies(text_to_translate))
                                    trans_res, replies_res = await asyncio.gather(trans_task, replies_task)
                                else:
                                    trans_res = await trans_task
                                    replies_res = {"replies": []}

                                if websocket.client_state.name == "CONNECTED":
                                    # Send Translation
                                    await websocket.send_json({
                                        "type": "translation_only",
                                        "original": text_to_translate,
                                        "translation": trans_res.get("translation", "")
                                    })
                                    
                                    # Send Replies (only for final)
                                    if is_final_translation:
                                        await websocket.send_json({
                                            "type": "replies_only",
                                            "replies": replies_res.get("replies", [])
                                        })
                            except asyncio.CancelledError:
                                print(f"DEBUG: Translation cancelled (newer interim arrived)", flush=True)
                                raise
                            except Exception as e:
                                print(f"Parallel execution error: {e}")

                        except asyncio.CancelledError:
                            pass  # Silently ignore cancellation
                        except Exception as e:
                            print(f"Translation flow error: {e}", flush=True)
                            import traceback
                            traceback.print_exc()

                    current_translation_task = asyncio.create_task(run_translation_flow(full_transcript, is_final))
                    
                    # For final transcripts, also append to session history
                    if is_final:
                        session_transcript.append(full_transcript + " ")
                else:
                    print(f"DEBUG: Skipping translation for short phrase ({word_count} words)", flush=True)

        transcription_task = asyncio.create_task(process_transcription())

        # Main receive loop
        while True:
            # Receive any message type (text, bytes, disconnect)
            try:
                message = await websocket.receive()
            except RuntimeError:
                print(f"DEBUG: Client disconnected (RuntimeError): {user_id}")
                break
            
            if message["type"] == "websocket.disconnect":
                logging.info(f"DEBUG: Client disconnected (event): {user_id}")
                print(f"DEBUG: Client disconnected (event): {user_id}")
                break
            
            # ... (text message handling skipped for brevity if not changing) ...

            # Handle Text Messages (Commands like 'request_summary')
            if "text" in message:
                try:
                    data = json.loads(message["text"])
                    
                    # Ignore ping messages (keepalive)
                    if data.get("type") == "ping":
                        continue
                    
                    if data.get("type") == "request_summary":
                        full_text = "".join(session_transcript)
                        logging.debug(f"DEBUG: Generating summary request")
                        print(f"DEBUG: Generating summary for: {full_text[:50]}...")
                        summary_res = await assistant.generate_summary(full_text)
                        await websocket.send_json({
                            "type": "summary",
                            "summary": summary_res.get("summary", "No summary generated.")
                        })
                except Exception as e:
                    logging.error(f"Text message error: {e}")
                continue

            # We only care about binary audio data
            if "bytes" not in message:
                continue
            
            data = message["bytes"]
            
            # Update usage
            usage_manager.update_usage(user_id)
            if usage_manager.is_limit_exceeded(user_id):
                 logging.warning(f"LIMIT EXCEEDED for {user_id}")
                 await websocket.send_json({"error": "LIMIT_EXCEEDED"})
                 break

            await audio_queue.put(data)

    except WebSocketDisconnect:
        logging.info(f"Client disconnected: {user_id}")
    except Exception as e:
        log_crash(e, context=f"audio_stream user={user_id}")
        logging.error(f"Connection error: {type(e).__name__}: {e}")
        # import traceback
        # logging.error(traceback.format_exc())
    finally:
        # Cleanup
        logging.info(f"DEBUG: Entering finally block for user: {user_id}")
        usage_manager.end_session(user_id)
        await audio_queue.put(None) # Signal generator to stop
        if transcription_task:
            await transcription_task 
