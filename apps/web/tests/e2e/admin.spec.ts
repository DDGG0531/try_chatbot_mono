import { test, expect } from '@playwright/test'
import { e2eLogin } from './helpers'

test.describe('Admin pages', () => {
  test.beforeEach(async ({ page }) => {
    await e2eLogin(page, 'z887700101703027@gmail.com')
  })

  test('visit admin users and audit logs', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Admin' }).click()
    await expect(page).toHaveURL(/.*\/admin\/users/)

    await page.getByRole('link', { name: 'Audit' }).click()
    await expect(page).toHaveURL(/.*\/admin\/audit-logs/)
    await expect(page.getByText('稽核紀錄').first()).toBeVisible()
  })
})

