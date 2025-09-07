<template>
  <div class="grid h-[calc(100dvh-80px)] grid-cols-[16rem_1fr] gap-3">
    <!-- 側欄：會話列表 -->
    <aside class="flex min-h-0 flex-col gap-3">
      <div class="rounded-xl border p-3">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-sm font-semibold text-muted-foreground">會話</h2>
          <Button size="sm" variant="outline" @click="createConversation">新會話</Button>
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
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type ChatRole = 'user' | 'assistant'
type ChatMessage = { id: string; role: ChatRole; content: string }

type Conversation = { id: string; title: string; createdAt: number }

const conversations = ref<Conversation[]>([])
const selectedId = ref<string>('')
const messagesByConv = ref<Record<string, ChatMessage[]>>({})

function ensureSeed() {
  if (conversations.value.length === 0) {
    const id = `c_${Date.now()}`
    conversations.value.push({ id, title: '新的會話', createdAt: Date.now() })
    messagesByConv.value[id] = [
      { id: 'm1', role: 'assistant', content: '嗨！今天想聊什麼？' },
    ]
    selectedId.value = id
  }
}

const selectedMessages = computed(() => messagesByConv.value[selectedId.value] ?? [])

const draft = ref('')
const sending = ref(false)
const listEl = ref<HTMLDivElement | null>(null)

function scrollToBottom() {
  if (!listEl.value) return
  listEl.value.scrollTop = listEl.value.scrollHeight
}

onMounted(() => {
  ensureSeed()
  scrollToBottom()
})

async function onSend() {
  const text = draft.value.trim()
  if (!text) return
  sending.value = true
  try {
    // 先在本地加入使用者訊息（之後會改為呼叫 API 串流）
    const mid = `u_${Date.now()}`
    const sid = selectedId.value
    messagesByConv.value[sid] = [...(messagesByConv.value[sid] ?? []), { id: mid, role: 'user', content: text }]
    draft.value = ''
    await nextTick()
    scrollToBottom()

    // TODO: M2: 之後接上 `/chat` 串流，邊收邊顯示 assistant 訊息
    // 目前先以假回覆示意
    const aid = `a_${Date.now()}`
    messagesByConv.value[sid] = [...(messagesByConv.value[sid] ?? []), { id: aid, role: 'assistant', content: '這是一則示意回覆。' }]
    await nextTick()
    scrollToBottom()
  } finally {
    sending.value = false
  }
}

function createConversation() {
  const id = `c_${Date.now()}`
  conversations.value.unshift({ id, title: '新的會話', createdAt: Date.now() })
  messagesByConv.value[id] = [
    { id: `seed_${Date.now()}`, role: 'assistant', content: '新的會話已建立！' },
  ]
  selectedId.value = id
}

function selectConversation(id: string) {
  selectedId.value = id
  nextTick().then(scrollToBottom)
}
</script>

