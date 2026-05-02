# 배포 운영 매뉴얼 (BE)

운영 BE는 GCP VM(`muse-be`, asia-northeast3-a)에 docker-compose로 떠 있고, `https://api.themuselab.kr`로 외부 노출된다. 결정·구성 배경은 [기획서/11](../기획서/11_백엔드_GCP_배포_인프라.md) 참고.

## 핵심 정보

| 항목 | 값 |
|---|---|
| BE 엔드포인트 | https://api.themuselab.kr |
| Health | https://api.themuselab.kr/health |
| Swagger | https://api.themuselab.kr/api-docs |
| VM 외부 IP | 34.64.33.212 |
| GCP 프로젝트 | muse-be-2026 |
| 인증서 만료 | 2026-07-31 (cron 자동 갱신) |

## SSH 접속

```bash
gcloud compute ssh muse-be --zone=asia-northeast3-a
```

VM 내 작업 디렉토리: `~/muse-be`

## 자동 배포

### 트리거
- `main` 또는 `feat/ai-ad-generation` 브랜치에 push
- Actions 탭에서 수동 트리거 (workflow_dispatch)

### 흐름
GHA Ubuntu runner → SSH → VM에서:
```bash
git fetch && git reset --hard origin/$BRANCH
git checkout -f $BRANCH && git reset --hard origin/$BRANCH
docker compose build be
docker compose up -d be
docker compose exec -T be npx prisma migrate deploy
docker image prune -f
curl -fsS http://127.0.0.1:4000/health
```

### 실패 시 디버깅
1. GitHub → Actions 탭 → 실패한 run → "SSH and redeploy" 단계 로그 확인
2. VM에서 직접:
   ```bash
   gcloud compute ssh muse-be --zone=asia-northeast3-a
   cd ~/muse-be
   git log --oneline -3                  # 코드 동기화 됐는지
   docker compose ps                      # 컨테이너 상태
   docker compose logs --tail 100 be      # BE 로그
   ```

## 수동 재배포

```bash
gcloud compute ssh muse-be --zone=asia-northeast3-a
cd ~/muse-be
git pull
./scripts/deploy-vm.sh
```

## 롤백

특정 커밋으로 되돌리기:
```bash
gcloud compute ssh muse-be --zone=asia-northeast3-a
cd ~/muse-be
git checkout <SHA>
docker compose build be
docker compose up -d be
```

`prisma migrate` 롤백은 위험 — 대신 새 마이그레이션으로 forward fix.

## 환경변수 변경

```bash
gcloud compute ssh muse-be --zone=asia-northeast3-a
nano ~/muse-be/.env
# 저장 후 BE만 재시작
cd ~/muse-be && docker compose up -d be
```

`.env`는 VM에만 존재(git 미추적). 추가 키가 필요하면 `.env.production.example`도 갱신 후 커밋.

## DB 작업

### 마이그레이션 적용 (수동)
```bash
docker compose exec be npx prisma migrate deploy
```

### Prisma Studio (포트 포워딩)
```bash
# 로컬 PC에서:
gcloud compute ssh muse-be --zone=asia-northeast3-a -- -L 5555:localhost:5555
# VM에서:
docker compose exec be npx prisma studio
# 로컬 브라우저에서 http://localhost:5555
```

### DB 직접 접속
```bash
docker compose exec db psql -U postgres -d muse
```

### 시드 (카탈로그 mock)
```bash
docker compose exec be npx tsx prisma/seed.ts
```

## HTTPS 인증서

- 발급: 최초 1회 `sudo certbot --nginx -d api.themuselab.kr`
- 자동 갱신: `certbot.timer` (90일 주기)
- 수동 갱신 테스트: `sudo certbot renew --dry-run`
- 만료 확인: `sudo certbot certificates`

## nginx

- 설정 파일: `/etc/nginx/sites-available/muse` (저장소의 [nginx/muse.conf](nginx/muse.conf) 동기화)
- 변경 후: `sudo nginx -t && sudo systemctl reload nginx`
- 로그: `sudo tail -f /var/log/nginx/access.log` / `error.log`

## GitHub Actions Secrets

| Name | 값 |
|---|---|
| `VM_HOST` | 34.64.33.212 |
| `VM_USER` | (VM의 ssh 유저명) |
| `VM_SSH_KEY` | deploy 전용 ed25519 비밀키 (VM `~/.ssh/deploy`) |

키 회전 시:
```bash
# VM에서
ssh-keygen -t ed25519 -f ~/.ssh/deploy -N ''
cat ~/.ssh/deploy.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/deploy   # 출력값을 GitHub Secrets VM_SSH_KEY에 갱신
```

## 백업

### DB 덤프
```bash
docker compose exec -T db pg_dump -U postgres muse > muse-$(date +%Y%m%d).sql
```

### 디스크 스냅샷 (GCP)
```bash
gcloud compute disks snapshot muse-be --zone=asia-northeast3-a --snapshot-names=muse-be-$(date +%Y%m%d)
```

## 비용 통제

- 예산 알림: 월 ₩30,000, 50/90/100% 도달 시 메일
- 무료 크레딧 만료: 2026-06-12
- VM 정지(과금 중단, 디스크 유지): `gcloud compute instances stop muse-be --zone=asia-northeast3-a`
- VM 재시작: `gcloud compute instances start muse-be --zone=asia-northeast3-a` (외부 IP는 예약돼서 그대로 유지)

## 흔한 트러블슈팅

| 증상 | 원인/해결 |
|---|---|
| 502 Bad Gateway | BE 컨테이너 다운. `docker compose logs be`로 원인 확인 후 `docker compose up -d be` |
| Mixed Content 차단 | FE가 `http://`로 호출. Vercel `NEXT_PUBLIC_API_URL`이 `https://`로 시작하는지 확인 |
| CORS 에러 | `.env`의 `FRONTEND_URL`이 정확한 Vercel 도메인인지 확인 후 BE 재시작 |
| 워크플로 git checkout 충돌 | VM 작업본이 dirty. 워크플로의 `git reset --hard`가 자동 정리하지만, 수동 정리 시 `cd ~/muse-be && git fetch && git reset --hard origin/$BRANCH` |
| 인증서 갱신 실패 | `sudo certbot renew --dry-run`으로 원인 파악. 보통 nginx :80 차단 또는 DNS 변경 |
| `prisma migrate deploy` 실패 | DB 컨테이너 down 또는 마이그레이션 충돌. `docker compose ps db` 확인 |

## 변경 시 사전 승인 필요

다음 변경은 사용자 승인 후 진행:

- VM 머신 타입 변경 (e2-small → e2-medium 등 비용 영향)
- 새 외부 노출 포트
- DB 스키마 큰 변경 (downtime 동반)
- nginx config 큰 변경
- `.env` 신규 키 추가로 인한 코드 변경
