<template>
  <div class="py-6 space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold">使用者管理</h1>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>使用者列表</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          :columns="columns"
          :items="users"
          :loading="loading"
          empty-text="尚無使用者"
          row-key="id"
          :dense="false"
          :striped="true"
          :sticky-header="true"
        >
          <template #cell-displayName="{ value }">
            <div class="font-medium">{{ value }}</div>
          </template>
          <template #cell-email="{ value }">
            <div class="text-muted-foreground">{{ value }}</div>
          </template>
          <template #cell-role="{ row }">
            <Select :model-value="row.role" @update:model-value="(val) => onChangeRole(row.id, val)">
              <SelectTrigger class="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">USER</SelectItem>
                <SelectItem value="ADMIN">ADMIN</SelectItem>
              </SelectContent>
            </Select>
          </template>
          <template #cell-createdAt="{ value }">
            <div class="text-sm text-muted-foreground">{{ formatTime(value) }}</div>
          </template>
        </DataTable>
        <div class="mt-4">
          <Button v-if="hasNextPage" variant="outline" :disabled="loading" @click="loadMore()">載入更多</Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { listUsers, updateUserRole, type AdminUser } from '@/api/admin'
import { useCursorPager } from '@/composables/useCursorPager'
import DataTable from '@/components/shared/DataTable.vue'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'vue-sonner'

const columns = [
  { key: 'displayName', label: '名稱', class: 'w-56' },
  { key: 'email', label: 'Email', class: 'w-64' },
  { key: 'role', label: '角色', class: 'w-32' },
  { key: 'createdAt', label: '建立時間', class: 'w-40' },
]

const { items, hasNextPage, loading, refresh, loadMore } = useCursorPager<AdminUser>(listUsers)
const users = computed(() => items.value)

function formatTime(t: string | Date) {
  const d = typeof t === 'string' ? new Date(t) : t
  return d.toLocaleString()
}

async function onChangeRole(id: string, val: string) {
  if (val !== 'USER' && val !== 'ADMIN') return
  try {
    await updateUserRole(id, val)
    const idx = items.value.findIndex(u => u.id === id)
    if (idx >= 0) items.value[idx] = { ...items.value[idx], role: val }
    toast.success('已更新角色')
  } catch (e: any) {
    toast.error('更新失敗：' + (e?.message || ''))
  }
}

onMounted(() => { refresh(50) })
</script>
