FROM python:3.12-slim

WORKDIR /app

# Install dependencies first (cached as a separate layer)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY src/ ./src/
COPY ingest.py .

# Chroma and raw data are mounted as volumes (see docker-compose.yml)
# so they persist between container restarts without being baked into the image.

EXPOSE 8000

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
