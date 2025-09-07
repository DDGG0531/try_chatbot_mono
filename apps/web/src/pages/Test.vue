<template>
  <div class="grid h-[calc(100dvh-80px)] grid-cols-[16rem_1fr] gap-3">
    <!-- 側欄：會話列表（本地模擬） -->
    <aside class="flex min-h-0 flex-col gap-3">
      <div class="rounded-xl border p-3">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-sm font-semibold text-muted-foreground">會話（測試）</h2>
          <Button size="sm" variant="outline" @click="onCreateConversation">新會話</Button>
        </div>
        <div class="space-y-1 overflow-auto">
          <button
            v-for="c in conversations"
            :key="c.id"
            class="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
            :class="c.id === selectedId ? 'bg-accent text-accent-foreground' : ''"
            @click="selectConversation(c.id)"
          >
            <span class="truncate">{{ c.title }}</span>
          </button>
        </div>
      </div>
    </aside>

    <!-- 主區：訊息 + 輸入 -->
    <div class="grid grid-rows-[1fr_auto] gap-3">
      <!-- 訊息列表區 -->
      <div ref="listEl" class="overflow-auto rounded-xl border bg-card p-3" aria-label="chat messages">
        <div v-if="selectedMessages.length === 0" class="text-center text-sm text-muted-foreground">
          尚無訊息，輸入內容開始對話（純前端模擬串流）。
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
          </div>
        </div>
      </div>

      <!-- 輸入區 -->
      <form class="flex gap-2" @submit.prevent="onSend">
        <Input v-model="draft" placeholder="輸入訊息...（不呼叫 API）" :disabled="running" />
        <Button type="submit" :disabled="running || draft.trim().length === 0">送出</Button>
        <Button type="button" variant="outline" @click="stopStreaming" :disabled="!running">停止</Button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// 與 Chat.vue 對齊的最小資料結構
type ChatRole = 'user' | 'assistant'
type ChatMessage = { id: string; role: ChatRole; content: string }
type Conversation = { id: string; title: string; createdAt: number }

const conversations = ref<Conversation[]>([])
const selectedId = ref<string>('')
const messagesByConv = ref<Record<string, ChatMessage[]>>({})

const draft = ref('')
const listEl = ref<HTMLDivElement | null>(null)
const running = ref(false)
let ticker: number | undefined

const selectedMessages = computed(() => messagesByConv.value[selectedId.value] ?? [])

function scrollToBottom() {
  if (!listEl.value) return
  listEl.value.scrollTop = listEl.value.scrollHeight
}

function seedIfEmpty() {
  if (conversations.value.length > 0) return
  const id = `c_${Date.now()}`
  conversations.value.push({ id, title: '測試會話', createdAt: Date.now() })
  messagesByConv.value[id] = [
    { id: 'm1', role: 'assistant', content: '這裡是前端純模擬串流測試。' },
  ]
  selectedId.value = id
}

onMounted(() => {
  seedIfEmpty()
})

function onCreateConversation() {
  const id = `c_${Date.now()}`
  conversations.value.unshift({ id, title: '新的會話', createdAt: Date.now() })
  messagesByConv.value[id] = []
  selectedId.value = id
}

function selectConversation(id: string) {
  selectedId.value = id
  nextTick().then(scrollToBottom)
}

// 純前端模擬：將一段字串以固定間隔「串流」到最後一則助理訊息
function startStreamingStreamToAssistant(text: string) {
  const sid = selectedId.value
  if (!sid) return
  if (running.value) return
  running.value = true

  let i = 0
  const source = generateMockReply(text)
  ticker = window.setInterval(async () => {
    if (i >= source.length) {
      stopStreaming()
      return
    }
    const ch = source[i++]

    const current = messagesByConv.value[sid] ?? []
    const lastIdx = current.length - 1
    if (lastIdx >= 0) {
      const updated = { ...current[lastIdx], content: (current[lastIdx].content || '') + ch }
      const nextArr = current.slice()
      nextArr[lastIdx] = updated
      messagesByConv.value = { ...messagesByConv.value, [sid]: nextArr }
      await nextTick()
      scrollToBottom()
    }
  }, 30)
}

function stopStreaming() {
  if (ticker) window.clearInterval(ticker)
  ticker = undefined
  running.value = false
}

function generateMockReply(input: string) {
  const base = '（模擬串流）這是一段純前端產生的回覆，用於驗證 Vue 的即時渲染。您剛輸入：'
  const tail = '\n\n接著會以逐字方式顯示，若能平順出現代表 reactivity 正常。\n—— 完畢。'
  return base + input + tail
}

async function onSend() {
  const text = draft.value.trim()
  if (!text) return

  const sid = selectedId.value
  if (!sid) return

  // 1) 先加入使用者訊息
  const uId = `u_${Date.now()}`
  messagesByConv.value[sid] = [ ...(messagesByConv.value[sid] ?? []), { id: uId, role: 'user', content: text } ]
  draft.value = ''
  await nextTick()
  scrollToBottom()

  // 2) 插入助理佔位，之後用 setInterval 串流逐字追加
  const aId = `a_${Date.now()}`
  messagesByConv.value[sid] = [ ...(messagesByConv.value[sid] ?? []), { id: aId, role: 'assistant', content: '' } ]
  await nextTick()
  scrollToBottom()

  // 3) 啟動純前端串流
  startStreamingStreamToAssistant(text)
}
</script>
