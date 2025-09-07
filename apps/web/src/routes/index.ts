import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useSessionStore } from '@/stores/session'
import { waitForAuthReady } from '@/composables/useAuth'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/pages/Home.vue'),
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/pages/Profile.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/ui',
    name: 'ui-demo',
    component: () => import('@/pages/UiDemo.vue'),
  },
  {
    path: '/chat',
    name: 'chat',
    component: () => import('@/pages/Chat.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/test',
    name: 'test',
    component: () => import('@/pages/Test.vue'),
  },
]

export function createAppRouter() {
  const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
  })

  // 簡易路由守衛：
  // - 需要認證的路由（meta.requiresAuth）在未登入時導回首頁
  // - 初始載入狀態為 loading 時不攔截，以避免在 auth 初始化期間造成閃爍
  router.beforeEach(async (_to, _from) => {
    const session = useSessionStore()
    if (_to.meta?.requiresAuth) {
      // 等待首次 Auth 狀態解析完成（避免在 loading 階段放行造成功能頁閃爍）
      if (session.status === 'loading') {
        await waitForAuthReady()
      }
      if (!session.isAuthenticated) return { name: 'home' }
    }
    return true
  })

  return router
}

export type AppRouter = ReturnType<typeof createAppRouter>
