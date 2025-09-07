import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { prisma } from '@/prisma';
import type { AuthUser } from '@/types/user';
import { vectorStore, toEmbeddableContent } from '@/rag/vector-store';

export const kbRouter = Router();

const listQuery = z.object({
  limit: z.coerce.number().min(1).max(50).optional(),
  offset: z.coerce.number().min(0).optional(),
});
const idParam = z.object({ id: z.string().min(1) });
const upsertBody = z
  .object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    isPublic: z.boolean().optional(),
  })
  .strict();
const createBody = upsertBody.extend({ name: z.string().min(1).max(100) });
const docCreateBody = z.object({
  items: z
    .array(
      z
        .object({
          question: z.string().optional(),
          answer: z.string().optional(),
          // 注意：後端將忽略 content，僅以 question+answer 合成存入 content
          content: z.string().optional(),
          extra: z.any().optional(),
        })
        .refine((x) => !!(x.question || x.answer || x.content), '至少需要一個欄位'),
    )
    .min(1),
});
const docListQuery = z.object({
  limit: z.coerce.number().min(1).max(100).optional(),
  offset: z.coerce.number().min(0).optional(),
});
const docIdParam = z.object({ id: z.string().min(1), docId: z.string().min(1) });
const docOnlyParam = z.object({ docId: z.string().min(1) });

// GET /kb
kbRouter.get(
  '/kb',
  authMiddleware,
  validate({ query: listQuery }),
  async (req: Request, res: Response) => {
    const user = req.user as AuthUser;
    const q = (req as any).validated!.query as z.infer<typeof listQuery>;
    const { limit = 20, offset = 0 } = q;
    // 列表：回傳「自己的 KB」或「公開 KB」
    const where: any = { OR: [{ userId: user.id }, { isPublic: true }] };
    const items = await prisma.knowledgeBase.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit + 1,
      select: { id: true, userId: true, name: true, description: true, isPublic: true, createdAt: true, updatedAt: true },
    });
    const hasNextPage = items.length > limit;
    res.json({ items: hasNextPage ? items.slice(0, limit) : items, hasNextPage });
  },
);

// GET /kb/:id
kbRouter.get(
  '/kb/:id',
  authMiddleware,
  validate({ params: idParam }),
  async (req: Request, res: Response) => {
    const user = req.user as AuthUser;
    const { id } = (req as any).validated!.params as z.infer<typeof idParam>;
    const kb = await prisma.knowledgeBase.findFirst({
      where: { id, OR: [{ userId: user.id }, { isPublic: true }] },
      select: { id: true, userId: true, name: true, description: true, isPublic: true, createdAt: true, updatedAt: true },
    });
    if (!kb) return res.sendStatus(404);
    res.json(kb);
  },
);

// POST /kb/:id/docs 產生文件並嵌入向量（RAG 索引）
kbRouter.post(
  '/kb/:id/docs',
  authMiddleware,
  validate({ params: idParam, body: docCreateBody }),
  async (req: Request, res: Response) => {
    if (!process.env.OPENAI_API_KEY) return res.status(400).json({ error: 'OPENAI_API_KEY not configured' });
    const user = req.user as AuthUser;
    const { id } = (req as any).validated!.params as z.infer<typeof idParam>;
    const { items } = (req as any).validated!.body as z.infer<typeof docCreateBody>;

    // 讀取公開 KB 的文件亦允許（唯有非擁有者不可寫入）
    const kb = await prisma.knowledgeBase.findFirst({ where: { id, OR: [{ userId: user.id }, { isPublic: true }] } });
    if (!kb) return res.sendStatus(404);

    // 先建立 Document，再由 VectorStore 計算向量（需 DB 允許 vector 可為 NULL）
    // 需求：忽略前端傳入的 content，僅用 question+answer 合成 content 儲存
    const contents = items.map((it) => toEmbeddableContent({ question: it.question, answer: it.answer, content: undefined }));
    const created = await prisma.$transaction(
      items.map((it, idx) =>
        prisma.document.create({
          data: {
            kbId: id,
            question: it.question,
            answer: it.answer,
            content: contents[idx],
            extra: it.extra as any,
          },
          select: { id: true, content: true },
        }),
      ),
    );
    await vectorStore.addModels(created as any);
    res.status(201).json({ inserted: created.length });
  },
);

