FROM python:3.11-slim

WORKDIR /app

# Install system deps
RUN apt-get update && apt-get install -y \
    libasound2-dev \
    inotify-tools \
    && rm -rf /var/lib/apt/lists/*

# Copy only backend code
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

EXPOSE 8080

CMD ["uvicorn", "QueueScan:app", "--host", "0.0.0.0", "--port", "8080", "--reload"]

