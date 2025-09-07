import type { Page } from '@playwright/test'

export async function e2eLogin(page: Page, email = 'z887700101703027@gmail.com') {
  await page.addInitScript((token) => {
    localStorage.setItem('E2E_BEARER', token as string)
  }, `Bearer e2e:${email}`)
}

