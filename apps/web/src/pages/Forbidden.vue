<template>
  <div class="flex h-full items-center justify-center">
    <Card class="max-w-lg w-full">
      <CardHeader>
        <CardTitle>無權限存取（403）</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <p class="text-muted-foreground">您沒有權限存取此頁面或資源。</p>
        <div class="flex gap-2">
          <RouterLink to="/">
            <Button>回到首頁</Button>
          </RouterLink>
          <RouterLink to="/chat">
            <Button variant="outline">前往聊天</Button>
          </RouterLink>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
</script>

