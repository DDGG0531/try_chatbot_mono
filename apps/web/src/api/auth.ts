import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup, signOut } from 'firebase/auth';

export async function getIdToken(): Promise<string | null> {
  const u = auth.currentUser;
  if (!u) return null;
  return await u.getIdToken();
}

export async function loginWithGoogle() {
  await signInWithPopup(auth, googleProvider);
}

export async function logout() {
  await signOut(auth);
}

