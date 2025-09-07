import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { validate } from '@/middleware/validate';
import { authMiddleware } from '@/middleware/auth';
import type { AuthUser } from '@/types/user';
import { prisma } from '@/prisma';

export const conversationsRouter = Router();

const listQuery = z.object({
  limit: z.coerce.number().min(1).max(50).optional(),
  cursor: z.string().datetime().optional(), // ISO timestamp
});
const idParam = z.object({ id: z.string().min(1) });
const upsertBody = z.object({ title: z.string().min(1).max(100).optional() }).strict();
const msgListQuery = z.object({
  limit: z.coerce.number().min(1).max(200).optional(),
  cursor: z.string().datetime().optional(),
});

// GET /conversations
conversationsRouter.get(
  '/conversations',
  authMiddleware,
  validate({ query: listQuery }),
  async (req: Request, res: Response) => {
    const user = req.user as AuthUser;
    const q = (req as any).validated!.query as z.infer<typeof listQuery>;
    const { limit = 20, cursor } = q;
    const where: any = { userId: user.id };
    if (cursor) where.createdAt = { lt: new Date(cursor) };

    const items = await prisma.conversation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { id: true, userId: true, title: true, createdAt: true, updatedAt: true },
    });
    const nextCursor = items.length > 0 ? items[items.length - 1].createdAt.toISOString() : undefined;
    res.json({ items, nextCursor });
  },
);

// POST /conversations
conversationsRouter.post(
  '/conversations',
  authMiddleware,
  validate({ body: upsertBody }),
  async (req: Request, res: Response) => {
    const user = req.user as AuthUser;
    const b = (req as any).validated!.body as z.infer<typeof upsertBody>;
    const { title } = b;
    const conv = await prisma.conversation.create({
      data: { userId: user.id, title },
      select: { id: true, userId: true, title: true, createdAt: true, updatedAt: true },
    });
    res.status(201).json(conv);
  },
);

// GET /conversations/:id
conversationsRouter.get(
  '/conversations/:id',
  authMiddleware,
  validate({ params: idParam }),
  async (req: Request, res: Response) => {
    const user = req.user as AuthUser;
    const p = (req as any).validated!.params as z.infer<typeof idParam>;
    const { id } = p;
    const conv = await prisma.conversation.findFirst({
      where: { id, userId: user.id },
      select: { id: true, userId: true, title: true, createdAt: true, updatedAt: true },
    });
    if (!conv) return res.sendStatus(404);
    res.json(conv);
  },
);

// GET /conversations/:id/messages
conversationsRouter.get(
  '/conversations/:id/messages',
  authMiddleware,
  validate({ params: idParam, query: msgListQuery }),
  async (req: Request, res: Response) => {
    const user = req.user as AuthUser;
    const p = (req as any).validated!.params as z.infer<typeof idParam>;
    const q = (req as any).validated!.query as z.infer<typeof msgListQuery>;
    const { id } = p;
    const { limit = 200, cursor } = q;

    const conv = await prisma.conversation.findFirst({ where: { id, userId: user.id } });
    if (!conv) return res.sendStatus(404);

    const where: any = { conversationId: id };
    if (cursor) where.createdAt = { lt: new Date(cursor) };

    const items = await prisma.message.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: limit,
      select: { id: true, role: true, content: true, createdAt: true, reference: true },
    });
    const nextCursor = items.length > 0 ? items[items.length - 1].createdAt.toISOString() : undefined;
    res.json({ items, nextCursor });
  },
);

// PATCH /conversations/:id
conversationsRouter.patch(
  '/conversations/:id',
  authMiddleware,
  validate({ params: idParam, body: upsertBody }),
  async (req: Request, res: Response) => {
    const user = req.user as AuthUser;
    const p = (req as any).validated!.params as z.infer<typeof idParam>;
    const b = (req as any).validated!.body as z.infer<typeof upsertBody>;
    const { id } = p;
    const { title } = b;
    const conv = await prisma.conversation.findFirst({ where: { id, userId: user.id } });
    if (!conv) return res.sendStatus(404);
    const updated = await prisma.conversation.update({
      where: { id },
      data: { title },
      select: { id: true, userId: true, title: true, createdAt: true, updatedAt: true },
    });
    res.json(updated);
  },
);

// DELETE /conversations/:id
conversationsRouter.delete(
  '/conversations/:id',
  authMiddleware,
  validate({ params: idParam }),
  async (req: Request, res: Response) => {
    const user = req.user as AuthUser;
    const p = (req as any).validated!.params as z.infer<typeof idParam>;
    const { id } = p;
    const conv = await prisma.conversation.findFirst({ where: { id, userId: user.id } });
    if (!conv) return res.sendStatus(404);
    await prisma.message.deleteMany({ where: { conversationId: id } });
    await prisma.conversation.delete({ where: { id } });
    res.sendStatus(204);
  },
);
