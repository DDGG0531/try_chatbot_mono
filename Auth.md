# Auth Design

本專案的登入採用「Google OAuth + 伺服器端 Session（Cookie）」機制，並在登入成功後透過 Prisma 將 Google 會員資料整合到本地資料庫。

## 概觀
- 身分提供者：Google（OAuth 2.0, OpenID Connect 基礎）
- 後端：Express + Passport（`passport-google-oauth20`）
- Session：`express-session` 以 Cookie 儲存 Session ID（預設 cookie 名稱 `connect.sid`）
- 前端：Vue（以 top-level redirect 觸發 `/auth/google`）
- 資料庫：PostgreSQL（Prisma ORM）

## 登入流程（Cookie Session）
1. 使用者在前端按下「Sign in with Google」，前端導向 `/auth/google`。
2. 後端透過 Passport 導向 Google 的授權頁面（scope：`profile`、`email`）。
3. 使用者完成授權後，Google 以 redirect 導回後端 `/auth/google/callback`。
4. 後端在 callback 中以 Passport 驗證成功後：
   - 以 Prisma `upsert` 使用者資料到資料庫（以 Google `profile.id` 當作主鍵）。
   - 將最小化使用者物件序列化進 Session（存放於後端 Session Store；Cookie 只存 Session ID）。
   - 以 302 redirect 導回前端（預設 `POST_LOGIN_REDIRECT` → `/`）。
5. 前端再以 `GET /api/me` 取得登入使用者資訊（若未登入回 401）。
6. 登出：前端呼叫 `POST /auth/logout`，後端銷毀 Session 並清除 Cookie。

## Cookie / Session 設定
- Cookie 名稱：`connect.sid`（express-session 預設）
- 屬性（開發環境）：
  - `httpOnly: true`（無法被 JS 讀取）
  - `sameSite: 'lax'`（阻擋大部分跨站請求，且允許 top-level 導向）
  - `secure: false`（本機 HTTP，正式環境應改為 `true`）
- 注意事項（正式環境）：
  - 若前後端跨網域，需要：`sameSite: 'none'` 且 `secure: true`。
  - 反向代理後需 `app.set('trust proxy', 1)` 以確保 secure cookie 正常。
  - 變更為可靠的 Session Store（Redis 等），避免 MemoryStore 用於生產。
  - 登入成功後建議「重新產生 Session ID」（Session Fixation 防護）。

## 資料庫整合（Prisma）
- Schema：`apps/api/prisma/schema.prisma`
  - `User` 模型：
    - `id: String`（使用 Google `profile.id` 作為主鍵）
    - `displayName: String`
    - `email: String? @unique`
    - `photo: String?`
    - `provider: String`（固定 'google'）
    - `createdAt`, `updatedAt`
- 實作：`apps/api/src/server.ts`
  - Google callback 內使用 `prisma.user.upsert` 寫入/更新使用者資訊（名稱、email、頭像）。
  - 只將最小化的 `SessionUser` 放入 Session（`id`, `displayName`, `email`, `photo`）。

## 相關 API 路由
- `GET /auth/google`：開始 Google OAuth 流程
- `GET /auth/google/callback`：OAuth 完成後回呼（建立/更新使用者與 Session，並 redirect）
- `POST /auth/logout`：登出（銷毀 Session + 清除 Cookie）
- `GET /api/me`：取得當前使用者（未登入回 401）

## 前端行為
- 登入：`window.location.href = '/auth/google'`（開發下由 Vite proxy 轉發到 API）。
- 登出：呼叫 `POST /auth/logout` 後刷新頁面或更新狀態。
- 取得使用者：`GET /api/me`（需附帶 Cookie，fetch 須設定 `credentials: 'include'`）。

## 安全建議
- OAuth 設定：
  - Authorized JavaScript origins：開發 `http://localhost:5173`
  - Authorized redirect URIs：開發 `http://localhost:4000/auth/google/callback`
  - 確保 `.env` 中的 `GOOGLE_CALLBACK_URL` 與 Google Console 完全一致。
- Session 與 Cookie：
  - 正式環境改為 `secure: true`、跨站情境用 `sameSite: 'none'`。
  - 設定 `trust proxy`、使用外部 Session Store、妥善輪替 `SESSION_SECRET`。
  - 建議登入成功時重新產生 Session ID。
- 權限與資料最小化：僅請求 `profile`/`email` scope；避免將敏感資料放入 Session。

## Token（JWT）替代方案（可選）
若未來希望改為無狀態（stateless）架構，可切換為 JWT：
- 流程：
  - OAuth callback 通過後端簽發 Access Token（短效）與 Refresh Token（長效）。
  - 前端以 `Authorization: Bearer <token>` 呼叫 API；或將 Access Token 放於 `httpOnly` Cookie。
  - 以 Refresh Token 週期性換發 Access Token。
- 優點：可水平擴展、無需共享 Session Store。
- 風險：需妥善保護 Refresh Token、處理撤銷/黑名單策略、避免 XSS 竊取 Token。

## 多提供者/多登入方式的延展（未來）
- 若需支援多個登入提供者，建議以 `User`（本地身份） + `Account`（第三方帳號綁定）模型拆分：
  - `User`: id、profile 資料
  - `Account`: provider、providerAccountId、userId（指向 User）
- 這樣同一個 User 可綁定 Google、GitHub 等多個外部帳號。

## 環境變數（apps/api/.env 或 .env.local）
- `SESSION_SECRET`：Session 簽章密鑰（正式環境必須更換並妥善保管）。
- `CLIENT_ORIGIN`：前端網域，CORS 允許來源與 redirect 參考。
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_CALLBACK_URL`：Google OAuth 設定。
- `DATABASE_URL`：PostgreSQL 連線字串（Prisma 也會讀取）。

—
如需切換成 JWT 或新增多提供者，我可以提供對應的 Prisma schema 與路由調整範本。
