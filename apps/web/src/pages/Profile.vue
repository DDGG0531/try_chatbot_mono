<template>
  <section>
    <h1>Profile</h1>
    <p v-if="loading">Loading...</p>
    <div v-else-if="user">
      <img v-if="user.photo" :src="user.photo" alt="avatar" width="72" height="72" style="border-radius:50%" />
      <p><strong>Name:</strong> {{ user.displayName }}</p>
      <p v-if="user.email"><strong>Email:</strong> {{ user.email }}</p>
    </div>
    <div v-else>
      <p>Please sign in to view your profile.</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref, onUnmounted } from 'vue';
import { fetchMe, type User } from '@/lib/api';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const loading = ref(true);
const user = ref<User | null>(null);

let unsubscribe: (() => void) | undefined;

onMounted(async () => {
  unsubscribe = onAuthStateChanged(auth, async () => {
    user.value = await fetchMe();
    loading.value = false;
  });
});

onUnmounted(() => {
  if (unsubscribe) unsubscribe();
});
</script>
