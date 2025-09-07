<template>
  <section class="space-y-8 py-6">
    <h1 class="text-2xl font-bold">UI 元件示例</h1>

    <div class="space-y-2">
      <h2 class="text-lg font-semibold">Button / Input</h2>
      <div class="flex items-center gap-2">
        <Input v-model="name" placeholder="輸入名稱" class="max-w-xs" />
        <Button variant="secondary">次要</Button>
        <Button variant="outline">外框</Button>
        <Button variant="ghost">幽靈</Button>
        <Button variant="destructive">危險</Button>
      </div>
    </div>

    <div class="space-y-2">
      <h2 class="text-lg font-semibold">Dialog</h2>
      <Dialog>
        <DialogTrigger as-child>
          <Button variant="outline">
            Edit Profile
          </Button>
        </DialogTrigger>
        <DialogContent class="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>
              Make changes to your profile here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div class="grid gap-4 py-4">
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="name" class="text-right">
                Name
              </Label>
              <Input id="name" value="Pedro Duarte" class="col-span-3" />
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="username" class="text-right">
                Username
              </Label>
              <Input id="username" value="@peduarte" class="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>

    <div class="space-y-2">
      <h2 class="text-lg font-semibold">DropdownMenu</h2>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button>選單</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>選項</DropdownMenuLabel>
          <DropdownMenuItem>A</DropdownMenuItem>
          <DropdownMenuItem>B</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>登出</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    <div class="space-y-2">
      <h2 class="text-lg font-semibold">Tabs</h2>
      <Tabs v-model="tab" default-value="account">
        <TabsList>
          <TabsTrigger value="account">帳號</TabsTrigger>
          <TabsTrigger value="password">密碼</TabsTrigger>
        </TabsList>
        <TabsContent value="account">
          <div class="rounded-md border p-4">帳號內容：{{ name || '（未輸入）' }}</div>
        </TabsContent>
        <TabsContent value="password">
          <div class="rounded-md border p-4">重設密碼功能示意</div>
        </TabsContent>
      </Tabs>
    </div>

    <div class="space-y-2">
      <h2 class="text-lg font-semibold">Toast</h2>
      <div class="flex gap-2">
        <Button @click="tryToast">成功</Button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { toast } from "vue-sonner"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

const name = ref('')
const tab = ref('account')


function tryToast() {
  toast('Event has been created', {
    description: 'Sunday, December 03, 2023 at 9:00 AM',
    action: {
      label: 'Undo',
      onClick: () => console.log('Undo'),
    },
  })
}


</script>
