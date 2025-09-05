API (Express + Firebase Admin Auth)

Env
- Copy `.env.example` to `.env` and fill values
- Firebase Admin (Service Account): `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`

Key Routes
- GET /api/me -> Current user (requires Authorization: Bearer <idToken>) or 401

Dev
- Start Postgres: `docker-compose up -d`
- Generate Prisma client: auto via predev/prebuild; or `pnpm prisma:generate`
- Apply migrations (dev): `pnpm migrate:dev`
- Apply migrations (deploy): `pnpm migrate:deploy`
- dev: `pnpm dev` (http://localhost:4000)
