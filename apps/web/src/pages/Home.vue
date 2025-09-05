<template>
  <section>
    <h1>Welcome</h1>
    <p v-if="loading">Loading...</p>
    <template v-else>
      <div v-if="user">
        <p>Signed in as {{ user.displayName }}</p>
        <button @click="onLogout">Logout</button>
      </div>
      <div v-else>
        <button @click="onLogin">Sign in with Google</button>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref, onUnmounted } from 'vue';
import { fetchMe, loginWithGoogle, logout, type User } from '@/lib/api';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

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

function onLogin() {
  loginWithGoogle();
}

async function onLogout() {
  await logout();
  user.value = null;
}
</script>
