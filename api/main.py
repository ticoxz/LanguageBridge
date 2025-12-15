import os
import asyncio
import json
import logging
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from services import Transcriber, MockTranscriber, SmartAssistant, UsageManager
from dotenv import load_dotenv

load_dotenv()

# Configure logging to file
logging.basicConfig(
    filename='backend.log',
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
        # Start transcription task
        async def process_transcription():
            async for transcript, is_final in transcriber.transcribe_stream(audio_generator()):
                if usage_manager.is_limit_exceeded(user_id):
                     await websocket.send_json({"error": "LIMIT_EXCEEDED"})
                     # We should probably stop here, but let's just notify
                
                # Send transcript update
                await websocket.send_json({
                    "type": "transcript",
                    "text": transcript,
                    "is_final": is_final
                })
                
                # If final, trigger LLM in background (only for phrases with 5+ words to save quota)
                if is_final:
                    # Count words to avoid wasting API calls on short phrases
                    word_count = len(transcript.strip().split())
                    
                    if word_count >= 2:
                        async def run_translation_flow(text_to_translate):
                            try:
                                print(f"DEBUG: Starting parallel/split flow for: {text_to_translate[:50]}...", flush=True)

                                # 1. Translation Priority Task
                                trans_res = await assistant.translate_text(text_to_translate)
                                if websocket.client_state.name == "CONNECTED":
                                    await websocket.send_json({
                                        "type": "translation_only",
                                        "original": text_to_translate,
                                        "translation": trans_res.get("translation", "")
                                    })
                                
                                # 2. Replies Secondary Task
                                replies_res = await assistant.generate_smart_replies(text_to_translate)
                                if websocket.client_state.name == "CONNECTED":
                                    await websocket.send_json({
                                        "type": "replies_only",
                                        "replies": replies_res.get("replies", [])
                                    })

                            except Exception as e:
                                print(f"Translation flow error: {e}", flush=True)
                                import traceback
                                traceback.print_exc()

                        asyncio.create_task(run_translation_flow(transcript))
                    else:
                        print(f"DEBUG: Skipping translation for short phrase ({word_count} words)", flush=True)

        transcription_task = asyncio.create_task(process_transcription())

        # Main receive loop
        while True:
            # Receive any message type (text, bytes, disconnect)
            message = await websocket.receive()
            
            # We only care about binary audio data
            if "bytes" not in message:
                # Skip text messages, pings, etc.
                continue
            
            data = message["bytes"]
            
            # Update usage
            usage_manager.update_usage(user_id)
            if usage_manager.is_limit_exceeded(user_id):
                 await websocket.send_json({"error": "LIMIT_EXCEEDED"})
                 break

            await audio_queue.put(data)

    except WebSocketDisconnect:
        logging.info(f"Client disconnected: {user_id}")
    except Exception as e:
        logging.error(f"Connection error: {type(e).__name__}: {e}")
        import traceback
        logging.error(traceback.format_exc())
    finally:
        # Cleanup
        logging.info(f"DEBUG: Entering finally block for user: {user_id}")
        usage_manager.end_session(user_id)
        await audio_queue.put(None) # Signal generator to stop
        if transcription_task:
            await transcription_task 
