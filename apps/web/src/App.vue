<template>
  <div class="container">
    <nav>
      <Button>123123 </Button>
      <router-link to="/">Home</router-link>
      <router-link to="/profile">Profile</router-link>
    </nav>
    <router-view />
  </div>
  
</template>

<script setup lang="ts">
</script>

<style>
  body { font-family: -apple-system, system-ui, sans-serif; }
  .container { max-width: 720px; margin: 2rem auto; padding: 0 1rem; }
  nav { display: flex; gap: 1rem; margin-bottom: 1rem; }
  button { padding: 0.5rem 0.75rem; }
</style>

