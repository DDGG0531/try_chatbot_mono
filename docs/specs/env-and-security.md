環境與安全

環境變數（API）
- PORT=4000
- CLIENT_ORIGIN=http://localhost:5173
- DATABASE_URL=postgresql://user:pass@localhost:5432/app
- OPENAI_API_KEY=sk-...
- EMBEDDING_MODEL=text-embedding-3-small
- CHAT_MODEL=gpt-4o-mini
- FIREBASE_PROJECT_ID=...
- FIREBASE_CLIENT_EMAIL=...
- FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
- VECTOR_DB=pgvector（或 pinecone）

環境變數（Web）
- VITE_API_BASE=http://localhost:4000
- VITE_FIREBASE_API_KEY=...
- VITE_FIREBASE_AUTH_DOMAIN=...
- VITE_FIREBASE_PROJECT_ID=...
- VITE_FIREBASE_APP_ID=...
- VITE_FIREBASE_MESSAGING_SENDER_ID=...

秘鑰管理
- 切勿提交秘鑰入版控。每個 app 使用 `.env.local`。確保 `.env*` 已忽略。
- Firebase 私鑰在環境變數中以 `\n` 轉義換行；或於生產使用檔案掛載。

安全最佳實務
- 認證/授權：每請求於後端驗證 ID Token；在 middleware 與查詢邊界強制 RBAC。
- 輸入驗證：所有 JSON request 以 Zod 驗證；清理上傳檔案與抓取的 HTML。
- 速率限制：依 IP 與使用者對聊天與匯入路由限流；供應商呼叫具退避重試。
- 資料：Postgres 託管靜態加密；避免記錄個資；遮罩 Token 與金鑰。
- CORS：限制 `origin` 為可信客戶端；生產環境使用 HTTPS。
- 安全標頭：部署時使用 `helmet`（HSTS、noSniff、frameguard 等）。
- SSRF：URL 匯入僅允許 http/https；封鎖內網 IP 範圍。

運維
- 遷移：非生產啟動時可跑 `migrate dev`；生產執行 `migrate deploy`。
- 備份：每日 Postgres 備份與保留策略；定期驗證還原。
- 監控：錯誤率、供應商失敗、慢查詢、匯入積壓警報。
