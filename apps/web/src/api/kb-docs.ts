import { http } from '@/api/client'

export type KbDoc = {
  id: string
  question?: string | null
  answer?: string | null
  content?: string | null
  extra?: any
  createdAt: string | Date
  updatedAt: string | Date
}

export async function listDocs(kbId: string, params?: { limit?: number; offset?: number }) {
  const { data } = await http.get<{ items: KbDoc[]; hasNextPage?: boolean }>(`/kb/${kbId}/docs`, { params })
  return data
}

export async function createDocs(kbId: string, items: Array<{ question?: string; answer?: string; content?: string; extra?: any }>) {
  const { data } = await http.post<{ inserted: number }>(`/kb/${kbId}/docs`, { items })
  return data
}

export async function updateDoc(kbId: string, docId: string, payload: { question?: string; answer?: string; content?: string; extra?: any }) {
  const { data } = await http.patch<KbDoc>(`/kb/${kbId}/docs/${docId}`, payload)
  return data
}

export async function deleteDoc(kbId: string, docId: string) {
  await http.delete(`/kb/${kbId}/docs/${docId}`)
}

export async function getDoc(kbId: string, docId: string) {
  const { data } = await http.get<KbDoc>(`/kb/${kbId}/docs/${docId}`)
  return data
}

export async function getDocById(docId: string) {
  const { data } = await http.get<KbDoc & { kbId: string }>(`/docs/${docId}`)
  return data
}
