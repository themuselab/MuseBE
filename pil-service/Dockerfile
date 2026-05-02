FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
        curl \
        ca-certificates \
        unzip \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /fonts && \
    curl -L -o /tmp/pretendard.zip \
        https://github.com/orioncactus/pretendard/releases/download/v1.3.9/Pretendard-1.3.9.zip && \
    unzip -j /tmp/pretendard.zip "public/static/Pretendard-Bold.otf" -d /fonts && \
    unzip -j /tmp/pretendard.zip "public/static/Pretendard-Regular.otf" -d /fonts && \
    unzip -j /tmp/pretendard.zip "public/static/Pretendard-Medium.otf" -d /fonts && \
    mv /fonts/Pretendard-Bold.otf /fonts/Pretendard-Bold.ttf && \
    mv /fonts/Pretendard-Regular.otf /fonts/Pretendard-Regular.ttf && \
    mv /fonts/Pretendard-Medium.otf /fonts/Pretendard-Medium.ttf && \
    rm /tmp/pretendard.zip

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .

EXPOSE 8001

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
