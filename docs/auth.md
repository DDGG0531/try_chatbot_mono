# Auth Design (Firebase)

本專案改採 Firebase Authentication 作為登入機制：
- 前端：使用 Firebase JS SDK 執行 Google 登入（或其他提供者）。SDK 會自動管理 access token/refresh token 的生命週期。
- 後端：使用 Firebase Admin SDK 驗證前端送來的 ID Token，並以 Prisma 在本地資料庫 upsert 使用者資訊。

## 流程
1) 前端呼叫 `signInWithPopup(GoogleAuthProvider)` 完成登入；Firebase SDK 會持續維護使用者狀態與自動刷新 ID Token。
2) 前端呼叫 API 時，從 `currentUser.getIdToken()` 取得最新 ID Token，放在 `Authorization: Bearer <token>` header。
3) 後端中介層以 Admin SDK `verifyIdToken` 驗證 token，驗證通過後：
   - 以 Prisma `upsert` 將使用者（uid、name、email、picture）寫入/更新本地資料庫（`provider: 'firebase'`）。
   - 將最小化的使用者物件放到 `req.user`（不使用伺服器 session）。
4) 業務路由即可透過 `req.user` 取得使用者身分；未驗證則回 401。

## 端點
- `GET /api/me`：需要登入；回傳已驗證使用者（由中介層注入）。
- `GET /api/health`：健康檢查。

## 前端整合
- 初始化：`apps/web/src/lib/firebase.ts`。
- 登入/登出：在 `apps/web/src/lib/api.ts` 暴露 `loginWithGoogle`、`logout`，並於 `Home.vue` 與 `Profile.vue` 透過 Firebase `onAuthStateChanged` 監聽狀態。
- 取用 API：`fetchMe()` 會自動附上 `Authorization: Bearer <idToken>`。

## 資料庫整合（Prisma）
- `User` 模型以 Firebase `uid` 作為主鍵 `id`；`provider` 設為 `firebase`。
- 每次驗證成功會 upsert 使用者（同步名稱、email、頭像）。

## 環境變數
- 前端（`apps/web/.env.local`）：
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
- 後端（`apps/api/.env`）：
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_CLIENT_EMAIL`
  - `FIREBASE_PRIVATE_KEY`（將金鑰換行以 `\n` 轉義）

## 安全注意事項
- ID Token 放在 Authorization header，不使用 localStorage 保存；由 SDK 自動刷新。
- CORS 僅需允許指定 `origin` 與 `Authorization` header。
- 不使用伺服器端 session；多機部署只需共享 Admin 憑證即可驗證。

## 變更與擴充
- 若未來需要以 Cookie 攜帶 Session，可使用 Firebase Session Cookies（Admin API `createSessionCookie`）；但目前設計採 Authorization header，更精簡。
- 權限控管可在 ID Token 中使用自訂 claims（Admin SDK 設定），或在 DB 中維護角色並於業務路由查詢/快取。

