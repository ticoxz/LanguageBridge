import os
from dotenv import load_dotenv
from google.cloud import speech

# Load env vars
load_dotenv()
creds_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
print(f"Creds path: {creds_path}")

try:
    client = speech.SpeechClient()
    config = speech.RecognitionConfig(
        encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
        sample_rate_hertz=16000,
        language_code="en-US",
    )
    # Dummy audio (1 sec of silence)
    audio = speech.RecognitionAudio(content=b'\0' * 32000)

    print("Attempting to talk to Google Cloud...")
    response = client.recognize(config=config, audio=audio)
    print("✅ Success! API is working.")
except Exception as e:
    print(f"\n❌ ERROR CAUGHT:\n{e}")
