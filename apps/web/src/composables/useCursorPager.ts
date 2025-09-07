import { ref } from 'vue'

// Offset-based pager：以 offset/limit 請求，回傳 hasNextPage
export function useCursorPager<T>(fetcher: (params?: { limit?: number; offset?: number }) => Promise<{ items: T[]; hasNextPage?: boolean }>) {
  const items = ref<T[]>([])
  const loading = ref(false)
  const offset = ref(0)
  const hasNextPage = ref<boolean>(false)

  async function refresh(limit = 20) {
    loading.value = true
    try {
      const { items: data, hasNextPage: more } = await fetcher({ limit, offset: 0 })
      items.value = data
      offset.value = data.length
      hasNextPage.value = !!more
    } finally {
      loading.value = false
    }
  }

  async function loadMore(limit = 20) {
    if (!hasNextPage.value) return
    loading.value = true
    try {
      const { items: more, hasNextPage: moreComing } = await fetcher({ limit, offset: offset.value })
      items.value = [...items.value, ...more]
      offset.value += more.length
      hasNextPage.value = !!moreComing
    } finally {
      loading.value = false
    }
  }

  return { items, hasNextPage, loading, refresh, loadMore }
}
