import { expect, test } from './test-options'

test.describe('Todos Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/todos')
    await expect(page.locator('h1:text("My Todos")')).toBeVisible()
  })

  test('should display the todos page and a heading', async ({ page }) => {
    const todosPageContainer = page.locator('div.container:has(h1:text("My Todos"))')
    await expect(todosPageContainer).toBeVisible()
    await expect(todosPageContainer.locator('h1:text("My Todos")')).toBeVisible()
  })

  test('should allow a user to add a new todo', async ({ page }) => {
    const newTodoText = `My new todo ${Date.now()}`
    const todoInput = page.locator('input[type="text"][placeholder="What needs to be done?"]')
    const addButton = page.locator('button[type="submit"]', { hasText: 'Add Todo' })

    await expect(todoInput).toBeVisible()
    await todoInput.fill(newTodoText)
    await expect(addButton).toBeEnabled()
    await addButton.click()

    const newTodoItem = page.locator('ul > li', { hasText: newTodoText })
    await expect(newTodoItem).toBeVisible()
    await expect(newTodoItem.locator('label')).not.toHaveClass(/line-through/)
    await expect(newTodoItem.locator('input[type="checkbox"]')).not.toBeChecked()
  })

  test('should allow a user to delete a todo', async ({ page }) => {
    const todoTextForDelete = `Todo to delete ${Date.now()}`
    const todoInput = page.locator('input[type="text"][placeholder="What needs to be done?"]')
    const addButton = page.locator('button[type="submit"]', { hasText: 'Add Todo' })

    await todoInput.fill(todoTextForDelete)
    await addButton.click()
    const addedTodoItem = page.locator('ul > li', { hasText: todoTextForDelete })
    await expect(addedTodoItem).toBeVisible()

    const deleteButton = addedTodoItem.locator('button[title="Delete todo"]')
    await expect(deleteButton).toBeVisible()
    await deleteButton.click()

    await expect(addedTodoItem).not.toBeVisible()
  })

  // Future tests to consider:
  // - Toggling a todo's completed state and verifying visual change + checkbox state
  // - Verifying that the "Add Todo" button is disabled when the input is empty
  // - Testing behavior when API calls fail (if mockable or if you have error state displays)
  // - Testing a sequence of operations: add, complete, delete
})
