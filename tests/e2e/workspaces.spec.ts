import { test, expect } from '@playwright/test'

test.describe('Workspaces', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('/workspaces')
    // In a real test, you would mock the authentication here
  })

  test('should show workspaces page', async ({ page }) => {
    await page.goto('/workspaces')
    await expect(page.getByText('Mis Workspaces')).toBeVisible()
    await expect(page.getByText('Agencia Marketing')).toBeVisible()
  })

  test('should navigate to workspace dashboard', async ({ page }) => {
    await page.goto('/workspaces')
    await page.getByText('Abrir').first().click()
    await expect(page).toHaveURL(/\/workspaces\/.*\/dashboard/)
  })
})
