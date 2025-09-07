<template>
  <Toaster />
  <div class="container">
    <nav>
      <router-link to="/">Home</router-link>
      <router-link to="/profile">Profile</router-link>
      <router-link to="/ui">UI 範例</router-link>
      <router-link to="/chat">Chat</router-link>
    </nav>
    <router-view />
  </div>

</template>

<script setup lang="ts">
import { Toaster } from '@/components/ui/sonner'
import 'vue-sonner/style.css'
import { Button } from '@/components/ui/button'


</script>
