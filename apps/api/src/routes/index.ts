import { Router } from 'express';
import { meRouter } from './me';
import { chatRouter } from './chat';
import { conversationsRouter } from './conversations';
import { kbRouter } from './kb';
import { adminRouter } from './admin';

export function buildRoutes() {
  const r = Router();
  r.use(meRouter);
  r.use(chatRouter);
  r.use(conversationsRouter);
  r.use(kbRouter);
  r.use(adminRouter);
  return r;
}
