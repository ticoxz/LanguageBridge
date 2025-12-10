import os
from dotenv import load_dotenv

load_dotenv()

creds = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
print(f"GOOGLE_APPLICATION_CREDENTIALS: {creds}")

if creds:
    if os.path.exists(creds):
        print("✅ SUCCESS: File exists!")
        try:
            with open(creds, 'r') as f:
                content = f.read(50)
                print(f"First 50 chars: {content}")
        except Exception as e:
             print(f"❌ ERROR: Cannot read file: {e}")
    else:
        print(f"❌ ERROR: File does NOT exist at path: {creds}")
else:
    print("❌ ERROR: Variable not found in .env")
