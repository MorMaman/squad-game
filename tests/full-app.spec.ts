import { test, expect } from '@playwright/test';

test.setTimeout(90000);

test.describe('Squad Game Full App Test', () => {
  test('app loads and displays content without errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignore React DevTools and non-critical warnings
        if (!text.includes('React DevTools') &&
            !text.includes('Download the React DevTools') &&
            !text.includes('deprecated')) {
          errors.push(text);
          console.log(`[ERROR] ${text}`);
        }
      }
    });

    page.on('pageerror', error => {
      errors.push(error.message);
      console.log(`[PAGE ERROR] ${error.message}`);
    });

    // Load the app
    console.log('Loading app...');
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(8000);

    // Screenshot
    await page.screenshot({ path: 'tests/screenshots/full-app-home.png', fullPage: true });

    // Check visible content
    const bodyText = await page.locator('body').textContent();
    console.log('Page content length:', bodyText?.length || 0);
    console.log('Content preview:', bodyText?.substring(0, 200));

    // Check no errors occurred
    if (errors.length > 0) {
      console.log('Errors found:', errors);
    }

    expect(errors.length, `Found errors: ${errors.join('; ')}`).toBe(0);
    expect(bodyText?.length).toBeGreaterThan(10);

    console.log('App loaded successfully!');
  });
});
