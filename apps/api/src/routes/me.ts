import { Router, type Request, type Response } from 'express';
import { authMiddleware } from '@/middleware/auth';

export const meRouter = Router();

meRouter.get('/me', authMiddleware, (req: Request, res: Response) => {
  res.json(req.user);
});

