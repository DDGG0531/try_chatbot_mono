import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { prisma } from '@/prisma';

export const adminRouter = Router();

function adminOnly(req: Request, res: Response, next: Function) {
  const role = (req.user as any)?.role;
  if (role !== 'ADMIN') return res.sendStatus(403);
  next();
}

const listQuery = z.object({
  limit: z.coerce.number().min(1).max(100).optional(),
  offset: z.coerce.number().min(0).optional(),
});
const idParam = z.object({ id: z.string().min(1) });
const patchBody = z.object({ role: z.enum(['USER', 'ADMIN']) }).strict();

// GET /admin/users
adminRouter.get(
  '/admin/users',
  authMiddleware,
  adminOnly,
  validate({ query: listQuery }),
  async (req: Request, res: Response) => {
    const { limit = 50, offset = 0 } = ((req as any).validated!.query || {}) as any;
    const where: any = {};
    const items = (await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit + 1,
      select: ({ id: true, displayName: true, email: true, photo: true, role: true, createdAt: true } as any),
    })) as unknown as Array<{ id: string; displayName: string; email: string | null; photo: string | null; role: 'USER' | 'ADMIN'; createdAt: Date }>;
    const hasNextPage = items.length > limit;
    res.json({ items: hasNextPage ? items.slice(0, limit) : items, hasNextPage });
  },
);

// PATCH /admin/users/:id
adminRouter.patch(
  '/admin/users/:id',
  authMiddleware,
  adminOnly,
  validate({ params: idParam, body: patchBody }),
  async (req: Request, res: Response) => {
    const { id } = (req as any).validated!.params as z.infer<typeof idParam>;
    const { role } = (req as any).validated!.body as z.infer<typeof patchBody>;
    const updated = await prisma.user.update({ where: { id }, data: ({ role } as any), select: ({ id: true, role: true } as any) });
    // 稽核：角色變更
    try {
      const actor = (req.user as any)?.id as string | undefined;
      if (actor) {
        await prisma.auditLog.create({
          data: {
            actorId: actor,
            action: 'USER_ROLE_CHANGE',
            resourceType: 'User',
            resourceId: id,
            metadata: { to: role },
          } as any,
        });
      }
    } catch {}
    res.json(updated);
  },
);

// GET /admin/audit-logs
adminRouter.get(
  '/admin/audit-logs',
  authMiddleware,
  adminOnly,
  validate({ query: listQuery }),
  async (req: Request, res: Response) => {
    const { limit = 50, offset = 0 } = ((req as any).validated!.query || {}) as any;
    const where: any = {};
    const items = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit + 1,
      select: {
        id: true,
        actorId: true,
        action: true,
        resourceType: true,
        resourceId: true,
        metadata: true,
        createdAt: true,
        actor: { select: { id: true, displayName: true, email: true } },
      },
    } as any);
    const hasNextPage = items.length > limit;
    res.json({ items: hasNextPage ? items.slice(0, limit) : items, hasNextPage });
  },
);
