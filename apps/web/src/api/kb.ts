import { http } from '@/api/client';
import type { KnowledgeBase } from './types';

export async function listKb(params?: { limit?: number; cursor?: string }) {
  const { data } = await http.get<{ items: KnowledgeBase[]; nextCursor?: string }>('/kb', { params });
  return data;
}

export async function getKb(id: string) {
  const { data } = await http.get<KnowledgeBase>(`/kb/${id}`);
  return data;
}

export async function createKb(payload: { name: string; description?: string; isPublic?: boolean }) {
  const { data } = await http.post<KnowledgeBase>('/kb', payload);
  return data;
}

export async function updateKb(id: string, payload: { name?: string; description?: string; isPublic?: boolean }) {
  const { data } = await http.patch<KnowledgeBase>(`/kb/${id}`, payload);
  return data;
}

export async function deleteKb(id: string) {
  await http.delete(`/kb/${id}`);
}

