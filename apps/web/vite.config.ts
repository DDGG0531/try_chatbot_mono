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
    server: {
      port: 5173,
      proxy: {
        '/proxy': {
          target: env.VITE_API_BASE,
          changeOrigin: true,
          rewrite: path => path.replace(/^\/proxy/, '')
        },
      },
    },
  }
});
