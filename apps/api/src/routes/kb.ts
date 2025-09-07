import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { prisma } from '@/prisma';
import type { AuthUser } from '@/types/user';

export const kbRouter = Router();

const listQuery = z.object({
  limit: z.coerce.number().min(1).max(50).optional(),
  cursor: z.string().datetime().optional(), // ISO timestamp by createdAt
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

// GET /kb
kbRouter.get(
  '/kb',
  authMiddleware,
  validate({ query: listQuery }),
  async (req: Request, res: Response) => {
    const user = req.user as AuthUser;
    const q = (req as any).validated!.query as z.infer<typeof listQuery>;
    const { limit = 20, cursor } = q;
    const where: any = { userId: user.id };
    if (cursor) where.createdAt = { lt: new Date(cursor) };

    const items = await prisma.knowledgeBase.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { id: true, userId: true, name: true, description: true, isPublic: true, createdAt: true, updatedAt: true },
    });
    const nextCursor = items.length > 0 ? items[items.length - 1].createdAt.toISOString() : undefined;
    res.json({ items, nextCursor });
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
      where: { id, userId: user.id },
      select: { id: true, userId: true, name: true, description: true, isPublic: true, createdAt: true, updatedAt: true },
    });
    if (!kb) return res.sendStatus(404);
    res.json(kb);
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
    res.sendStatus(204);
  },
);

