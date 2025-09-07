import type { NextFunction, Request, Response } from 'express';
import { admin } from '@/lib/firebase-admin';
import { prisma } from '@/prisma';
import type { AuthUser } from '@/types/user';

async function ensureUser(decoded: admin.auth.DecodedIdToken): Promise<AuthUser> {
  const user = await prisma.user.upsert({
    where: { id: decoded.uid },
    update: {
      displayName: decoded.name || decoded.email || decoded.uid,
      email: decoded.email,
      photo: decoded.picture || undefined,
      provider: 'firebase',
    },
    create: {
      id: decoded.uid,
      displayName: decoded.name || decoded.email || decoded.uid,
      email: decoded.email,
      photo: decoded.picture || undefined,
      provider: 'firebase',
    },
  });
  return {
    id: user.id,
    displayName: user.displayName,
    email: user.email,
    photo: user.photo || undefined,
  };
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    if (!token) return res.sendStatus(401);
    const decoded = await admin.auth().verifyIdToken(token);
    const user = await ensureUser(decoded);
    req.user = user;
    next();
  } catch (_err) {
    return res.sendStatus(401);
  }
}

