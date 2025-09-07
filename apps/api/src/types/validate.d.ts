declare module 'express-serve-static-core' {
  interface Request {
    validated?: {
      params?: Record<string, unknown>;
      query?: Record<string, unknown>;
      body?: unknown;
      headers?: Record<string, unknown>;
    };
  }
}

