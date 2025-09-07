import { createApp } from 'vue';
import App from '@/App.vue';
import { createAppRouter } from '@/routes';
import { createPinia } from 'pinia';
import { initAuth } from '@/composables/useAuth';
import './index.css';

const router = createAppRouter();
const pinia = createPinia();

// 啟動應用並注入 Pinia 與 Router
const app = createApp(App);
app.use(pinia);
app.use(router);

// 啟動全域的 Auth 訂閱，於首次載入即同步會話
initAuth();

app.mount('#app');
