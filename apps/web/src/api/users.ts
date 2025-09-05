import { http } from '@/api/client';
import { getIdToken } from '@/api/auth';
import type { User } from '@/api/types';

export async function fetchMe(): Promise<User | null> {
  const token = await getIdToken();
  if (!token) return null;
  try {
    const { data } = await http.get<User>('/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  } catch (err: any) {
    if (err?.response?.status === 401) return null;
    throw new Error('Failed to fetch user');
  }
}

