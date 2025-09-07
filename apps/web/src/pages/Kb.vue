<template>
  <div class="py-6 space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold">知識庫管理</h1>
      <Button size="sm" @click="openCreate">
        新增
      </Button>
    </div>

    <!-- KB List -->
    <Card>
      <CardHeader>
        <CardTitle>我的知識庫</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="overflow-x-auto">
          <Table class="min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead>名稱</TableHead>
                <TableHead class="hidden md:table-cell">描述</TableHead>
                <TableHead class="w-32">狀態</TableHead>
                <TableHead class="w-40 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="kb in items" :key="kb.id">
                <TableCell>
                  <div class="font-medium">{{ kb.name }}</div>
                </TableCell>
                <TableCell class="hidden md:table-cell">
                  <div class="text-muted-foreground line-clamp-1">{{ kb.description }}</div>
                </TableCell>
                <TableCell>
                  <Badge :variant="kb.isPublic ? 'default' : 'secondary'">{{ kb.isPublic ? '公開' : '私人' }}</Badge>
                </TableCell>
                <TableCell class="text-right space-x-2">
                  <Button size="sm" variant="secondary" @click="openEdit(kb)">編輯</Button>
                  <Button size="sm" variant="destructive" @click="confirmDelete(kb.id)">刪除</Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <div class="mt-4">
          <Button v-if="nextCursor" variant="outline" :disabled="loadingMore" @click="loadMore">
            {{ loadingMore ? '載入中...' : '載入更多' }}
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Create / Edit Dialog -->
    <Dialog v-model:open="modal.open">
      <DialogContent class="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{{ modal.mode === 'create' ? '新增知識庫' : '編輯知識庫' }}</DialogTitle>
          <DialogDescription>
            {{ modal.mode === 'create' ? '建立後可在聊天中選用' : '更新知識庫資訊' }}
          </DialogDescription>
        </DialogHeader>
        <form class="grid gap-3" @submit.prevent="onSubmitModal">
          <div>
            <Label for="modal-name">名稱</Label>
            <Input id="modal-name" v-model="modal.draft.name" placeholder="例如：產品 FAQ" />
          </div>
          <div>
            <Label for="modal-desc">描述</Label>
            <Input id="modal-desc" v-model="modal.draft.description" placeholder="選填，最多 500 字" />
          </div>
          <div class="flex items-center gap-2">
            <Checkbox id="modal-pub" v-model="modal.draft.isPublic" />
            <Label for="modal-pub">公開</Label>
          </div>
          <div class="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" @click="modal.open = false">取消</Button>
            <Button type="submit" :disabled="modal.saving || !modal.draft.name">
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
          <AlertDialogTitle>確認刪除？</AlertDialogTitle>
          <AlertDialogDescription>此動作無法復原，將刪除該知識庫與其文件。</AlertDialogDescription>
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
import { onMounted, reactive, ref } from 'vue'
import { listKb, createKb, updateKb, deleteKb } from '@/api/kb'
import type { KnowledgeBase } from '@/api/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { toast } from 'vue-sonner'

const items = ref<KnowledgeBase[]>([])
const nextCursor = ref<string | undefined>()
const loadingMore = ref(false)
const modal = reactive({
  open: false,
  mode: 'create' as 'create' | 'edit',
  saving: false,
  id: '' as string,
  draft: { name: '', description: '', isPublic: false },
})
const del = reactive({ open: false, id: '' as string | null, loading: false })

async function fetchList(initial = false) {
  const { items: data, nextCursor: nc } = await listKb({ limit: 20, cursor: initial ? undefined : nextCursor.value })
  if (initial) items.value = data
  else items.value = [...items.value, ...data]
  nextCursor.value = nc
}

function resetDraft() { modal.id = ''; modal.draft = { name: '', description: '', isPublic: false } }
function openCreate() { modal.mode = 'create'; resetDraft(); modal.open = true }
function openEdit(kb: KnowledgeBase) {
  modal.mode = 'edit';
  modal.id = kb.id;
  modal.draft = { name: kb.name, description: kb.description ?? '', isPublic: kb.isPublic };
  modal.open = true;
}

async function onSubmitModal() {
  if (!modal.draft.name) return
  modal.saving = true
  try {
    if (modal.mode === 'create') {
      const created = await createKb({ name: modal.draft.name, description: modal.draft.description || undefined, isPublic: modal.draft.isPublic })
      items.value = [created, ...items.value]
      toast.success('已建立知識庫')
    } else {
      const updated = await updateKb(modal.id, { name: modal.draft.name, description: modal.draft.description, isPublic: modal.draft.isPublic })
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
    await deleteKb(del.id)
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

async function loadMore() {
  if (!nextCursor.value) return
  loadingMore.value = true
  try {
    const { items: more, nextCursor: nc } = await listKb({ limit: 20, cursor: nextCursor.value })
    items.value = [...items.value, ...more]
    nextCursor.value = nc
  } finally {
    loadingMore.value = false
  }
}

onMounted(() => { fetchList(true) })
</script>

<style scoped></style>
