<template>
  <Toaster />
  <div class="h-screen flex flex-col">
    <!-- Top Nav -->
    <header class="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
      <div class="container flex h-14 items-center justify-between">
        <div class="flex items-center gap-4">
          <router-link to="/" class="font-semibold">Try Chatbot</router-link>
          <nav class="hidden sm:flex items-center gap-3 text-sm text-muted-foreground">
            <router-link to="/chat" class="hover:text-foreground">Chat</router-link>
            <router-link to="/kb" class="hover:text-foreground">KB</router-link>
            <router-link to="/test" class="hover:text-foreground">Test</router-link>
          </nav>
        </div>
        <nav class="flex items-center gap-3 text-sm">
          <router-link v-if="!session.isAuthenticated" to="/profile" class="hover:underline">Profile</router-link>
          <router-link v-else to="/profile" class="flex items-center gap-2">
            <Avatar class="size-7">
              <AvatarImage v-if="session.user?.photo" :src="session.user?.photo" :alt="session.user?.displayName || 'User'" />
              <AvatarFallback>{{ initials }}</AvatarFallback>
            </Avatar>
          </router-link>
        </nav>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 min-h-0 py-6 px-4">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { Toaster } from '@/components/ui/sonner'
import 'vue-sonner/style.css'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useSessionStore } from '@/stores/session'
import { computed } from 'vue'

const session = useSessionStore()
const initials = computed(() => (
  (session.user?.displayName || session.user?.email || 'U')
    .split(' ')
    .map((s) => s?.[0] || '')
    .join('')
    .slice(0, 2)
    .toUpperCase()
))


</script>
