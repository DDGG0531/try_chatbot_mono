import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import { prisma } from '@/prisma';
import { config, hasFirebaseCredentials } from './config';
import type { AuthUser } from './types/user';

// 建立 Express 應用
const app = express();

// 基礎中介層
app.use(cors({ origin: config.clientOrigin }));
app.use(express.json());

// Firebase Admin 初始化（若憑證齊全）
if (!admin.apps.length) {
  if (!hasFirebaseCredentials()) {
    console.warn('[auth] Missing Firebase Admin credentials. Token verification will fail.');
  } else {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: config.firebase.projectId!,
          clientEmail: config.firebase.clientEmail!,
          privateKey: config.firebase.privateKey!,
        }),
      });
    } catch (e) {
      console.error('[auth] Failed to initialize Firebase Admin:', e);
    }
  }
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
    req.user = user;
    next();
  } catch (err) {
    return res.sendStatus(401);
  }
}

// API routes
app.get('/me', authMiddleware, (req: Request, res: Response) => {
  res.json(req.user);
});
// 健康檢查端點（K8s/監控可使用）
//（已移除健康檢查與就緒度端點）

// 404 處理（最後註冊）
app.use((_req, res) => res.status(404).json({ error: 'Not Found' }));

// 統一錯誤處理（可擴充錯誤代碼/結構）
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  console.error('[error]', JSON.stringify({
    t: new Date().toISOString(),
    level: 'error',
    msg: 'unhandled',
    method: req.method,
    url: req.originalUrl || req.url,
    error: String(err),
  }));
  res.status(500).json({ error: 'Internal Server Error' });
});

const server = app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
});

// 優雅關閉（關閉 DB 連線）
async function shutdown() {
  console.log('Shutting down...');
  await prisma.$disconnect();
  server.close(() => process.exit(0));
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