// GET /kb/:id/docs 列出文件
kbRouter.get(
  '/kb/:id/docs',
  authMiddleware,
  validate({ params: idParam, query: docListQuery }),
  async (req: Request, res: Response) => {
    const user = req.user as AuthUser;
    const { id } = (req as any).validated!.params as z.infer<typeof idParam>;
    const { limit = 20, offset = 0 } = (req as any).validated!.query as z.infer<typeof docListQuery>;
    const kb = await prisma.knowledgeBase.findFirst({ where: { id, OR: [{ userId: user.id }, { isPublic: true }] } });
    if (!kb) return res.sendStatus(404);
    const where: any = { kbId: id };
    const items = await prisma.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit + 1,
      select: { id: true, question: true, answer: true, content: true, extra: true, createdAt: true, updatedAt: true },
    });
    const hasNextPage = items.length > limit;
    res.json({ items: hasNextPage ? items.slice(0, limit) : items, hasNextPage });
  },
);

// PATCH /kb/:id/docs/:docId 更新文件並重嵌入
kbRouter.patch(
  '/kb/:id/docs/:docId',
  authMiddleware,
  // 注意：即便接受 content 欄位，後端會忽略它，content 以 question+answer 合成
  validate({ params: docIdParam, body: z.object({ question: z.string().optional(), answer: z.string().optional(), content: z.string().optional(), extra: z.any().optional() }).strict() }),
  async (req: Request, res: Response) => {
    if (!process.env.OPENAI_API_KEY) return res.status(400).json({ error: 'OPENAI_API_KEY not configured' });
    const user = req.user as AuthUser;
    const { id, docId } = (req as any).validated!.params as z.infer<typeof docIdParam>;
    const b = (req as any).validated!.body as { question?: string; answer?: string; content?: string; extra?: unknown };
    const kb = await prisma.knowledgeBase.findFirst({ where: { id, OR: [{ userId: user.id }, { isPublic: true }] } });
    if (!kb) return res.sendStatus(404);
    const current = await prisma.document.findFirst({ where: { id: docId, kbId: id } });
    if (!current) return res.sendStatus(404);
    const next = {
      question: b.question ?? current.question ?? undefined,
      answer: b.answer ?? current.answer ?? undefined,
      // 需求：content = question+answer；忽略前端 content
      content: toEmbeddableContent({
        question: b.question ?? current.question ?? undefined,
        answer: b.answer ?? current.answer ?? undefined,
        content: undefined,
      }),
      extra: (b.extra as any) ?? current.extra,
    };
    // 先更新內容，再由 VectorStore 重嵌入
    const updated = await prisma.document.update({
      where: { id: docId },
      data: { question: next.question, answer: next.answer, content: next.content, extra: next.extra },
      select: { id: true, question: true, answer: true, content: true, extra: true, createdAt: true, updatedAt: true },
    });
    await vectorStore.addModels([updated] as any);
    res.json(updated);
  },
);

// DELETE /kb/:id/docs/:docId 刪除文件
kbRouter.delete(
  '/kb/:id/docs/:docId',
  authMiddleware,
  validate({ params: docIdParam }),
  async (req: Request, res: Response) => {
    const user = req.user as AuthUser;
    const { id, docId } = (req as any).validated!.params as z.infer<typeof docIdParam>;
    const kb = await prisma.knowledgeBase.findFirst({ where: { id, userId: user.id } });
    if (!kb) return res.sendStatus(404);
    const exist = await prisma.document.findFirst({ where: { id: docId, kbId: id } });
    if (!exist) return res.sendStatus(404);
    await prisma.document.delete({ where: { id: docId } });
    res.sendStatus(204);
  },
);

