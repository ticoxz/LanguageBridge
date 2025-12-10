# LanguageBridge (Traductor Serverless para Reuniones)

Extensión de Chrome que proporciona traducción de voz en tiempo real y respuestas inteligentes ("Copilot Invisible") para Google Meet y Zoom using Google Cloud Run y Gemini.

## Estructura del Proyecto

- **api/**: Backend Serverless (FastAPI, Python). Maneja WebSockets, Speech-to-Text y LLM.
- **extension/**: Frontend (Chrome Extension, React). Captura audio e inyecta la interfaz de usuario.

## Inicio Rápido

### Backend
Ver `api/README.md` (o documentación en Walkthrough) para configurar credenciales y correr el servidor.

### Extension
Ver `extension/README.md` (o documentación en Walkthrough) para compilar y cargar la extensión.

## Arquitectura
- **Audio Stream**: WebSocket (Raw PCM 16kHz) -> Cloud Run.
- **STT**: Google Cloud Speech-to-Text Streaming.
- **Intelligence**: Gemini 1.5 Flash (Traducción + Smart Replies).
- **Cost Control**: UsageManager limita a 15 mins/sesión.

Created with ❤️ by tico
