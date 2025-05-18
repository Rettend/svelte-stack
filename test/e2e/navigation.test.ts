import { expect, test } from './test-options'

test.describe('Navigation and Authentication UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should have Home and Todos navigation links', async ({ page }) => {
    await expect(page.locator('div.flex.items-center.gap-3 >> a', { hasText: 'Home' })).toBeVisible()
    await expect(page.locator('div.flex.items-center.gap-3 >> a', { hasText: 'Todos' })).toBeVisible()
  })

  test('should navigate to Todos page when Todos link is clicked', async ({ page }) => {
    await page.locator('div.flex.items-center.gap-3 >> a', { hasText: 'Todos' }).click()
    await expect(page).toHaveURL('/todos')
    await expect(page.locator('h1', { hasText: 'My Todos' })).toBeVisible()
  })

  test('should navigate back to Home page from Todos page', async ({ page }) => {
    await page.goto('/todos')
    await page.locator('div.flex.items-center.gap-3 >> a', { hasText: 'Home' }).click()
    await expect(page).toHaveURL('/')
    await expect(page.locator('p', { hasText: 'Count:' })).toBeVisible()
  })

  test('should display login buttons when not authenticated', async ({ page }) => {
    await expect(page.locator('button', { hasText: 'Log in with GitHub' })).toBeVisible()
    await expect(page.locator('button', { hasText: 'Log in with Google' })).toBeVisible()
  })
})
