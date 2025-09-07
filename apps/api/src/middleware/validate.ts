import type { NextFunction, Request, Response } from 'express';
import type { ZodType, ZodError } from 'zod';

type Schemas = {
  body?: ZodType<unknown>;
  query?: ZodType<unknown>;
  params?: ZodType<unknown>;
  headers?: ZodType<unknown>;
};

function formatZodError(err: ZodError) {
  return err.issues.map((i) => ({
    path: i.path.join('.'),
    code: i.code,
    message: i.message,
  }));
}

export function validate(schemas: Schemas) {
  return (req: Request, res: Response, next: NextFunction) => {
    const problems: Array<{ part: keyof Schemas; issues: ReturnType<typeof formatZodError> }> = [];

    try {
      if (schemas.params) {
        const parsed = schemas.params.parse(req.params);
        // 替換為已解析的乾淨資料
        req.params = parsed as any;
      }
    } catch (e) {
      problems.push({ part: 'params', issues: formatZodError(e as ZodError) });
    }

    try {
      if (schemas.query) {
        const parsed = schemas.query.parse(req.query);
        req.query = parsed as any;
      }
    } catch (e) {
      problems.push({ part: 'query', issues: formatZodError(e as ZodError) });
    }

    try {
      if (schemas.body) {
        const parsed = schemas.body.parse(req.body);
        req.body = parsed as any;
      }
    } catch (e) {
      problems.push({ part: 'body', issues: formatZodError(e as ZodError) });
    }

    try {
      if (schemas.headers) {
        // 以 record 物件驗證，注意 header 名稱需要在 schema 中小寫
        const parsed = schemas.headers.parse(req.headers);
        req.headers = parsed as any;
      }
    } catch (e) {
      problems.push({ part: 'headers', issues: formatZodError(e as ZodError) });
    }

    if (problems.length > 0) {
      return res.status(400).json({
        error: 'ValidationError',
        details: problems,
      });
    }

    return next();
  };
}

// 使用說明（示意）
// import { z } from 'zod';
// app.post(
//   '/conversations',
//   validate({
//     body: z.object({ title: z.string().min(1).max(100) }).strict(),
//     query: z.object({}).strict(),
//   }),
//   handler,
// );
