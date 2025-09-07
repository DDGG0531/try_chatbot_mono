import { http } from '@/api/client';
import type { User } from '@/api/types';

export async function fetchMe(): Promise<User | null> {
  try {
    const { data } = await http.get<User>('/me');
    return data;
  } catch (err: any) {
    if (err?.response?.status === 401) return null;
    throw new Error('Failed to fetch user');
  }
}
