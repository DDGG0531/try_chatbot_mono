API 規格（草案）

慣例
- Base URL：`/`（Express 直掛）。前端以 `VITE_API_BASE` 設定。
- 認證：受保護路由需 `Authorization: Bearer <firebaseIdToken>`。
- 錯誤：JSON `{ error: { code, message } }`，對應正確 HTTP 狀態碼。
- 串流：以 SSE 傳送，`text/event-stream` 格式與 `data:` 行。

（健康檢查端點目前不提供，將以部署層監測替代）

身份/會話
- GET `/me` → 回傳當前使用者；無效 Token 回 401。

會話（Conversations）
- GET `/conversations?cursor=<id>&limit=20` → `{ items: Conversation[], nextCursor? }`
- POST `/conversations` { title? } → Conversation
- GET `/conversations/:id` → 單筆會話摘要
- GET `/conversations/:id/messages` → Message[]（可分頁）
- PATCH `/conversations/:id` { title? } → Conversation
- DELETE `/conversations/:id` → 204

聊天（串流，LangGraph）
- POST `/chat`（SSE）
  - 請求：{
      conversationId?: string,
      messages: { role: 'system'|'user'|'assistant'|'tool', content: string }[],
      kbIds?: string[],
      model?: string,
      temperature?: number
    }
  - 回應（SSE 事件）：
    - `data: { type: 'delta', content: string }`（LangGraph messages 模式逐段）
    - `data: { type: 'metadata', citations: Citation[], usage?: { promptTokens, completionTokens } }`（整段完成後送出）
    - `data: { type: 'done', messageId: string, conversationId: string }`
  - 實作：以 LangGraph 串接 LLM；未來整合 Retriever 時接入 pgvector 檢索。

知識庫（Admin/Editor）
- GET `/kb` → KnowledgeBase[]（依可見性與擁有權過濾）
- POST `/kb` { name, description?, isPrivate? } → KnowledgeBase（admin/editor）
- PATCH `/kb/:id` { name?, description?, isPrivate? } → KnowledgeBase（admin/editor 或擁有者）
- DELETE `/kb/:id` → 204（admin/editor 或擁有者）

文件與匯入
- GET `/kb/:id/docs` → Document[]
- POST `/kb/:id/docs` multipart/form-data（file）或 JSON { url, title? } → { document, jobId }
- GET `/kb/:id/docs/:docId` → Document（含 chunks 摘要）
- DELETE `/kb/:id/docs/:docId` → 204
- POST `/kb/:id/reindex` → { jobId }（重算 Embeddings）
- GET `/jobs/:jobId` → { status: 'QUEUED'|'RUNNING'|'DONE'|'FAILED', error? }

管理端（Admin）
- GET `/admin/users` → User[]（admin）
- PATCH `/admin/users/:id` { role: 'USER'|'ADMIN'|'EDITOR' } → User（admin）

DTO（簡化）
- Conversation: { id, userId, title?, createdAt, updatedAt }
- Message: { id, conversationId, role, content, reference, createdAt }
- KnowledgeBase: { id, name, description?, isPrivate, ownerId?, createdAt }
- Document: { id, kbId, source, uri?, title?, status, createdAt }
- Citation: { docId, kbId, title?, uri?, snippet, score }

備註
- 以 Zod 驗證請求；驗證失敗回 422。
- 於 middleware 強制 RBAC：KB 與 Admin 路由需對應角色。
- SSE 保活（心跳）並處理客端中斷。
- LLM Provider 透過 LangChain/LangGraph 進行抽象（預設 OpenAI，相容其他供應商）。
