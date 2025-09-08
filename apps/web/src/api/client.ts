import axios from 'axios';
import { toast } from 'vue-sonner';
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

// 全域回應攔截：統一錯誤提示
http.interceptors.response.use(
  (res) => res,
  (err) => {
    const cfg = err?.config || {};
    const headers = cfg.headers || {};
    // 預設為 silent；只有在 show 標記時才提示
    const show = cfg.showError === true || headers['X-Show-Error'] === '1';
    if (show) {
      const status = err?.response?.status;
      const statusText = err?.response?.statusText;
      const data = err?.response?.data;
      const serverMsg = (typeof data === 'string' ? data : (data?.error || data?.message)) as string | undefined;
      const msg = serverMsg || err?.message || '發生未知錯誤';
      const prefix = status ? `${status}${statusText ? ' ' + statusText : ''}` : '請求失敗';
      toast.error(`${prefix}：${msg}`);
    }
    return Promise.reject(err);
  },
);
