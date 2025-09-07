API (Express + Firebase Admin Auth)

Env
- Copy `.env.example` to `.env` and fill values
- Firebase Admin (Service Account): `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`

Key Routes
- GET /api/me -> Current user (requires Authorization: Bearer <idToken>) or 401

Dev
- Start Postgres: `docker-compose up -d`
- Generate Prisma client: auto via predev/prebuild; or `pnpm prisma:generate`
- Apply migrations (dev): `pnpm migrate:dev`
- Apply migrations (deploy): `pnpm migrate:deploy`
- dev: `pnpm dev` (http://localhost:4000)

Notes
- 採用集中式環境設定 `src/config.ts`，避免分散取用 `process.env`
- 透過 `src/types/express.d.ts` 擴充 `Request.user`，減少型別抑制
- 啟動時與 SIGINT/SIGTERM 進行優雅關閉（釋放 Prisma 連線）
 - 資料驗證：使用 `zod` 與通用中介層 `validate()` 驗證 `body/query/params/headers`

Validation Usage (示例)
`src/middleware/validate.ts` 提供 `validate(schemas)`：

```ts
import { z } from 'zod'
import { validate } from './middleware/validate'

app.post(
  '/conversations',
  validate({
    body: z.object({ title: z.string().min(1).max(100) }).strict(),
  }),
  (req, res) => { /* req.body 已為解析後型別 */ }
)
```
