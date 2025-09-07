import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import { config } from '@/config';
import { initFirebaseAdmin } from '@/lib/firebase-admin';
import { buildRoutes } from '@/routes';

export function createApp() {
  const app = express();

  // 基礎中介層
  app.use(cors({ origin: config.clientOrigin }));
  app.use(express.json());

  // 初始化外部服務（Firebase Admin）
  initFirebaseAdmin();

  // 掛載路由
  app.use(buildRoutes());

  // 404
  app.use((_req, res) => res.status(404).json({ error: 'Not Found' }));

  // 統一錯誤處理
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

  return app;
}

