import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { prisma } from '@/prisma.js';
import admin from 'firebase-admin';

// Load environment from .env (Prisma default) and .env.local (runtime)
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

const app = express();

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());
// Firebase Admin init
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL;
const FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!admin.apps.length) {
  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    console.warn('[auth] Missing Firebase Admin credentials. Token verification will fail.');
  } else {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        privateKey: FIREBASE_PRIVATE_KEY,
      }),
    });
  }
}

type AuthUser = {
  id: string;
  displayName: string;
  email?: string | null;
  photo?: string | null;
};

declare global {
  // eslint-disable-next-line no-var
  var prismaUserUpserted: boolean | undefined;
}

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

async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    if (!token) return res.sendStatus(401);
    const decoded = await admin.auth().verifyIdToken(token);
    const user = await ensureUser(decoded);
    // @ts-expect-error attach user
    req.user = user;
    next();
  } catch (err) {
    return res.sendStatus(401);
  }
}

// API routes
app.get('/api/me', authMiddleware, (req: Request, res: Response) => {
  // @ts-expect-error user injected by middleware
  res.json(req.user);
});

app.get('/api/health', (_req: Request, res: Response) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
