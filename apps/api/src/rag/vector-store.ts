import { PrismaVectorStore } from '@langchain/community/vectorstores/prisma';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma';

// Embeddings 提供者：使用 OPENAI_API_KEY
export const embeddings = new OpenAIEmbeddings({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'text-embedding-3-small',
});

// Prisma 向量倉儲（pgvector）
export const vectorStore = PrismaVectorStore.withModel(prisma).create(embeddings, {
  prisma: Prisma,
  tableName: 'Document', // Prisma model 名稱
  vectorColumnName: 'vector',
  columns: {
    id: PrismaVectorStore.IdColumn,
    content: PrismaVectorStore.ContentColumn, // 對應 Document.content
    // 其他欄位可在 metadata 中使用（若需要）
  },
});

// 將數個 Document 內容轉為單一可嵌入的文字
export function toEmbeddableContent(input: { question?: string | null; answer?: string | null; content?: string | null }) {
  const parts = [
    input.question ? `Q: ${input.question}` : undefined,
    input.answer ? `A: ${input.answer}` : undefined,
    input.content || undefined,
  ].filter(Boolean);
  return parts.join('\n');
}

