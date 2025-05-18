import { expect, test } from './test-options'

test.describe('Home Page', () => {
  test('should display the home page and a heading', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1').first()).toBeVisible()
  })
})
