架構總覽

Monorepo 佈局
- apps/web：Vue 3 + Vite 的 SPA，提供聊天 UI 與後台。
- apps/api：Express + Prisma + Postgres（pgvector）+ Firebase Admin 驗證。
- packages/core-domain：共用型別/DTO 與驗證 Schema。
- packages/rag：文件匯入、切塊、嵌入、檢索工具。
- packages/ui（可選）：跨應用共享的 UI 基礎元件。

執行時架構
- Web 端使用 Firebase 登入取得 ID Token，呼叫 API 並附上 `Authorization: Bearer <idToken>`。
- API 使用 Firebase Admin 驗證 Token、套用 RBAC；聊天與 RAG 流程透過 LangChain 進行編排。
- RAG：以 LangChain 的 Retriever（向量庫：Postgres + pgvector）檢索相關片段組成上下文。
- Chat：以 LangChain Runnables/Chains（PromptTemplate → Retriever → LLM）生成回覆，並以 SSE 串流至前端。

關鍵決策
- 編排框架：選用 LangChain 作為 LLM/RAG 的標準抽象（Prompt、Runnable、Retriever、Tool）。
- 傳輸：SSE 串流，簡潔且符合 token 流需求。
- 向量庫：偏好 pgvector；以 LangChain 向量存儲介面封裝便於替換。
- 提示模板：以 LangChain PromptTemplate 管理與版本化。
- 多租戶：第一階段不需要；單租戶＋全域 KB，私人 KB 可選。

高階流程（Chat）
web → api：POST /chat（SSE），包含 messages、conversationId?、kbIds?
api（LangChain）：
  - Retriever：依查詢檢索 topK 片段
  - PromptTemplate：組合系統規則、上下文、使用者訊息
  - LLM（OpenAI 等）：以 streaming 產出 token
api → web：串流 token；完成時送出 citations 與 usage

部署/執行
- 開發：docker‑compose 啟動 Postgres 並啟用 pgvector；以 `pnpm -r dev` 運行。
- 線上（未來）：API 容器開機執行 Prisma migrations；Postgres 啟用 pgvector。

可觀測性（後續）
- 指標：tokens/sec、擷取片段數、LLM 延遲、Retriever 命中率。
- 日誌：請求/錯誤結構化日誌（實作待定）。
- 健康：目前不提供 `/health`/`/ready` 端點；未來以基礎監測或探針替代。

依賴（待你安裝時使用）
- API：express、cors、zod、prisma、@prisma/client、pg、pgvector、firebase-admin、langchain、@langchain/openai（或其他 Provider 套件）。
- Web：vue、vue-router、pinia、@tanstack/vue-query、axios、firebase、zod、shadcn-vue 相關。
