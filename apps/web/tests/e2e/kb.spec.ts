import { test, expect } from '@playwright/test'
import { e2eLogin } from './helpers'

test.describe('Knowledge Base management', () => {
  test.beforeEach(async ({ page }) => {
    await e2eLogin(page)
  })

  test('create and delete KB', async ({ page }) => {
    await page.goto('/kb')

    await page.getByRole('button', { name: '新增' }).click()
    await page.getByLabel('名稱').fill('E2E 測試 KB')
    await page.getByLabel('描述').fill('由 e2e 建立')
    await page.getByRole('button', { name: '建立' }).click()

    await expect(page.getByText('E2E 測試 KB')).toBeVisible()

    const row = page.getByRole('row').filter({ hasText: 'E2E 測試 KB' })
    await row.getByRole('button', { name: '刪除' }).click()
    await page.getByRole('button', { name: '刪除' }).click()

    await expect(page.getByText('E2E 測試 KB')).toHaveCount(0)
  })
})

