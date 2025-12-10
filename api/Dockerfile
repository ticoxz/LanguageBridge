FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
# ffmpeg might be needed for audio processing libraries
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Cloud Run expects the container to listen on $PORT, default 8080
ENV PORT=8080

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
