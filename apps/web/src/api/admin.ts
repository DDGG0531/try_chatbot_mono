import { http } from '@/api/client'

export type AdminUser = {
  id: string
  displayName: string
  email: string | null
  photo: string | null
  role: 'USER' | 'ADMIN'
  createdAt: string | Date
}

export type AuditLog = {
  id: string
  actorId: string
  action: string
  resourceType?: string | null
  resourceId?: string | null
  metadata?: any
  createdAt: string | Date
  actor?: { id: string; displayName?: string | null; email?: string | null }
}

export async function listUsers(params?: { limit?: number; offset?: number }) {
  const { data } = await http.get<{ items: AdminUser[]; hasNextPage?: boolean }>(`/admin/users`, { params })
  return data
}

export async function updateUserRole(id: string, role: 'USER' | 'ADMIN') {
  const { data } = await http.patch<{ id: string; role: 'USER' | 'ADMIN' }>(`/admin/users/${id}`, { role })
  return data
}

export async function listAuditLogs(params?: { limit?: number; offset?: number }) {
  const { data } = await http.get<{ items: AuditLog[]; hasNextPage?: boolean }>(`/admin/audit-logs`, { params })
  return data
}
