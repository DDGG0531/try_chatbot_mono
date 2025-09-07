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
    path: '/admin/users',
    name: 'admin-users',
    component: () => import('@/pages/AdminUsers.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/admin/audit-logs',
    name: 'admin-audit',
    component: () => import('@/pages/AdminAudit.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/pages/Profile.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/chat',
    name: 'chat',
    component: () => import('@/pages/Chat.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/kb',
    name: 'kb',
    component: () => import('@/pages/Kb.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/kb/:id/docs',
    name: 'kb-docs',
    component: () => import('@/pages/KbDocs.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/docs/:docId',
    name: 'doc',
    component: () => import('@/pages/KbDocDetail.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/404',
    name: 'not-found',
    component: () => import('@/pages/NotFound.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404',
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
    if (_to.meta?.requiresAdmin) {
      if (session.status === 'loading') {
        await waitForAuthReady()
      }
      if (session.user?.role !== 'ADMIN') return { name: 'not-found', path: '/403' }
    }
    return true
  })

  return router
}

export type AppRouter = ReturnType<typeof createAppRouter>
