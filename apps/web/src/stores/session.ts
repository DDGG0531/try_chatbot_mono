import { defineStore } from 'pinia';
import type { User } from '@/api/types';

// Session Store
// - 保存最小會話狀態（登入狀態、載入中、使用者資料）
// - 僅處理「客戶端/UI 狀態」，伺服器資料請使用資料抓取層（例如 Vue Query）
export type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

type State = {
  status: SessionStatus;
  user: User | null;
};

export const useSessionStore = defineStore('session', {
  state: (): State => ({
    status: 'loading',
    user: null,
  }),
  getters: {
    isAuthenticated: (s) => s.status === 'authenticated' && !!s.user,
  },
  actions: {
    setLoading() {
      this.status = 'loading';
    },
    setUser(user: User | null) {
      this.user = user;
      this.status = user ? 'authenticated' : 'unauthenticated';
    },
    reset() {
      this.status = 'unauthenticated';
      this.user = null;
    },
  },
});

