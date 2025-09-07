import { Router } from 'express';
import { meRouter } from './me';
import { chatRouter } from './chat';
import { conversationsRouter } from './conversations';

export function buildRoutes() {
  const r = Router();
  r.use(meRouter);
  r.use(chatRouter);
  r.use(conversationsRouter);
  return r;
}

