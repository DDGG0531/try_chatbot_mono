<script setup lang="ts">
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'

type Column = { key: string; label: string; class?: string; align?: 'left' | 'center' | 'right' }

const props = withDefaults(defineProps<{
  columns: Column[]
  items: any[]
  loading?: boolean
  emptyText?: string
  rowKey?: string | ((row: any, index: number) => string | number)
  dense?: boolean
  striped?: boolean
  stickyHeader?: boolean
}>(), {
  loading: false,
  emptyText: '尚無資料',
  dense: false,
  striped: true,
  stickyHeader: true,
})

const emit = defineEmits<{
  (e: 'row-click', row: any): void
}>()

function getKey(row: any, index: number) {
  if (typeof props.rowKey === 'function') return props.rowKey(row, index)
  if (typeof props.rowKey === 'string') return row?.[props.rowKey]
  return row?.id ?? index
}

function headAlign(c: Column) {
  if (c.align === 'right') return 'text-right'
  if (c.align === 'center') return 'text-center'
  return 'text-left'
}

function cellAlign(c: Column) {
  if (c.align === 'right') return 'text-right'
  if (c.align === 'center') return 'text-center'
  return ''
}
</script>

<template>
  <Table class="min-w-full">
    <TableHeader>
      <TableRow>
        <TableHead
          v-for="c in columns"
          :key="c.key"
          :class="[
            c.class,
            headAlign(c),
            stickyHeader ? 'sticky top-0 bg-background z-10' : '',
          ]"
        >
          <div class="flex items-center gap-1" :class="{ 'justify-end': c.align==='right', 'justify-center': c.align==='center' }">
            <span>{{ c.label }}</span>
          </div>
        </TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <!-- Loading skeleton rows -->
      <template v-if="loading">
        <TableRow v-for="i in 3" :key="`sk-${i}`">
          <TableCell v-for="c in columns" :key="c.key" :class="[c.class, cellAlign(c)]">
            <Skeleton :class="['h-4', dense ? 'w-24' : 'w-40']" />
          </TableCell>
        </TableRow>
      </template>

      <!-- Data rows -->
      <template v-else-if="items.length">
        <TableRow
          v-for="(row, ri) in items"
          :key="getKey(row, ri)"
          :class="[striped ? 'odd:bg-muted/20' : '', dense ? '' : '']"
          @click="emit('row-click', row)"
        >
          <TableCell v-for="c in columns" :key="c.key" :class="[c.class, cellAlign(c), dense ? 'py-2' : 'py-3']">
            <slot :name="`cell-${c.key}`" :row="row" :value="row[c.key]">
              {{ row[c.key] }}
            </slot>
          </TableCell>
        </TableRow>
      </template>

      <!-- Empty state -->
      <template v-else>
        <TableRow>
          <TableCell :colspan="columns.length" class="text-center text-sm text-muted-foreground py-8">
            <slot name="empty">{{ emptyText }}</slot>
          </TableCell>
        </TableRow>
      </template>
    </TableBody>
  </Table>
</template>
