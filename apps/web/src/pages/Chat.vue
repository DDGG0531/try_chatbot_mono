<template>
  <div class="grid h-full min-h-0 grid-cols-[16rem_1fr] gap-3">
    <!-- 側欄：會話列表 -->
    <aside class="flex min-h-0 flex-col gap-3">
      <div class="rounded-xl border p-3">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-sm font-semibold text-muted-foreground">會話</h2>
          <Button size="sm" variant="outline" @click="onCreateConversation">新會話</Button>
        </div>
        <div class="space-y-1 overflow-auto">
          <div
            v-for="c in conversations"
            :key="c.id"
            class="flex w-full items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
            :class="c.id === selectedId ? 'bg-accent text-accent-foreground' : ''"
          >
            <button class="flex-1 text-left truncate" @click="selectConversation(c.id)">{{ c.title }}</button>
            <Button size="icon" variant="ghost" class="h-6 w-6 p-0 text-muted-foreground hover:text-foreground" @click.stop="confirmDeleteConv(c.id)">
              <Trash2 class="h-4 w-4" />
              <span class="sr-only">刪除</span>
            </Button>
          </div>
        </div>
      </div>
    </aside>

    <!-- 主區：訊息 + 輸入 -->
    <div class="grid min-h-0 grid-rows-[auto_1fr_auto] gap-3">
      <!-- KB Selector -->
      <div class="flex items-center gap-2">
        <label class="text-sm text-muted-foreground">知識庫：</label>
        <Select v-model="selectedKbId">
          <SelectTrigger class="w-64">
            <SelectValue placeholder="無" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">無</SelectItem>
            <SelectItem v-for="kb in kbItems" :key="kb.id" :value="kb.id">{{ kb.name }}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <!-- 訊息列表區 -->
      <div ref="listEl" class="overflow-auto rounded-xl border bg-card p-3" aria-label="chat messages">
        <div v-if="selectedMessages.length === 0" class="text-center text-sm text-muted-foreground">
          尚無訊息，輸入內容開始對話。
        </div>
        <div
          v-for="m in selectedMessages"
          :key="m.id"
          class="my-2 flex"
          :class="m.role === 'user' ? 'justify-end' : 'justify-start'"
        >
          <div
            class="max-w-prose whitespace-pre-wrap break-words rounded-xl border px-3 py-2"
            :class="m.role === 'user' ? 'bg-primary/10 border-primary/20' : 'bg-background'"
          >
            <p>{{ m.content }}</p>
            <!-- Citations -->
            <div v-if="m.role==='assistant' && m.citations && m.citations.length" class="mt-2 border-t pt-2">
              <button class="text-xs text-muted-foreground hover:underline" @click="toggleCitations(m.id)">
                {{ openedCitations[m.id] ? '隱藏引用' : '顯示引用' }}
              </button>
              <div v-if="openedCitations[m.id]" class="mt-2 space-y-2">
                <div v-for="c in m.citations" :key="c.id" class="text-xs">
                  <div class="font-medium">
                    來源 
                    <RouterLink
                      :to="{ name: 'doc', params: { docId: c.id } }"
                      target="_blank"
                      class="underline hover:text-foreground"
                    >
                      {{ c.id }}
                    </RouterLink>
                    （score: {{ c.score.toFixed(3) }}）
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 輸入區 -->
      <form class="flex gap-2" @submit.prevent="onSend">
        <Input
          v-model="draft"
          placeholder="輸入訊息..."
          :disabled="sending"
          aria-label="message input"
        />
        <Button type="submit" :disabled="sending || draft.trim().length === 0">
          {{ sending ? '傳送中...' : '送出' }}
        </Button>
      </form>
    </div>

    <!-- Delete Conversation Confirm -->
    <AlertDialog v-model:open="delConv.open">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>確認刪除會話？</AlertDialogTitle>
          <AlertDialogDescription>此操作無法復原，將刪除該會話與其中訊息。</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="delConv.open = false">取消</AlertDialogCancel>
          <AlertDialogAction :disabled="delConv.loading" @click="onDeleteConvConfirmed">
            {{ delConv.loading ? '刪除中...' : '刪除' }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, computed, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Conversation, KnowledgeBase } from '@/api/types'
