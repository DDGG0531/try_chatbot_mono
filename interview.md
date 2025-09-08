# Interview Brief（5分鐘導覽）

> 目標：在面試中快速說清楚本專案的架構、資料流、如何啟動與已採用的 Best Practices。內容聚焦重點、可搭配簡短 Demo。

## 核心概念
- **定位**：一個以 Monorepo 管理的 Chatbot 範例，前端 Vue 3 + shadcn-vue，後端 Express 5 + Prisma + PostgreSQL，並整合 Firebase Auth 與基礎 RAG（pgvector + LangChain）。
- **重點價值**：
  - 前後端分工清晰、型別與驗證完備、以 SSE 串流回覆。
  - 可切換是否使用 OpenAI（無金鑰時提供模擬串流），便於面試 Demo。

## 架構總覽（Monorepo）
- `apps/web`: Vue 3 + Vite 前端
  - UI：優先使用 `shadcn-vue` 元件，樣式以 TailwindCSS utility 為主，沿用 `src/index.css` 的 token（`bg-background`、`text-foreground`、`border-border`）。
  - 狀態：`pinia` 管理 session；`vue-router` 提供頁面守衛（登入/Admin 權限）。
  - Auth：`firebase` 前端 SDK 取得 ID Token，透過 `Authorization: Bearer <token>` 呼叫 API。
- `apps/api`: Express 5 後端
  - 認證：`firebase-admin` 驗證 ID Token，並與 `Prisma` 同步/建立使用者。
  - 資料庫：PostgreSQL（`docker-compose.yml` 提供本機服務），Prisma schema 定義 User/Conversation/Message/KB/Document/AuditLog。
  - RAG：`@langchain/community` + `pgvector`（`Document.vector`），支援 `kbId` 檢索強化回答與引用（citations）。
  - LLM：`@langchain/openai` 串接 Chat 模型，或在無 `OPENAI_API_KEY` 時以模擬串流回覆。
- `docs/`: 流程與說明文件；另有 `Start.md`、`README.md` 作為上手指引。

## 關鍵資料流（從登入到對話）
- **登入**（前端）：
  - 使用者點擊 Google 登入 → Firebase SDK 完成 OAuth → 取得 ID Token（`getIdToken()`）。
  - 前端將 Bearer Token 附在 API 請求標頭上。
- **驗證**（後端 `authMiddleware`）：
  - `firebase-admin` 驗證 Token → `ensureUser()` 以 `upsert` 同步 User（含角色 role）。
  - 通過中介層後將 `req.user`（精簡過的使用者模型）傳給後續路由。
- **聊天串流 `/chat`**：
  - 參數：`messages[]`、可選 `kbId`、`model`、`temperature`。
  - 若無 `conversationId`，會自動建立新會話（以最後一則 user 訊息片段作為標題）。
  - 若有 `kbId`：以 `vectorStore.similaritySearchWithScore()` 檢索 KB 內容，拼接成 system 前綴，加強回答並回傳 `citations`。
  - 產生回覆：
    - 有 `OPENAI_API_KEY` → 透過 LangGraph 串流模型輸出。
    - 無金鑰 → 回傳「模擬串流」，仍可展示 SSE 體驗。
  - 全程以 SSE 吐出 `delta`、`metadata`、`done`，並持久化 message 與 citations。

## 資料模型（Prisma 精華）
- **User**：`role`（`USER`/`ADMIN`），`provider='firebase'`。
- **Conversation / Message**：會話與訊息（role=`system|user|assistant|tool`），訊息可帶 `citations`。
- **KnowledgeBase / Document**：KB 與文件；`Document.vector` 使用 `pgvector`（`Unsupported("vector")`）。
- **AuditLog**：記錄管理操作（例如角色變更、KB 刪除）。

## 快速啟動（本機）
- **前置**：Node 22+、pnpm 9+/10+、Docker。
- **步驟**：
  - 啟 DB：`docker compose up -d`
  - 安裝：`pnpm install`
  - 設定前端 env（`apps/web/.env.local`）：
    - `VITE_API_BASE=http://localhost:4000`
    - `VITE_FIREBASE_API_KEY=...`
    - `VITE_FIREBASE_AUTH_DOMAIN=...`
    - `VITE_FIREBASE_PROJECT_ID=...`
  - 設定後端 env（`apps/api/.env` 或 `.env.local`）：
    - `DATABASE_URL=postgres://...`
    - `FIREBASE_PROJECT_ID`、`FIREBASE_CLIENT_EMAIL`、`FIREBASE_PRIVATE_KEY`
    -（可選）`OPENAI_API_KEY`（無則走模擬串流）
  - 資料庫遷移：`pnpm --filter apps/api migrate:dev`
  - 開發模式（全部）：`pnpm -r dev`
    - Web: `http://localhost:5173`
    - API: `http://localhost:4000`

## Demo 建議腳本（約 5 分鐘）
- 1) 架構圖 30s：Monorepo、web/api、RAG 流程、SSE。
- 2) 登入 45s：前端 Firebase 取得 Token → API `authMiddleware` 驗證與同步 User。
- 3) 聊天 2m：`/chat` 串流；切換有/無 `OPENAI_API_KEY`；指定 `kbId` 展示引用。
- 4) 數據 60s：Prisma schema、`Conversation/Message` 寫入、`AuditLog`。
- 5) 維運 45s：環境變數管理、`pnpm -r build/test/lint`、遷移流程與日誌。

## 已採用的 Best Practices
- **型別與驗證**：
  - 後端路由以 `zod` 驗證（`validate()` middleware），輸入輸出具體；`types` 隔離 Express 擴充。
- **設定集中化**：
  - `apps/api/src/config.ts` 單一入口載入 `.env` 與 `.env.local`，避免散落；對 Firebase 憑證做最小檢查。
- **錯誤處理與日誌**：
  - 全域 error handler 統一 500；SSE 期間錯誤以 `type:'error'` 回報；日誌採結構化欄位。
- **分層清晰**：
  - `auth`、`routes`、`rag`、`llm`、`middleware` 各自職責單一；web 端 `stores/composables/pages` 分目清楚。
- **UI 一致性**：
  - 使用 `@/components/ui/*`；Tailwind token 於 `apps/web/src/index.css` 定義，深淺色一致。
- **安全性**：
  - 不提交密鑰；使用 `.env.local`；限制前端環境變數（必須 `VITE_` 前綴，不含機密）。

## 測試與品質
- 指令：`pnpm -r test`、`pnpm -r lint`、`pnpm -r format`、`pnpm -r typecheck`。
- 心法：針對路由與關鍵 helper 寫單元測試（含錯誤路徑）；目標 80% 行數覆蓋。

## 產線與延伸
- **部署**：
  - Web：`pnpm --filter apps/web build` → 靜態託管。
  - API：`pnpm --filter apps/api build && start`；在反向代理後設 `trust proxy` 與安全 cookie 設定。
  - DB：托管 Postgres + `pgvector` 擴充。
- **可再優化**：
  - 增加背景向量索引重建 Job（CRON）。
  - 加入觀測與結構化日誌輸出（ECS/JSON）。
  - 以 API Key/角色權限細化管理後台操作（強化 `AuditLog`）。
  - 前端引入查詢快取（如 Vue Query）以分離 UI/資料抓取層。

— 完 —
