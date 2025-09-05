import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup, signOut } from 'firebase/auth';

export type User = {
  id: string;
  displayName: string;
  email?: string;
  photo?: string;
};

async function getIdToken(): Promise<string | null> {
  const u = auth.currentUser;
  if (!u) return null;
  return await u.getIdToken(); // auto-refresh handled by SDK
}

export async function fetchMe(): Promise<User | null> {
  const token = await getIdToken();
  if (!token) return null;
  const res = await fetch('/api/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error('Failed to fetch user');
  return res.json();
}

export async function loginWithGoogle() {
  await signInWithPopup(auth, googleProvider);
}

export async function logout() {
  await signOut(auth);
}