import { listConversations, createConversation as apiCreateConversation, listMessages } from '@/api/conversations'
import { getIdToken } from '@/api/auth'
import { deleteConversation as apiDeleteConversation } from '@/api/conversations'
import { listKb } from '@/api/kb'
import { getDocById } from '@/api/kb-docs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { toast } from 'vue-sonner'
import { Trash2 } from 'lucide-vue-next'

type ChatRole = 'user' | 'assistant'
type Citation = { id: string; score: number }
type ChatMessage = { id: string; role: ChatRole; content: string; citations?: Citation[] }

const conversations = ref<Conversation[]>([])
const selectedId = ref<string>('')
const messagesByConv = ref<Record<string, ChatMessage[]>>({})
const kbItems = ref<KnowledgeBase[]>([])
const selectedKbId = ref<string>('none')
const openedCitations = ref<Record<string, boolean>>({})
const docCache = ref<Record<string, string>>({})

async function loadConversations() {
  const { items } = await listConversations({ limit: 50 })
  conversations.value = items
  if (!selectedId.value && items.length > 0) {
    await selectConversation(items[0].id)
  }
}

async function loadKbList() {
  try { const { items } = await listKb({ limit: 50 }); kbItems.value = items } catch {}
}

const selectedMessages = computed(() => messagesByConv.value[selectedId.value] ?? [])

const draft = ref('')
const sending = ref(false)
const listEl = ref<HTMLDivElement | null>(null)
const delConv = ref<{ open: boolean; id: string | null; loading: boolean }>({ open: false, id: null, loading: false })

function scrollToBottom() {
  if (!listEl.value) return
  listEl.value.scrollTop = listEl.value.scrollHeight
}

onMounted(async () => {
  await Promise.all([loadConversations(), loadKbList()])
  restoreSelectedKb()
  scrollToBottom()
})

// 送出訊息（SSE 串流版）
// 流程說明：
// 1) 若尚未選擇會話，先建立一個新會話並切換到它（方便後續把訊息歸檔）
// 2) 立即在本地加入「使用者訊息」→ 讓 UI 先呈現
// 3) 插入一則「助理佔位訊息」→ 之後接收串流時把文字逐步追加到這個泡泡
// 4) 以 fetch 連線到 `/api/chat`，以 ReadableStream 解析 SSE：遇到 `data: { type: 'delta' }` 就追加文字
// 5) 用「不可變更新」替換最後一則訊息，確保 Vue 觸發重繪（避免原地修改無法 re-render）
// 6) 完成事件 `type: 'done'` 後可選擇刷新列表或結束讀取
async function onSend() {
  const text = draft.value.trim()
  if (!text) return
  sending.value = true
  try {
    // 確保有選定會話（若無則建立一個）
    if (!selectedId.value) {
      const conv = await apiCreateConversation({ title: '新的會話' })
      conversations.value = [conv, ...conversations.value]
      messagesByConv.value[conv.id] = []
      selectedId.value = conv.id
    }

    const sid = selectedId.value

    // 先在本地加入使用者訊息
    const mid = `u_${Date.now()}`
    messagesByConv.value[sid] = [
      ...(messagesByConv.value[sid] ?? []),
      { id: mid, role: 'user', content: text },
    ]
    draft.value = ''
    await nextTick()
    scrollToBottom()

    // 新增一則 assistant 佔位，隨著串流增量更新內容
    const aid = `a_${Date.now()}`
    messagesByConv.value[sid] = [
      ...(messagesByConv.value[sid] ?? []),
      { id: aid, role: 'assistant', content: '' },
    ]
    await nextTick()
    scrollToBottom()

    const token = await getIdToken()
    if (!token) throw new Error('未登入或權杖失效')

    // 與後端建立 SSE 連線；不使用 axios，直接用 fetch 取得 ReadableStream
    const resp = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        conversationId: sid,
        kbId: selectedKbId.value && selectedKbId.value !== 'none' ? selectedKbId.value : undefined,
        messages: [{ role: 'user', content: text }],
      }),
    })
    if (!resp.ok || !resp.body) throw new Error('連線失敗')

    const reader = resp.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''
    // 持續讀取 SSE 串流：SSE 以空行分隔事件，內容行以 `data: ` 起始
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const sep = buffer.includes('\r\n\r\n') ? '\r\n\r\n' : '\n\n'
      let idx
      while ((idx = buffer.indexOf(sep)) !== -1) {
        const chunk = buffer.slice(0, idx)
        buffer = buffer.slice(idx + sep.length)
        const line = chunk.split('\n').find(l => l.startsWith('data: '))
        if (!line) continue
        try {
          const payload = JSON.parse(line.slice(6))
          if (payload.type === 'delta') {
            const current = messagesByConv.value[sid] ?? []
            const lastIdx = current.length - 1
            if (lastIdx >= 0 && current[lastIdx].id === aid) {
              const updated = {
                ...current[lastIdx],
                content: (current[lastIdx].content || '') + (payload.content || ''),
              }
              const nextArr = current.slice()
              nextArr[lastIdx] = updated
              // 以新陣列與新映射物件替換，確保觸發 reactivity
              messagesByConv.value = { ...messagesByConv.value, [sid]: nextArr }
              // 視情況捲動到底（這裡每個事件都捲動，若頻繁可改為節流）
              await nextTick()
              scrollToBottom()
            }
          } else if (payload.type === 'metadata') {
            // 嘗試掛上 citations
            if (Array.isArray(payload.citations) && payload.citations.length) {
              const current = messagesByConv.value[sid] ?? []
              const lastIdx = current.length - 1
              if (lastIdx >= 0 && current[lastIdx].id.startsWith('a_')) {
                const nextArr = current.slice()
                const last = nextArr[lastIdx]
                nextArr[lastIdx] = { ...last, citations: payload.citations as Citation[] }
                messagesByConv.value = { ...messagesByConv.value, [sid]: nextArr }
              }
            }
          } else if (payload.type === 'done') {
            // 完成：可依需要刷新或記錄 messageId/conversationId
          }
        } catch {
          // 忽略解析錯誤（心跳/空事件）
        }
      }
    }
  } finally {
    sending.value = false
  }
}

