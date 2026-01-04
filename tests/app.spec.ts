import { test, expect } from '@playwright/test';

test.describe('Squad Game App', () => {
  test('should load the app and show login screen', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Wait for the app to load (may show loading spinner first)
    await page.waitForLoadState('networkidle');

    // Wait for React to render - either loading or login screen
    await page.waitForTimeout(6000); // Wait for auth timeout

    // Check that the app rendered something
    const body = await page.locator('body');
    await expect(body).toBeVisible();

    // Check for either loading spinner or login content
    const hasContent = await page.locator('text=Squad Game').or(
      page.locator('[data-testid="loading"]')
    ).or(
      page.locator('text=Email')
    ).count();

    expect(hasContent).toBeGreaterThan(0);
  });

  test('should display login form', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for auth to initialize
    await page.waitForTimeout(6000);

    // Should see the Squad Game title
    await expect(page.locator('text=Squad Game').first()).toBeVisible({ timeout: 10000 });

    // Should see email input - React Native Web renders TextInput as regular input (type="text")
    // Find the input associated with the "Email" label by getting the input that follows it
    const emailLabel = page.locator('text=Email').first();
    await expect(emailLabel).toBeVisible({ timeout: 10000 });

    // Find the first input on the page (email input comes before password)
    const emailInput = page.locator('input').first();
    await expect(emailInput).toBeVisible({ timeout: 10000 });
  });

  test('should have proper page title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Squad Game/);
  });

  test('should allow focusing and typing in email input', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(6000);

    // Find email input - React Native Web renders TextInput as regular input (type="text")
    // The email input is the first input on the page
    const emailInput = page.locator('input').first();
    await expect(emailInput).toBeVisible({ timeout: 10000 });

    // Click to focus
    await emailInput.click();

    // Type in the input
    await emailInput.fill('test@example.com');

    // Verify the value was entered
    await expect(emailInput).toHaveValue('test@example.com');

    // Check no critical errors occurred
    const criticalErrors = errors.filter(e => !e.includes('registerWebModule'));
    expect(criticalErrors).toHaveLength(0);
  });
});
