import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { fetchMe } from '@/api/users';
import { useSessionStore } from '@/stores/session';

// useAuth composable
// - 統一訂閱 Firebase Auth 狀態
// - 當登入時向後端呼叫 /me 同步使用者資料
// - 寫入 Pinia session store，供全站使用

let initialized = false;

export function initAuth() {
  if (initialized) return;
  initialized = true;

  const session = useSessionStore();
  session.setLoading();

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
    }
  });
}

export function useAuth() {
  const session = useSessionStore();
  return {
    session,
  };
}

