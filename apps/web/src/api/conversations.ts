import { http } from '@/api/client';
import type { Conversation, Message } from '@/api/types';

export async function listConversations(params?: { limit?: number; offset?: number }) {
  const { data } = await http.get<{ items: Conversation[]; hasNextPage?: boolean }>('/conversations', {
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

export async function listMessages(conversationId: string, params?: { limit?: number; offset?: number }) {
  const { data } = await http.get<{ items: Message[]; hasNextPage?: boolean }>(
    `/conversations/${conversationId}/messages`,
    { params },
  );
  return data;
}

export async function deleteConversation(id: string) {
  await http.delete(`/conversations/${id}`);
}
