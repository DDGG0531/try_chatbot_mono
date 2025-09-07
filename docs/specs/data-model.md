資料模型（與目前 Prisma schema 一致）

說明
- 已有 `User`。以下為聊天、歷史與 RAG 相關新增。
- 目標資料庫為 Postgres；`Embedding` 使用 `vector`（pgvector）。若採外部向量庫，請在檢索層做對應。

列舉（Enums）
- （目前不使用 DB enum；以下以文字描述可能值域，實作上以 String 儲存）
- Message.role：'system' | 'user' | 'assistant' | 'tool'

模型（Models）
- User
  - id: String @id
  - displayName: String
  - email: String? @unique
  - photo: String?
  - provider: String
  - createdAt: DateTime @default(now())
  - updatedAt: DateTime @updatedAt
  - conversations: Conversation[]

- Conversation
  - id: String @id @default(cuid())
  - userId: String @index
  - title: String?
  - createdAt: DateTime @default(now())
  - updatedAt: DateTime @updatedAt
  - user: User @relation(fields: [userId], references: [id])
  - messages: Message[]

- Message
  - id: String @id @default(cuid())
  - conversationId: String @index
  - role: String // 'system' | 'user' | 'assistant' | 'tool'
  - content: String // markdown
  - reference: String // 用於記錄 RAG 回應檢索到的內容（細節於 M3 調整）
  - createdAt: DateTime @default(now())
  - conversation: Conversation @relation(fields: [conversationId], references: [id])

（RAG 與其他模型將於 M3 規劃與加入，保持文件簡潔）

存取控制
- 目前未定義 `User.role` 欄位。管理端與 ACL 將在後續里程碑再決定。