// GET /kb/:id/docs/:docId 取得單一文件
kbRouter.get(
  '/kb/:id/docs/:docId',
  authMiddleware,
  validate({ params: docIdParam }),
  async (req: Request, res: Response) => {
    const user = req.user as AuthUser;
    const { id, docId } = (req as any).validated!.params as z.infer<typeof docIdParam>;
    const kb = await prisma.knowledgeBase.findFirst({ where: { id, userId: user.id } });
    if (!kb) return res.sendStatus(404);
    const doc = await prisma.document.findFirst({
      where: { id: docId, kbId: id },
      select: { id: true, question: true, answer: true, content: true, extra: true, createdAt: true, updatedAt: true },
    });
    if (!doc) return res.sendStatus(404);
    res.json(doc);
  },
);

// GET /docs/:docId 取得單一文件（不帶 kbId），自動檢查擁有權並回傳 kbId
kbRouter.get(
  '/docs/:docId',
  authMiddleware,
  validate({ params: docOnlyParam }),
  async (req: Request, res: Response) => {
    const user = req.user as AuthUser;
    const { docId } = (req as any).validated!.params as z.infer<typeof docOnlyParam>;
    const doc = await prisma.document.findFirst({
      where: { id: docId, kb: { OR: [{ userId: user.id }, { isPublic: true }] } },
      select: { id: true, kbId: true, question: true, answer: true, content: true, extra: true, createdAt: true, updatedAt: true },
    });
    if (!doc) return res.sendStatus(404);
    res.json(doc);
  },
);

// POST /kb
kbRouter.post(
  '/kb',
  authMiddleware,
  validate({ body: createBody }),
  async (req: Request, res: Response) => {
    const user = req.user as AuthUser;
    const b = (req as any).validated!.body as z.infer<typeof createBody>;
    const created = await prisma.knowledgeBase.create({
      data: {
        userId: user.id,
        name: b.name,
        description: b.description,
        isPublic: b.isPublic ?? false,
      },
      select: { id: true, userId: true, name: true, description: true, isPublic: true, createdAt: true, updatedAt: true },
    });
    res.status(201).json(created);
  },
);

// PATCH /kb/:id
kbRouter.patch(
  '/kb/:id',
  authMiddleware,
  validate({ params: idParam, body: upsertBody }),
  async (req: Request, res: Response) => {
    const user = req.user as AuthUser;
    const { id } = (req as any).validated!.params as z.infer<typeof idParam>;
    const b = (req as any).validated!.body as z.infer<typeof upsertBody>;

    const kb = await prisma.knowledgeBase.findFirst({ where: { id, userId: user.id } });
    if (!kb) return res.sendStatus(404);
    const updated = await prisma.knowledgeBase.update({
      where: { id },
      data: {
        name: b.name ?? kb.name,
        description: b.description ?? kb.description,
        isPublic: b.isPublic ?? kb.isPublic,
      },
      select: { id: true, userId: true, name: true, description: true, isPublic: true, createdAt: true, updatedAt: true },
    });
    res.json(updated);
  },
);

// DELETE /kb/:id
kbRouter.delete(
  '/kb/:id',
  authMiddleware,
  validate({ params: idParam }),
  async (req: Request, res: Response) => {
    const user = req.user as AuthUser;
    const { id } = (req as any).validated!.params as z.infer<typeof idParam>;
    const kb = await prisma.knowledgeBase.findFirst({ where: { id, userId: user.id } });
    if (!kb) return res.sendStatus(404);
    await prisma.knowledgeBase.delete({ where: { id } });
    // 稽核：KB 刪除
    try {
      await prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: 'KB_DELETE',
          resourceType: 'KnowledgeBase',
          resourceId: id,
          metadata: { name: kb.name },
        } as any,
      });
    } catch {}
    res.sendStatus(204);
  },
);
