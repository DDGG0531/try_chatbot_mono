/// <reference types="express-serve-static-core" />
// express.d.ts

import { AuthUser } from "./user"
declare module 'express-serve-static-core' {
  interface Request {
    user: AuthUser
  }
}