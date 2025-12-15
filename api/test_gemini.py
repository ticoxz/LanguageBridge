import os
import asyncio
from dotenv import load_dotenv
import google.generativeai as genai

# Load env vars
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

print(f"API Key found: {'Yes' if api_key else 'No'}")

if api_key:
    genai.configure(api_key=api_key)
    try:
        model = genai.GenerativeModel('gemini-flash-latest')
        print("Sending request to Gemini (gemini-flash-latest)...")
        response = model.generate_content("Say 'Hello' in Spanish.")
        print(f"✅ Success! Response: {response.text}")
    except Exception as e:
        print(f"\n❌ ERROR CAUGHT:\n{e}")
else:
    print("❌ ERROR: No GEMINI_API_KEY in .env")
