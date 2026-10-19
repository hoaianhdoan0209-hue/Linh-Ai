FROM python:3.12-slim-bookworm
# Receiver processes frames in RAM; no recording or cloud OCR services.
RUN apt-get update &&     DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends       ca-certificates nginx libnginx-mod-rtmp ffmpeg       tesseract-ocr tesseract-ocr-eng tesseract-ocr-vie &&     rm -rf /var/lib/apt/lists/* && mkdir -p /app /run/nginx
WORKDIR /app
COPY server.py nginx.conf start.sh ./
ENV PORT=8080 PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
EXPOSE 8080 1935
CMD ["bash", "/app/start.sh"]
