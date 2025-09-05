<template>
  <div class="container">
    <nav>
      <Button>Click me</Button>
      <router-link to="/">Home</router-link>
      <router-link to="/profile">Profile</router-link>
    </nav>
    <router-view />
  </div>

</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'


</script>
