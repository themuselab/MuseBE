#!/usr/bin/env bash
# VM에서 첫 배포 시 한 번만 실행하는 부트스트랩.
# 이후 갱신 배포는 GitHub Actions가 자동으로 git pull + docker compose up.
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo ".env 가 없습니다. .env.production.example 복사 후 시크릿 채우세요." >&2
  exit 1
fi

echo "[deploy] docker compose build & up..."
docker compose pull db redis || true
docker compose build be pil-service
docker compose up -d

echo "[deploy] DB 준비 대기..."
until docker compose exec -T db pg_isready -U "${POSTGRES_USER:-postgres}" >/dev/null 2>&1; do
  sleep 2
done

echo "[deploy] prisma migrate deploy..."
docker compose exec -T be npx prisma migrate deploy

echo "[deploy] catalog seed (idempotent)..."
docker compose exec -T be npx prisma db seed || echo "(seed 스킵 또는 이미 적용됨)"

echo "[deploy] health check..."
sleep 3
curl -fsS http://127.0.0.1:4000/health && echo " ✓"

echo "[deploy] done."
