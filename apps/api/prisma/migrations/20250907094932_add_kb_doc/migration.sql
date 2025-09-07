CREATE EXTENSION IF NOT EXISTS vector;

-- CreateTable
CREATE TABLE "public"."KnowledgeBase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeBase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Document" (
    "id" TEXT NOT NULL,
    "kbId" TEXT NOT NULL,
    "question" TEXT,
    "answer" TEXT,
    "content" TEXT,
    "extra" JSONB,
    "vector" vector NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KnowledgeBase_userId_createdAt_idx" ON "public"."KnowledgeBase"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Document_kbId_createdAt_idx" ON "public"."Document"("kbId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."KnowledgeBase" ADD CONSTRAINT "KnowledgeBase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_kbId_fkey" FOREIGN KEY ("kbId") REFERENCES "public"."KnowledgeBase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
