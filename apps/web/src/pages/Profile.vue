<template>
  <section class="space-y-6 py-6">
    <h1 class="text-2xl font-bold">個人檔案</h1>

    <div class="rounded-xl border p-4">
      <p v-if="status === 'loading'" class="text-muted-foreground">載入中...</p>

      <div v-else-if="user" class="flex items-center gap-4">
        <div class="h-16 w-16 overflow-hidden rounded-full border">
          <img v-if="user.photo" :src="user.photo" alt="avatar" class="h-16 w-16 object-cover" />
          <div v-else class="flex h-16 w-16 items-center justify-center bg-muted text-muted-foreground">?
          </div>
        </div>
        <div class="space-y-1">
          <p class="font-medium">{{ user.displayName }}</p>
          <p v-if="user.email" class="text-sm text-muted-foreground">{{ user.email }}</p>
        </div>
      </div>

      <div v-else class="text-muted-foreground">請先登入以檢視個人資料。</div>
    </div>
  </section>
  </template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useSessionStore } from '@/stores/session'

// 使用全域會話狀態（由 useAuth 初始化並同步 /me）
const session = useSessionStore()
const { user, status } = storeToRefs(session)
</script>
