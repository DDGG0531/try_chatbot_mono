Roadmap 與驗收

里程碑（前後端任務拆分）
- [x] M1 身分驗證與骨架
  - [x] 前端（Web）
    - [x] 安裝並初始化 Firebase SDK
    - [x] 建立 Google 登入/登出流程
    - [x] 建立 `useAuth()` composable 與 Pinia `session` store（登入狀態、載入中）
    - [x] 路由守衛（未登入導向 `/`）
    - [x] 建立 `Profile` 頁並呼叫 `/me` 顯示使用者資訊（並改用 session store）
    - [x] 設定 `VITE_API_BASE` 與 Firebase 環境變數（.env.local）
    - [x] 基本 UI 骨架與頁面切換（Home/Profile/UiDemo）
  - [x] 後端（API）
    - [x] 完成 Firebase Admin 初始化（程式層面）
    - [x] 提供 `/me` 端點（驗證 Token 並 upsert 使用者）
    - [x] 設定 CORS（限制 `CLIENT_ORIGIN`）
    - [x] 加入資料驗證：以 zod 驗證 body/query/params
    - [x] 中介層統一錯誤處理
  - 驗收：使用者登入後可在 `Profile` 看到個人資料。

- M2 會話與串流聊天
  - 前端（Web）
    - [x] 建立聊天頁面（訊息區＋輸入區）
    - [x] 側欄會話列表（建立/切換）
    - [x] SSE 串流客戶端；即時追加訊息（停/續播後續）
    - [x] 封裝 API：建立/取得會話、取得訊息、呼叫 `/chat` 串流（暫不啟用快取）
  - 後端（API）
    - [x] 擴充 Prisma：`Conversation`、`Message` 模型與遷移
    - [x] 以 zod 定義並驗證 API schema（request/response）
    - [x] `GET/POST /conversations`、`GET /conversations/:id/messages`、`PATCH/DELETE /conversations/:id`
    - [x] `POST /chat`（SSE）：以 LangGraph 串流生成（messages 模式），保存訊息並回傳 `done`
  - 驗收：助手回覆以串流顯示；歷史可見且可切換續聊。

- M3 RAG v1
  - 前端（Web）
    - [ ] KB 管理頁：列表、新增/編輯/刪除
    - [ ] 文件清單與上傳（顯示匯入狀態）
    - [ ] 聊天頁整合 KB 多選器
    - [ ] 訊息中顯示引用並可展開來源摘要
  - 後端（API）
    - [ ] 擴充 Prisma：`KnowledgeBase`、`Document`、`Chunk`、`Embedding`、`ConversationKB`
    - [ ] `GET/POST/PATCH/DELETE /kb` 端點
    - [ ] `/kb/:id/docs` 上傳/URL 匯入、`/kb/:id/reindex`、`/jobs/:jobId`
    - [ ] 匯入管線：以 LangChain Loader/Splitter/Embeddings 產生向量存 pgvector
    - [ ] 聊天檢索整合 `/chat`（LangChain Retriever，附 citations）
  - 驗收：回答含引用並可展開來源內容；選擇 KB 能影響回答。

- M4 後台與權限
  - 前端（Web）
    - [ ] Admin 使用者管理頁：表格（id/email/name/role）
    - [ ] 變更角色操作（即時更新）
    - [ ] UI 權限：隱藏導覽/停用按鈕＋提示
  - 後端（API）
    - [ ] 啟用 RBAC（`User.role`: USER/EDITOR/ADMIN）
    - [ ] 中介層套用角色保護（Admin/KB 路由）
    - [ ] `GET /admin/users`、`PATCH /admin/users/:id`（更新角色）
    - [ ] 針對 KB 資源擁有者/角色檢查
    - [ ] 稽核：角色變更、KB 刪除、重建索引（userId/resourceId/timestamp）
  - 驗收：Admin 可變更角色；非 Admin 受阻擋；KB 權限正確套用。

- M5 打磨與可觀測性
  - 前端（Web）
    - [ ] 體驗：錯誤提示（toast）、載入骨架、空狀態、重試與回退
    - [ ] 效能：頁面分包、快取策略（Vue Query）、預取常用資料
    - [ ] 測試：關鍵元件與頁面測試、基本 E2E（auth + chat + RAG）
  - 後端（API）
    - [ ] 可觀測性：延遲/錯誤/請求數指標；LLM/檢索追蹤
    - [ ] 穩健性：速率限制、供應商重試與回退、優雅關閉；分頁/索引優化
    - [ ] 安全：`helmet`、嚴格 CORS、URL 匯入 SSRF 防護

驗收測試（高層級）
- Auth：無效 Token 回 401；有效 Token 回使用者 JSON。
- Chat：POST /chat 會串流 `delta` 事件並以 `done` 結束（附 id）。
- History：完成聊天後，GET /conversations 含新會話；GET messages 含雙方訊息。
- RAG：選擇 KB 後，回應包含與上傳文件相符的引用。
- Permissions：非 Admin 不能訪問 `/admin/users`；editor/admin 可建立 KB；使用者不可刪除他人 KB。
