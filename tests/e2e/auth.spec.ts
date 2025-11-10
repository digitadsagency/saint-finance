import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should redirect to sign-in when not authenticated', async ({ page }) => {
    await page.goto('/workspaces')
    await expect(page).toHaveURL('/sign-in')
  })

  test('should show sign-in page', async ({ page }) => {
    await page.goto('/sign-in')
    await expect(page.getByText('Bienvenido a MiniMonday')).toBeVisible()
    await expect(page.getByText('Continuar con Google')).toBeVisible()
  })

  test('should show sign-up page', async ({ page }) => {
    await page.goto('/sign-up')
    await expect(page.getByText('Únete a MiniMonday')).toBeVisible()
    await expect(page.getByText('Registrarse con Google')).toBeVisible()
  })
})
