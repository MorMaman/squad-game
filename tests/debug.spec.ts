import { test, expect } from '@playwright/test';

test('debug - capture page state', async ({ page }) => {
  // Enable console logging
  page.on('console', msg => console.log('Browser console:', msg.text()));
  page.on('pageerror', error => console.log('Browser error:', error.message));

  // Navigate to the app
  await page.goto('/');

  // Wait for load
  await page.waitForLoadState('networkidle');

  // Wait for potential auth timeout
  await page.waitForTimeout(7000);

  // Take a screenshot
  await page.screenshot({ path: 'test-results/debug-screenshot.png', fullPage: true });

  // Get page content
  const html = await page.content();
  console.log('Page HTML length:', html.length);
  console.log('Page HTML preview:', html.substring(0, 2000));

  // Check what elements exist
  const rootDiv = await page.locator('#root').innerHTML();
  console.log('Root div content:', rootDiv.substring(0, 1000));

  // Always pass for debugging
  expect(true).toBe(true);
});
