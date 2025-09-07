import type { NextFunction, Request, Response } from 'express';
import type { ZodType, ZodError } from 'zod';

type Schemas = {
  body?: ZodType<unknown>;
  query?: ZodType<unknown>;
  params?: ZodType<unknown>;
  headers?: ZodType<unknown>;
};

function formatZodError(err: unknown) {
  const z = err as ZodError | undefined;
  const issues = Array.isArray(z?.issues) ? z!.issues : [{ path: [], code: 'invalid_input', message: String(err) } as any];
  return issues.map((i: any) => ({
    path: i.path.join('.'),
    code: i.code,
    message: i.message,
  }));
}

export function validate(schemas: Schemas) {
  return (req: Request, res: Response, next: NextFunction) => {
    const problems: Array<{ part: keyof Schemas; issues: ReturnType<typeof formatZodError> }> = [];
    // 不覆寫 Express 內建屬性，將解析後的結果放在 req.validated
    // 由型別宣告檔擴充，避免 runtime setter 錯誤
    const validated: any = (req as any).validated || {};

    try {
      if (schemas.params) {
        const parsed = schemas.params.parse(req.params);
        validated.params = parsed;
      }
    } catch (e) {
      problems.push({ part: 'params', issues: formatZodError(e) });
    }

    try {
      if (schemas.query) {
        const parsed = schemas.query.parse(req.query);
        validated.query = parsed;
      }
    } catch (e) {
      problems.push({ part: 'query', issues: formatZodError(e) });
    }

    try {
      if (schemas.body) {
        const parsed = schemas.body.parse(req.body);
        validated.body = parsed;
      }
    } catch (e) {
      problems.push({ part: 'body', issues: formatZodError(e) });
    }

    try {
      if (schemas.headers) {
        const parsed = schemas.headers.parse(req.headers);
        validated.headers = parsed;
      }
    } catch (e) {
      problems.push({ part: 'headers', issues: formatZodError(e) });
    }

    if (problems.length > 0) {
      return res.status(400).json({
        error: 'ValidationError',
        details: problems,
      });
    }

    (req as any).validated = validated;
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
