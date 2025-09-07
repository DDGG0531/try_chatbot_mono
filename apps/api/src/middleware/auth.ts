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
    create: ({
      id: decoded.uid,
      displayName: decoded.name || decoded.email || decoded.uid,
      email: decoded.email,
      photo: decoded.picture || undefined,
      provider: 'firebase',
      role: 'USER',
    } as any),
  });
  return {
    id: user.id,
    displayName: user.displayName,
    email: user.email,
    photo: user.photo || undefined,
    role: (user as any).role || 'USER',
  };
}

async function ensureUserByEmail(email: string, role: 'USER' | 'ADMIN' = 'USER'): Promise<AuthUser> {
  const display = email;
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      displayName: display,
      email,
      provider: 'e2e',
      role: role as any,
    },
    create: ({
      id: `e2e:${email}`,
      displayName: display,
      email,
      provider: 'e2e',
      role: role as any,
    } as any),
  });
  return { id: user.id, displayName: user.displayName, email: user.email, photo: user.photo || undefined, role: (user as any).role || 'USER' };
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    // E2E 測試捷徑（僅在環境變數啟用時）：
    // - 格式一：Authorization: Bearer e2e:<email>
    // - 格式二：Authorization: E2E <email>
    if (process.env.E2E_TEST_AUTH === '1') {
      const asE2e = (token && token.startsWith('e2e:')) || authHeader.startsWith('E2E ');
      if (asE2e) {
        const email = token?.slice(4) || authHeader.slice(4);
        if (!email) return res.sendStatus(401);
        const role: 'USER' | 'ADMIN' = email === 'z887700101703027@gmail.com' ? 'ADMIN' : 'USER';
        const user = await ensureUserByEmail(email, role);
        req.user = user;
        return next();
      }
    }
    if (!token) return res.sendStatus(401);
    const decoded = await admin.auth().verifyIdToken(token);
    const user = await ensureUser(decoded);
    req.user = user;
    next();
  } catch (_err) {
    console.log('error', _err)
    return res.sendStatus(401);
  }
}
