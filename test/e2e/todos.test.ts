import { expect, test } from './test-options'

test.describe('Todos Page', () => {
  test('should display the todos page and a heading', async ({ page }) => {
    await page.goto('/todos')
    const todosPageContainer = page.locator('div.container:has(h1:text(\'My Todos\'))')
    await expect(todosPageContainer).toBeVisible()
    await expect(todosPageContainer.locator('h1:text(\'My Todos\')')).toBeVisible()
  })
})
