// 集中式環境設定讀取與基本驗證
// - 僅在需要時檢查必要變數，避免開發初期因未設置而整體崩潰
import dotenv from 'dotenv';

// Prisma 預設讀取 `.env`；額外允許以 `.env.local` 覆蓋執行期設定
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

function requireString(name: string, fallback?: string) {
  const v = process.env[name] ?? fallback;
  if (v === undefined || v === '') return undefined;
  return v;
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  clientOrigin: requireString('CLIENT_ORIGIN', 'http://localhost:5173')!,
  databaseUrl: requireString('DATABASE_URL'),
  firebase: {
    projectId: requireString('FIREBASE_PROJECT_ID'),
    clientEmail: requireString('FIREBASE_CLIENT_EMAIL'),
    privateKey: requireString('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
  },
} as const;

export function hasFirebaseCredentials() {
  const f = config.firebase;
  return !!(f.projectId && f.clientEmail && f.privateKey);
}