async function onCreateConversation() {
  const conv = await apiCreateConversation({ title: '新的會話' })
  conversations.value = [conv, ...conversations.value]
  messagesByConv.value[conv.id] = []
  selectedId.value = conv.id
}

async function selectConversation(id: string) {
  selectedId.value = id
  if (!messagesByConv.value[id]) {
    const { items } = await listMessages(id, { limit: 200 })
    messagesByConv.value[id] = items.map((m) => ({ id: m.id, role: m.role as ChatRole, content: m.content, citations: (m as any).citations }))
  }
  nextTick().then(scrollToBottom)
}

function confirmDeleteConv(id: string) {
  delConv.value = { open: true, id, loading: false }
}

async function onDeleteConvConfirmed() {
  const id = delConv.value.id
  if (!id) return
  delConv.value.loading = true
  try {
    await apiDeleteConversation(id)
    conversations.value = conversations.value.filter((c) => c.id !== id)
    const wasSelected = selectedId.value === id
    delete messagesByConv.value[id]
    if (wasSelected) {
      if (conversations.value.length > 0) {
        const next = conversations.value[0].id
        await selectConversation(next)
      } else {
        selectedId.value = ''
      }
    }
    toast.success('會話已刪除')
  } catch (e: any) {
    toast.error('刪除失敗：' + (e?.message || ''))
  } finally {
    delConv.value = { open: false, id: null, loading: false }
  }
}

function toggleCitations(mid: string) {
  openedCitations.value = { ...openedCitations.value, [mid]: !openedCitations.value[mid] }
}

// --- Persist selected KB to localStorage ---
const LS_KEY_SELECTED_KB = 'selectedKbId'
function restoreSelectedKb() {
  try {
    const saved = localStorage.getItem(LS_KEY_SELECTED_KB)
    if (!saved) return
    if (saved === 'none') { selectedKbId.value = 'none'; return }
    const ok = kbItems.value.some(k => k.id === saved)
    if (ok) selectedKbId.value = saved
    else localStorage.removeItem(LS_KEY_SELECTED_KB)
  } catch {}
}

watch(selectedKbId, (val) => {
  try {
    if (val && val !== 'none') localStorage.setItem(LS_KEY_SELECTED_KB, val)
    else localStorage.removeItem(LS_KEY_SELECTED_KB)
  } catch {}
})

</script>
