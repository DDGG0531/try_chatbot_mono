<template>
  <section class="space-y-6 py-6">
    <h1 class="text-2xl font-bold">歡迎使用</h1>

    <div class="rounded-xl border p-4">
      <p v-if="status === 'loading'" class="text-muted-foreground">載入中...</p>

      <template v-else>
        <div v-if="user" class="space-y-3">
          <p>已登入：<span class="font-medium">{{ user.displayName }}</span></p>
          <div class="flex gap-2">
            <Button variant="outline" @click="goProfile">查看個人檔案</Button>
            <Button variant="destructive" @click="onLogout">登出</Button>
          </div>
        </div>
        <div v-else class="space-y-3">
          <p class="text-muted-foreground">尚未登入，請先登入以使用完整功能。</p>
          <Button @click="onLogin">使用 Google 登入</Button>
        </div>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useSessionStore } from '@/stores/session'
import { loginWithGoogle, logout } from '@/api/auth'
import { Button } from '@/components/ui/button'

const router = useRouter()
const session = useSessionStore()
const { user, status } = storeToRefs(session)

function onLogin() {
  loginWithGoogle()
}

async function onLogout() {
  await logout()
  session.reset()
}

function goProfile() {
  router.push({ name: 'profile' })
}
</script>
