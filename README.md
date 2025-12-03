# LanguageBridge 🌉

**LanguageBridge** is a Micro-SaaS designed to eliminate language barriers in remote team meetings. It acts as an invisible "Copilot" providing real-time subtitles, smart replies, and meeting summaries.

## Project Structure

The project is organized as a monorepo:

- **`/web`**: Next.js application for the Landing Page, User Dashboard, and Authentication.
- **`/extension`**: Vite + React application for the Chrome Extension (the core product).
- **`/api`**: Python FastAPI backend for handling audio streaming, translation, and AI logic.

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- Google Cloud Account (for API keys)

### Installation

1.  **Web**:
    ```bash
    cd web
    npm install
    npm run dev
    ```

2.  **Extension**:
    ```bash
    cd extension
    npm install
    npm run dev
    ```

3.  **API**:
    ```bash
    cd api
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    pip install -r requirements.txt
    uvicorn main:app --reload
    ```

## Tech Stack
- **Frontend**: React, Next.js, Vite, Tailwind CSS, TypeScript.
- **Backend**: Python, FastAPI, WebSockets.
- **AI**: Deepgram (STT), Google Gemini (LLM).
- **Infra**: Google Cloud Run, Firebase.

---
Made with ❤️ by ticoxz
