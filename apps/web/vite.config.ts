import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  // 載入對應模式的環境變數
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [vue(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    // Dev Server 與 API 代理
    // - 前端以 `/api` 作為固定前綴呼叫，開發時透過 proxy 轉發到實際後端位址
    // - 生產環境可透過 Nginx/網關配置相同前綴或改用 `VITE_API_BASE`
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: env.VITE_API_BASE || 'http://localhost:4000',
          changeOrigin: true,
          // 將 `/api/*` 轉發為後端的 `/*`
          rewrite: (p) => p.replace(/^\/api/, ''),
        },
      },
    },
  }
});
