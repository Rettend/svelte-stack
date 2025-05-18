import { expect, test } from './test-options'

test.describe('Todos Page', () => {
  test('should display the todos page and a heading', async ({ page }) => {
    await page.goto('/todos')
    await expect(page.locator('h1', { hasText: 'My Todos' }).first()).toBeVisible()
  })
})
