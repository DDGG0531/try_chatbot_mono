# Start Guide

A quick guide to run this monorepo (Vue + Express + Google Login + Prisma + PostgreSQL).

## Quick Start

1) Prerequisites
- Node 22+
- pnpm 10+ (recommended via Corepack)
- Docker (for PostgreSQL)

2) Enable pnpm
- corepack enable
- corepack prepare pnpm@10.15.1 --activate
- pnpm --version  # should print 10.x

3) Start DB
- docker compose up -d

4) Install deps
- pnpm install

5) Configure env
- Frontend: copy `apps/web/.env.example` → `apps/web/.env.local`
  - `VITE_API_BASE=http://localhost:4000`
  - `VITE_FIREBASE_API_KEY=...`
  - `VITE_FIREBASE_AUTH_DOMAIN=...`
  - `VITE_FIREBASE_PROJECT_ID=...`
- Backend: copy `apps/api/.env.example` → `apps/api/.env`
  - `FIREBASE_PROJECT_ID=...`
  - `FIREBASE_CLIENT_EMAIL=...`
  - `FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"`（將換行轉為 \n）

6) Init Prisma
- Prisma Client is generated automatically before dev/build (`predev`/`prebuild`)
- Run migrations (dev): `pnpm --filter api migrate:dev`
  - 若需非互動指定名稱：`pnpm --filter api migrate:dev -- --name init`

7) Run dev
- pnpm -r dev
- Open http://localhost:5173 and click “Sign in with Google” (Firebase popup)

## Firebase Setup Notes
- Console → Authentication → Sign-in method：啟用 Google（或其他提供者）
- Console → Project Settings → General：取得 Web App Config（填入前端 env）
- Console → Project Settings → Service Accounts：產生私密金鑰（填入後端 env）

## What’s Running
- Frontend (Vite) on `http://localhost:5173`
  - Dev proxy forwards `/api` and `/auth` to `http://localhost:4000`
- Backend (Express) on `http://localhost:4000`
  - `/auth/google`, `/auth/google/callback`, `/auth/logout`
  - `/api/me`
- Database: PostgreSQL 16 via Docker, port `5432`

## Troubleshooting
- redirect_uri_mismatch
  - Make sure Google Console redirect URI is exactly `http://localhost:4000/auth/google/callback`
  - Ensure `GOOGLE_CALLBACK_URL` matches the same value in `apps/api/.env`
- Prisma client not initialized
  - Run `pnpm --filter api prisma:generate` again after dependency updates
- Database connection refused
  - Check `docker compose ps` and logs: `docker compose logs -f postgres`
  - Verify `DATABASE_URL` in `apps/api/.env`
- Port already in use
  - Change API port in `apps/api/.env` → `PORT=4001`
  - Update `CLIENT_ORIGIN` and frontend `VITE_API_BASE`, and Google Console redirect URI accordingly
- CORS/session issues
  - Local dev uses cookie `sameSite=lax`, `secure=false`; works on HTTP localhost
  - For cross-site or HTTPS in prod, use `secure=true` and `sameSite=none`, and set `app.set('trust proxy', 1)` behind a proxy

## Production Notes (outline)
- Frontend
  - Build: `pnpm --filter web build` → serve `apps/web/dist/`
- Backend (recommended)
  - Build: `pnpm --filter api build`
  - Start: `pnpm --filter api start`
  - Ensure env set (no dev-only tools in runtime)
- Database
  - Use managed Postgres or provision via IaC; set `DATABASE_URL`

## Useful Commands
- Start DB: `docker compose up -d`
- Stop DB: `docker compose down`
- Prisma generate: `pnpm --filter api prisma:generate`
- Migrate (dev): `pnpm --filter api migrate:dev`
- Migrate (deploy): `pnpm --filter api migrate:deploy`
- Dev all: `pnpm -r dev`
- Build all: `pnpm -r build`

## Folder Structure (high level)
- apps/web: Vue 3 + Vite frontend
- apps/api: Express + Passport Google + Prisma backend
- docs/: docs, specs, ADRs
- docker-compose.yml: local PostgreSQL

## Security & Env
- Never commit secrets; only commit `*.env.example`
- Frontend env must be prefixed with `VITE_` (no secrets)
- Backend loads `.env` and `.env.local`; Prisma also reads `.env`

Enjoy building! If any step fails, copy the exact error and we’ll help diagnose.
