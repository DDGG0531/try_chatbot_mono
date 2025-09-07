Web (Vue 3 + Vite)

Scripts
- dev: vite (http://localhost:5173)
- build: vite build

Auth Flow (Firebase)
- Sign-in via Firebase SDK (Google Provider)
- Axios 攔截器自動附加 `Authorization: Bearer <idToken>` 到所有 API 請求
- Backend 驗證 ID token 並回傳目前使用者

Env
- Copy `.env.example` to `.env.local`
- `VITE_API_BASE`: API base URL（開發時由 Vite 以 `/api` 前綴代理到此位址）
- `VITE_FIREBASE_*`: Firebase Web App config

Dev Proxy
- 前端呼叫固定前綴 `/api/*`，Vite 於開發時轉發至 `VITE_API_BASE`，生產可由反向代理統一處理
