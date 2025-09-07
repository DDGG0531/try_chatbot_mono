import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { fetchMe } from '@/api/users';
import { useSessionStore } from '@/stores/session';

// useAuth composable
// - 統一訂閱 Firebase Auth 狀態
// - 當登入時向後端呼叫 /me 同步使用者資料
// - 寫入 Pinia session store，供全站使用

let initialized = false;
let ready = false;
let readyResolvers: Array<() => void> = [];

export function waitForAuthReady(): Promise<void> {
  if (ready) return Promise.resolve();
  return new Promise<void>((resolve) => {
    readyResolvers.push(resolve);
  });
}

export function initAuth() {
  if (initialized) return;
  initialized = true;

  const session = useSessionStore();
  session.setLoading();

  // E2E：若設定 VITE_E2E_AUTH 且有本地 Bearer，直接嘗試以 /me 同步會話
  if (import.meta.env.VITE_E2E_AUTH === '1') {
    const token = localStorage.getItem('E2E_BEARER');
    if (token) {
      fetchMe()
        .then((me) => session.setUser(me))
        .catch(() => session.setUser(null))
        .finally(() => {
          if (!ready) {
            ready = true;
            const resolvers = readyResolvers;
            readyResolvers = [];
            resolvers.forEach((r) => r());
          }
        });
    }
  }

  onAuthStateChanged(auth, async (firebaseUser) => {
    try {
      if (!firebaseUser) {
        session.setUser(null);
        return;
      }
      const me = await fetchMe();
      session.setUser(me);
    } catch (_err) {
      // 任何非 401 錯誤：將狀態視為未登入，但避免拋出以免中斷應用
      session.setUser(null);
    } finally {
      if (!ready) {
        ready = true;
        const resolvers = readyResolvers;
        readyResolvers = [];
        resolvers.forEach((r) => r());
      }
    }
  });
}

export function useAuth() {
  const session = useSessionStore();
  return {
    session,
  };
}
