# Tracker Starter (Phase‑1)

Stack: Angular 17 (frontend) + NestJS 10 (backend) + Postgres 16 + Redis 7 + MinIO + Nginx.

## Quick start
```bash
cp .env.example .env
docker compose up -d --build
# App → http://<SERVER_IP>/
# API → http://<SERVER_IP>/api/projects
# MinIO → http://<SERVER_IP>:9001 (admin/adminadmin)
```
