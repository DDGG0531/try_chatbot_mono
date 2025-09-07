import { http } from '@/api/client';
import type { Conversation, Message } from '@/api/types';

export async function listConversations(params?: { limit?: number; cursor?: string }) {
  const { data } = await http.get<{ items: Conversation[]; nextCursor?: string }>('/conversations', {
    params,
  });
  return data;
}

export async function createConversation(payload: { title?: string } = {}) {
  const { data } = await http.post<Conversation>('/conversations', payload);
  return data;
}

export async function getConversation(id: string) {
  const { data } = await http.get<Conversation>(`/conversations/${id}`);
  return data;
}

export async function listMessages(conversationId: string, params?: { limit?: number; cursor?: string }) {
  const { data } = await http.get<{ items: Message[]; nextCursor?: string }>(
    `/conversations/${conversationId}/messages`,
    { params },
  );
  return data;
}

