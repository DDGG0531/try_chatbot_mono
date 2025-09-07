<template>
  <div class="py-6 space-y-6">
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink as-child>
            <RouterLink to="/kb">知識庫</RouterLink>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{{ kbName || id }}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
    <div class="flex items-center">
      <div class="flex items-center gap-2 ml-auto">
        <Button @click="openCreate">新增</Button>
      </div>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>文件列表</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="overflow-x-auto">
          <DataTable
            :columns="columns"
            :items="rows"
            :loading="loading"
            empty-text="尚無文件"
            row-key="id"
            :striped="true"
            :dense="false"
            :sticky-header="true"
          >
            <template #cell-question="{ value }">
              <div class="truncate">{{ value }}</div>
            </template>
            <template #cell-answer="{ value }">
              <div class="truncate">{{ value }}</div>
            </template>
            <template #cell-createdAt="{ value }">
              <div class="text-sm text-muted-foreground">{{ formatTime(value) }}</div>
            </template>
            <template #cell-actions="{ row }">
              <div class="text-right space-x-2">
                <Button size="sm" variant="secondary" @click="openEdit(row)">編輯</Button>
                <Button size="sm" variant="destructive" @click="confirmDelete(row.id)">刪除</Button>
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

    <!-- Create / Edit Dialog -->
    <Dialog v-model:open="modal.open">
      <DialogContent class="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>{{ modal.mode === 'create' ? '新增文件' : '編輯文件' }}</DialogTitle>
          <DialogDescription>
            僅需填寫「問題」與/或「答案」。content 將自動由問答合成，無須填寫。
          </DialogDescription>
        </DialogHeader>
        <form class="grid gap-3" @submit.prevent="onSubmitModal">
          <div>
            <Label for="q">問題（選填）</Label>
            <Input id="q" v-model="modal.draft.question" placeholder="例如：如何登入？" />
          </div>
          <div>
            <Label for="a">答案（選填）</Label>
            <Input id="a" v-model="modal.draft.answer" placeholder="例如：請使用 Google 登入" />
          </div>
          <div class="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" @click="modal.open = false">取消</Button>
            <Button type="submit" :disabled="modal.saving || !hasAny(modal.draft)">
              {{ modal.saving ? '儲存中...' : (modal.mode === 'create' ? '建立' : '儲存') }}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Delete Confirm -->
    <AlertDialog v-model:open="del.open">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>確認刪除文件？</AlertDialogTitle>
          <AlertDialogDescription>此動作無法復原，將刪除此文件。</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="del.open = false">取消</AlertDialogCancel>
          <AlertDialogAction :disabled="del.loading" @click="onDeleteConfirmed">
            {{ del.loading ? '刪除中...' : '刪除' }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>

</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { getKb } from '@/api/kb'
import { listDocs, createDocs, updateDoc, deleteDoc, type KbDoc } from '@/api/kb-docs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import DataTable from '@/components/shared/DataTable.vue'
import { useCursorPager } from '@/composables/useCursorPager'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { toast } from 'vue-sonner'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'

const route = useRoute()
const id = route.params.id as string

const columns = [
  { key: 'question', label: '問題', class: 'w-48' },
  { key: 'answer', label: '答案', class: 'w-48' },
  { key: 'createdAt', label: '建立時間', class: 'w-40' },
  { key: 'actions', label: '操作', class: 'w-36' },
]

const { items, hasNextPage, loading, refresh, loadMore } = useCursorPager<KbDoc>((p) => listDocs(id, p))
const rows = computed(() => items.value)
const kbName = ref('')

const modal = reactive({
  open: false,
  mode: 'create' as 'create' | 'edit',
  saving: false,
  id: '' as string,
  draft: { question: '', answer: '' },
})
const del = reactive({ open: false, id: '' as string | null, loading: false })

function hasAny(d: { question?: string; answer?: string }) {
  return !!(d.question || d.answer)
}

function formatTime(t: string | Date) {
  const d = typeof t === 'string' ? new Date(t) : t
  return d.toLocaleString()
}


async function fetchKbName() {
  const kb = await getKb(id)
  kbName.value = kb.name
}

function resetDraft() { modal.id = ''; modal.draft = { question: '', answer: '' } }
function openCreate() { modal.mode = 'create'; resetDraft(); modal.open = true }
function openEdit(d: KbDoc) {
  modal.mode = 'edit'; modal.id = d.id
  modal.draft = { question: d.question || '', answer: d.answer || '' }
  modal.open = true
}

async function onSubmitModal() {
  if (!hasAny(modal.draft)) return
  modal.saving = true
  try {
    if (modal.mode === 'create') {
      await createDocs(id, [{ question: modal.draft.question || undefined, answer: modal.draft.answer || undefined }])
      // 重新載入列表起頭
      await refresh(20)
      toast.success('已建立文件')
    } else {
      const updated = await updateDoc(id, modal.id, { question: modal.draft.question || undefined, answer: modal.draft.answer || undefined })
      items.value = items.value.map(x => x.id === modal.id ? updated : x)
      toast.success('已更新')
    }
    modal.open = false
  } catch (e: any) {
    toast.error((modal.mode === 'create' ? '建立' : '更新') + '失敗：' + (e?.message || ''))
  } finally {
    modal.saving = false
  }
}

function confirmDelete(id: string) { del.id = id; del.open = true }
async function onDeleteConfirmed() {
  if (!del.id) return
  del.loading = true
  try {
    await deleteDoc(id, del.id)
    items.value = items.value.filter(x => x.id !== del.id)
    toast.success('已刪除')
    del.open = false
  } catch (e: any) {
    toast.error('刪除失敗：' + (e?.message || ''))
  } finally {
    del.loading = false
    del.id = null
  }
}

onMounted(() => { fetchKbName(); refresh(20) })
</script>

<style scoped></style>
