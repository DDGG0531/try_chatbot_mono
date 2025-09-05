Web (Vue 3 + Vite)

Scripts
- dev: vite (http://localhost:5173)
- build: vite build

Auth Flow (Firebase)
- Sign-in via Firebase SDK (Google Provider)
- `fetchMe` includes `Authorization: Bearer <idToken>`
- Backend verifies ID token and returns current user

Env
- Copy `.env.example` to `.env.local`
- `VITE_API_BASE`: API base URL used by dev proxy (default `http://localhost:4000`)
- `VITE_FIREBASE_*`: Firebase Web App config
