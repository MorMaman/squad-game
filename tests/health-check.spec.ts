import { test, expect } from '@playwright/test';

test.setTimeout(60000);

test.describe('Squad Game Health Check', () => {
  test('app loads without console errors', async ({ page }) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Capture all console messages
    page.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'error') {
        // Ignore React DevTools message
        if (!text.includes('React DevTools') && !text.includes('Download the React DevTools')) {
          errors.push(text);
          console.log(`[ERROR] ${text}`);
        }
      } else if (msg.type() === 'warning') {
        // Ignore some common non-critical warnings
        if (!text.includes('React DevTools') && !text.includes('componentWillMount') && !text.includes('componentWillReceiveProps')) {
          warnings.push(text);
          console.log(`[WARNING] ${text}`);
        }
      }
    });

    // Capture page errors (uncaught exceptions)
    page.on('pageerror', error => {
      errors.push(error.message);
      console.log(`[PAGE ERROR] ${error.message}`);
    });

    // Capture failed network requests
    page.on('response', response => {
      if (response.status() >= 400) {
        const msg = `HTTP ${response.status()}: ${response.url()}`;
        console.log(`[HTTP ERROR] ${msg}`);
        // Don't treat 401/403 as errors (auth related)
        if (response.status() >= 500) {
          errors.push(msg);
        }
      }
    });

    // Navigate to app
    console.log('Loading app...');
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 45000 });

    // Wait for app to fully load
    await page.waitForTimeout(5000);

    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/health-check-home.png', fullPage: true });

    // Check page loaded something
    const body = await page.locator('body').textContent();
    console.log('Page content length:', body?.length || 0);

    // Print summary
    console.log('\n=== HEALTH CHECK SUMMARY ===');
    console.log(`Errors: ${errors.length}`);
    console.log(`Warnings: ${warnings.length}`);

    if (errors.length > 0) {
      console.log('\nErrors found:');
      errors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
    }

    if (warnings.length > 0) {
      console.log('\nWarnings found:');
      warnings.forEach((w, i) => console.log(`  ${i + 1}. ${w}`));
    }

    // Assert no critical errors
    expect(errors.length, `Found ${errors.length} console errors: ${errors.join(', ')}`).toBe(0);
  });

  test('app renders main UI elements', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('React DevTools')) {
        errors.push(msg.text());
      }
    });

    page.on('pageerror', error => {
      errors.push(error.message);
    });

    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(5000);

    // Check if there's visible content
    const visibleText = await page.locator('body').textContent();
    expect(visibleText?.length).toBeGreaterThan(0);

    await page.screenshot({ path: 'tests/screenshots/health-check-ui.png', fullPage: true });

    // Check for no critical errors during render
    expect(errors.length, `Render errors: ${errors.join(', ')}`).toBe(0);
  });
});
