import axios from 'axios';
import { auth } from '@/lib/firebase';

// API Client
// - 統一設定 baseURL：
//   - 開發：以 `/api` 由 Vite proxy 轉發到後端
//   - 生產：若設定 `VITE_API_BASE` 則直連該位址；否則仍以 `/api`
// - 以攔截器自動附加 Firebase ID Token（若已登入）
const baseURL = import.meta.env.VITE_API_BASE || '/api';

export const http = axios.create({ baseURL });

http.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});
