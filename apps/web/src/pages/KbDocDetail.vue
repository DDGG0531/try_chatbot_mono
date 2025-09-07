<template>
  <div class="py-6 space-y-6">
    <Breadcrumb v-if="id && docId">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink as-child>
            <RouterLink to="/kb">知識庫</RouterLink>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink as-child>
            <RouterLink :to="{ name: 'kb-docs', params: { id } }">{{ kbName || id }}</RouterLink>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>文件 {{ docId }}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>

    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold">文件詳情</h1>
        <p class="text-sm text-muted-foreground">隸屬 KB：{{ kbName || id }}</p>
      </div>
      <div class="flex gap-2">
        <Button variant="outline" @click="$router.push({ name: 'kb-docs', params: { id } })">返回列表</Button>
      </div>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>內容</CardTitle>
      </CardHeader>
      <CardContent class="space-y-6">
        <div>
          <Label class="text-muted-foreground">問題</Label>
          <div class="mt-1">{{ doc?.question || '—' }}</div>
        </div>
        <div>
          <Label class="text-muted-foreground">答案</Label>
          <div class="mt-1">{{ doc?.answer || '—' }}</div>
        </div>
        <!-- content 不再顯示，僅呈現問答與時間資訊 -->
        <div>
          <Label class="text-muted-foreground">建立時間</Label>
          <div class="mt-1 text-sm text-muted-foreground">{{ formatTime(doc?.createdAt) }}</div>
        </div>
        <div>
          <Label class="text-muted-foreground">更新時間</Label>
          <div class="mt-1 text-sm text-muted-foreground">{{ formatTime(doc?.updatedAt) }}</div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { getKb } from '@/api/kb'
import { getDoc, getDocById, type KbDoc } from '@/api/kb-docs'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

const route = useRoute()
const id = ref<string>('')
const docId = route.params.docId as string

const kbName = ref('')
const doc = ref<KbDoc | null>(null)

function formatTime(t?: string | Date | null) {
  if (!t) return '—'
  const d = typeof t === 'string' ? new Date(t) : t
  return d.toLocaleString()
}

onMounted(async () => {
  if (!id.value) {
    // 無 KB id 的情況，先查 doc 取得 kbId
    const d = await getDocById(docId)
    doc.value = d
    id.value = d.kbId
  } else {
    doc.value = await getDoc(id.value, docId)
  }
  if (id.value) {
    const kb = await getKb(id.value)
    kbName.value = kb.name
  }
})
</script>
