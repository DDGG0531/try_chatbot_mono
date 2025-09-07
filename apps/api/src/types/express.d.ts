import type { AuthUser } from '../types/user';

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}

