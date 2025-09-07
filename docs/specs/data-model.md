資料模型（Prisma 草案）

說明
- 已有 `User`。以下為聊天、歷史與 RAG 相關新增。
- 目標資料庫為 Postgres；`Embedding` 使用 `vector`（pgvector）。若採外部向量庫，請在檢索層做對應。

列舉（Enums）
- Role：USER、ADMIN、EDITOR
- MessageRole：SYSTEM、USER、ASSISTANT、TOOL
- DocSource：UPLOAD、URL、MANUAL

模型（Models）
- User
  - id: String @id
  - displayName: String
  - email: String? @unique
  - photo: String?
  - provider: String
  - role: Role @default(USER)
  - createdAt: DateTime @default(now())
  - updatedAt: DateTime @updatedAt

- Conversation
  - id: String @id @default(cuid())
  - userId: String @index
  - title: String?
  - model: String // provider model id
  - temperature: Float @default(0.2)
  - createdAt: DateTime @default(now())
  - updatedAt: DateTime @updatedAt
  - user: User @relation(fields: [userId], references: [id])
  - messages: Message[]
  - kbLinks: ConversationKB[]

- Message
  - id: String @id @default(cuid())
  - conversationId: String @index
  - role: MessageRole
  - content: String // markdown
  - tokens: Int? // 估計 token 數
  - metadata: Json? // 引用、工具呼叫等
  - createdAt: DateTime @default(now())
  - conversation: Conversation @relation(fields: [conversationId], references: [id])

- KnowledgeBase
  - id: String @id @default(cuid())
  - name: String
  - description: String?
  - isPrivate: Boolean @default(false)
  - ownerId: String? @index // 私有時使用
  - createdAt: DateTime @default(now())
  - updatedAt: DateTime @updatedAt
  - documents: Document[]

- ConversationKB
  - id: String @id @default(cuid())
  - conversationId: String
  - kbId: String
  - createdAt: DateTime @default(now())
  - conversation: Conversation @relation(fields: [conversationId], references: [id])
  - kb: KnowledgeBase @relation(fields: [kbId], references: [id])
  - @@unique([conversationId, kbId])

- Document
  - id: String @id @default(cuid())
  - kbId: String @index
  - source: DocSource
  - uri: String? // 原始 URL 或檔名
  - title: String?
  - status: String @default("READY") // READY, QUEUED, FAILED
  - createdAt: DateTime @default(now())
  - updatedAt: DateTime @updatedAt
  - kb: KnowledgeBase @relation(fields: [kbId], references: [id])
  - chunks: Chunk[]

- Chunk
  - id: String @id @default(cuid())
  - docId: String @index
  - idx: Int // 檔內序號
  - content: String
  - tokens: Int?
  - createdAt: DateTime @default(now())
  - doc: Document @relation(fields: [docId], references: [id])
  - embedding: Embedding?

- Embedding
  - id: String @id @default(cuid())
  - chunkId: String @unique
  - vector: Vector // pgvector(1536 或 3072) 依模型
  - createdAt: DateTime @default(now())
  - chunk: Chunk @relation(fields: [chunkId], references: [id])
  - @@index([vector]) // 可建立 ivfflat/hnsw 索引

- UserSetting
  - id: String @id @default(cuid())
  - userId: String @unique
  - defaultModel: String? // 預設模型
  - preferredKBIds: String[] // 偏好 KB 清單
  - createdAt: DateTime @default(now())
  - updatedAt: DateTime @updatedAt
  - user: User @relation(fields: [userId], references: [id])

存取控制
- 先簡化：以 `User.role` enum 控制。Admin 控制管理端點；Editor 可管理 KB。
- 若需 KB 級別 ACL，可增 `KBMember { id, kbId, userId, role }` 並於查詢時強制檢核。
