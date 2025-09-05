import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from '@/App.vue';
import Home from '@/pages/Home.vue';
import Profile from '@/pages/Profile.vue';
import '@/assets/tailwind.css';

const routes = [
  { path: '/', component: Home },
  { path: '/profile', component: Profile },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

createApp(App).use(router).mount('#app');
