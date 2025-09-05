Monorepo: Vue + Express Auth (Google)

Start Guide
- For a step-by-step first-time setup with tips and troubleshooting, see `Start.md`.

Structure
- apps/web: Vue 3 + Vite frontend (Firebase Auth)
- apps/api: Express.js backend (Firebase Admin token verification + Prisma)

Prerequisites
- Node 22+
- pnpm 10+ (enable via: `corepack enable`)
- Docker (for PostgreSQL via docker-compose)

Setup
1) Install deps: pnpm install
2) Configure backend env:
   - Copy apps/api/.env.example to apps/api/.env.local
   - Fill GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
   - Optionally adjust CLIENT_ORIGIN and ports

Development
1) Start database: docker-compose up -d
2) Install deps: pnpm install
3) Configure env:
   - Frontend: copy `apps/web/.env.example` → `apps/web/.env.local` (adjust `VITE_API_BASE` if API port differs)
   - Backend: copy `apps/api/.env.example` → `apps/api/.env` (Prisma) and/or `.env.local` (runtime)
4) Initialize database (Prisma Client is auto-generated before dev/build):
   - Apply migrations (dev): `pnpm --filter apps/api migrate:dev`
5) Run all: pnpm -r dev
   - Web on http://localhost:5173
   - API on http://localhost:4000

Firebase Auth Setup
- Firebase Console: create a project → enable Authentication → add a Web App
- Enable Google provider (or others) in Authentication → Sign-in method
- Frontend env (`apps/web/.env.local`):
  - VITE_FIREBASE_API_KEY=...
  - VITE_FIREBASE_AUTH_DOMAIN=...
  - VITE_FIREBASE_PROJECT_ID=...
- Backend env (`apps/api/.env`): Service Account (Project Settings → Service Accounts):
  - FIREBASE_PROJECT_ID=...
  - FIREBASE_CLIENT_EMAIL=...
  - FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n" (escape newlines as \n)

Auth Details
- See `docs/auth.md` for the full login flow, cookie/session settings, DB integration, and production notes.

Commands
- Build all: pnpm -r build
- Test all: pnpm -r test
- Lint/format: pnpm -r lint · pnpm -r format
 - DB up: docker-compose up -d · DB down: docker-compose down

Security
- Do not commit secrets; use .env.local
- Rotate credentials and limit scopes
