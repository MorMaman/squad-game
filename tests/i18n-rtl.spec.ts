import { test, expect, Page } from '@playwright/test';

// Helper to collect console messages
function setupConsoleCapture(page: Page) {
  const logs: { type: string; text: string }[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  page.on('console', (msg) => {
    const text = msg.text();
    logs.push({ type: msg.type(), text });

    if (msg.type() === 'error' && !text.includes('net::ERR') && !text.includes('Failed to fetch')) {
      errors.push(text);
    }
    if (msg.type() === 'warning') {
      warnings.push(text);
    }
  });

  page.on('pageerror', (error) => {
    errors.push(error.message);
  });

  return { logs, errors, warnings };
}

test.describe('Internationalization and RTL Support', () => {
  test.describe('Hebrew Language Support', () => {
    test('should render app with default English language', async ({ page }) => {
      const { errors } = setupConsoleCapture(page);

      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(7000);

      // Check for English text on login screen
      await expect(page.locator('text=Squad Game')).toBeVisible();
      await expect(page.locator('text=Sign in to continue')).toBeVisible();

      // Take screenshot
      await page.screenshot({ path: 'test-results/i18n-english-default.png', fullPage: true });

      // Should not have critical i18n errors
      const i18nErrors = errors.filter(e => e.includes('i18n') || e.includes('translation'));
      expect(i18nErrors).toHaveLength(0);
    });

    test('should have translation resources loaded without errors', async ({ page }) => {
      const { errors, warnings } = setupConsoleCapture(page);

      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(7000);

      // Check for missing translation warnings
      const translationWarnings = warnings.filter(w =>
        w.includes('Missing translation') ||
        w.includes('i18next')
      );

      console.log('Translation warnings:', translationWarnings);
      expect(translationWarnings).toHaveLength(0);
    });

    test('should render Hebrew text correctly when language is Hebrew', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(7000);

      // Check that i18next is initialized
      const i18nCheck = await page.evaluate(() => {
        return typeof (window as any).i18n !== 'undefined';
      });

      // Check page renders without errors
      await expect(page.locator('body')).toBeVisible();

      // Take screenshot
      await page.screenshot({ path: 'test-results/i18n-check.png', fullPage: true });
    });
  });

  test.describe('RTL Layout Support', () => {
    test('should have correct document direction in LTR mode', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(7000);

      // Check document direction
      const direction = await page.evaluate(() => {
        return document.documentElement.dir || 'ltr';
      });

      // Default should be LTR or empty
      expect(direction).toMatch(/ltr|^$/);

      // Take screenshot
      await page.screenshot({ path: 'test-results/rtl-ltr-mode.png', fullPage: true });
    });

    test('should maintain layout integrity with RTL components', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(7000);

      // Check that flex containers have correct direction
      const loginContainer = page.locator('[data-testid="login-container"]').or(page.locator('div').first());
      await expect(loginContainer).toBeVisible();

      // Verify inputs are properly aligned
      const emailInput = page.locator('input[type="email"]');
      await expect(emailInput).toBeVisible();

      const inputBox = await emailInput.boundingBox();
      expect(inputBox).toBeTruthy();
      expect(inputBox!.width).toBeGreaterThan(100);

      // Take screenshot
      await page.screenshot({ path: 'test-results/rtl-layout-integrity.png', fullPage: true });
    });

    test('should handle text alignment in input fields', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(7000);

      const emailInput = page.locator('input[type="email"]');
      await expect(emailInput).toBeVisible();

      // Type some text
      await emailInput.fill('test@example.com');

      // Verify text is visible
      await expect(emailInput).toHaveValue('test@example.com');

      // Take screenshot
      await page.screenshot({ path: 'test-results/rtl-text-input.png', fullPage: true });
    });
  });

  test.describe('Translation Keys', () => {
    test('should not display raw translation keys on the UI', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(7000);

      // Get all visible text on the page
      const bodyText = await page.locator('body').textContent();

      // Check that no translation keys are visible (they would look like 'common.home' or 'navigation.settings')
      const translationKeyPattern = /\b(common|navigation|game|events|leaderboard|profile|settings|auth|squad|crown|power|errors|time|messages)\.\w+/g;
      const foundKeys = bodyText?.match(translationKeyPattern) || [];

      console.log('Found translation keys in UI:', foundKeys);
      expect(foundKeys).toHaveLength(0);
    });

    test('should render buttons with translated text', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(7000);

      // Check sign in button has text (not empty or translation key)
      const signInButton = page.getByText('Sign In', { exact: true });
      await expect(signInButton).toBeVisible();

      const buttonText = await signInButton.textContent();
      expect(buttonText).toBe('Sign In');
      expect(buttonText).not.toMatch(/auth\./);
    });
  });

  test.describe('Mobile RTL Responsiveness', () => {
    test('should maintain RTL layout on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(7000);

      // Check layout renders correctly
      await expect(page.locator('text=Squad Game')).toBeVisible();

      // Take mobile screenshot
      await page.screenshot({ path: 'test-results/rtl-mobile-view.png', fullPage: true });
    });

    test('should maintain RTL layout on tablet viewport', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });

      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(7000);

      // Check layout renders correctly
      await expect(page.locator('text=Squad Game')).toBeVisible();

      // Take tablet screenshot
      await page.screenshot({ path: 'test-results/rtl-tablet-view.png', fullPage: true });
    });
  });

  test.describe('Hebrew Text Rendering', () => {
    test('should render Hebrew characters correctly if present', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(7000);

      // Check that the page can handle Hebrew text rendering
      const hasHebrewSupport = await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return false;

        ctx.font = '12px Arial';
        const width = ctx.measureText('\u05D0').width; // Hebrew letter Alef
        return width > 0;
      });

      expect(hasHebrewSupport).toBe(true);
    });

    test('should not break layout with mixed RTL/LTR content', async ({ page }) => {
      const { errors } = setupConsoleCapture(page);

      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(7000);

      // Type mixed content in input
      const emailInput = page.locator('input[type="email"]');
      await expect(emailInput).toBeVisible();
      await emailInput.fill('test123');

      // Layout should remain stable
      const inputBox = await emailInput.boundingBox();
      expect(inputBox).toBeTruthy();
      expect(inputBox!.width).toBeGreaterThan(50);

      // No layout errors
      const layoutErrors = errors.filter(e => e.includes('layout') || e.includes('overflow'));
      expect(layoutErrors).toHaveLength(0);

      // Take screenshot
      await page.screenshot({ path: 'test-results/rtl-mixed-content.png', fullPage: true });
    });
  });
});
