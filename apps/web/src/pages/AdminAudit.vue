<template>
  <div class="py-6 space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold">稽核紀錄</h1>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>最近事件</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="overflow-x-auto">
          <DataTable
            :columns="columns"
            :items="rows"
            :loading="loading"
            empty-text="尚無稽核紀錄"
            row-key="id"
          >
            <template #cell-createdAt="{ value }">
              <div class="text-sm text-muted-foreground">{{ formatTime(value) }}</div>
            </template>
            <template #cell-actor="{ row }">
              <div class="truncate">
                {{ row.actor?.displayName || row.actor?.email || row.actorId }}
              </div>
            </template>
            <template #cell-metadata="{ value }">
              <div class="text-muted-foreground truncate">
                {{ previewMeta(value) }}
              </div>
            </template>
          </DataTable>
        </div>
        <div class="mt-4 text-center">
          <Button v-if="hasNextPage" variant="outline" :disabled="loading" @click="loadMore()">
            {{ loading ? '載入中...' : '載入更多' }}
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { listAuditLogs, type AuditLog } from '@/api/admin'
import DataTable from '@/components/shared/DataTable.vue'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useCursorPager } from '@/composables/useCursorPager'

const columns = [
  { key: 'createdAt', label: '時間', class: 'w-44' },
  { key: 'actor', label: '操作人', class: 'w-56' },
  { key: 'action', label: '動作', class: 'w-40' },
  { key: 'resourceType', label: '資源類型', class: 'w-40' },
  { key: 'resourceId', label: '資源 ID', class: 'w-48' },
  { key: 'metadata', label: '附註' },
]

const { items, hasNextPage, loading, refresh, loadMore } = useCursorPager<AuditLog>(listAuditLogs)
const rows = computed(() => items.value)

function formatTime(t: string | Date) {
  const d = typeof t === 'string' ? new Date(t) : t
  return d.toLocaleString()
}

function previewMeta(val: any) {
  if (!val) return '—'
  try {
    const s = typeof val === 'string' ? val : JSON.stringify(val)
    return s.length > 80 ? s.slice(0, 80) + '…' : s
  } catch {
    return '—'
  }
}

refresh(50)
</script>
