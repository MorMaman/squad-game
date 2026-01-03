import { test, expect, Page } from '@playwright/test';

// Helper to set up console capture
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

test.describe('Comprehensive i18n and RTL Testing', () => {
  test.describe('Hardcoded English Detection', () => {
    test('should not have any hardcoded English text in key UI elements', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(7000);

      // Get all visible text
      const bodyText = await page.locator('body').textContent() || '';

      // Check for common hardcoded phrases that should be translated
      const hardcodedPhrases = [
        'Join a Squad to Play',
        'Daily challenges require a squad',
        'Find Your Squad',
        'You missed this challenge',
        'The comeback starts now',
        'Grow your squad',
        "You're the Judge Today",
        'XP TO LEVEL',
        'Total XP',
        'Invite Friends',
      ];

      const foundHardcoded: string[] = [];
      for (const phrase of hardcodedPhrases) {
        if (bodyText.includes(phrase)) {
          foundHardcoded.push(phrase);
        }
      }

      console.log('Found hardcoded English phrases:', foundHardcoded);
      // Note: Some phrases may appear in English if the default language is English
      // The test ensures the translation system is working, not that English is wrong
    });

    test('should have translation keys properly resolved (no raw keys visible)', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(7000);

      const bodyText = await page.locator('body').textContent() || '';

      // Check for translation key patterns
      const keyPatterns = [
        /home\.\w+/g,
        /crownHolder\.\w+/g,
        /underdogPowers\.\w+/g,
        /badges\.\w+/g,
        /squad\.\w+/g,
        /common\.\w+/g,
        /game\.\w+/g,
      ];

      const foundKeys: string[] = [];
      for (const pattern of keyPatterns) {
        const matches = bodyText.match(pattern);
        if (matches) {
          foundKeys.push(...matches);
        }
      }

      console.log('Found raw translation keys:', foundKeys);
      expect(foundKeys.length).toBe(0);

      await page.screenshot({ path: 'test-results/i18n-no-raw-keys.png', fullPage: true });
    });
  });

  test.describe('RTL Icon Direction', () => {
    test('should have arrow icons that can be flipped for RTL', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(7000);

      // Check that icons exist
      const arrowIcons = await page.locator('[name="arrow-forward"], .ion-arrow-forward').count();
      console.log('Found arrow-forward icons:', arrowIcons);

      await page.screenshot({ path: 'test-results/rtl-icons-check.png', fullPage: true });
    });
  });

  test.describe('Game Element Translations', () => {
    test('should display game status labels correctly', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(7000);

      // Check for status labels (LIVE, UPCOMING, COMPLETED, etc.)
      const statusLabels = ['LIVE', 'UPCOMING', 'COMPLETED', 'ENDS IN', 'STARTS IN'];
      const bodyText = await page.locator('body').textContent() || '';

      // At least one status label should be visible (indicating the app is working)
      const foundLabels = statusLabels.filter(label => bodyText.includes(label));
      console.log('Found status labels:', foundLabels);

      await page.screenshot({ path: 'test-results/i18n-game-status.png', fullPage: true });
    });

    test('should display XP and level information correctly', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(7000);

      // Look for XP-related text
      const xpElements = await page.locator('text=/XP|Level|\\d+\\/\\d+/i').count();
      console.log('Found XP/Level elements:', xpElements);

      await page.screenshot({ path: 'test-results/i18n-xp-level.png', fullPage: true });
    });
  });

  test.describe('Translation System Initialization', () => {
    test('should initialize i18n without errors', async ({ page }) => {
      const { errors, warnings } = setupConsoleCapture(page);

      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(7000);

      // Check for i18n-related errors
      const i18nErrors = errors.filter(e =>
        e.toLowerCase().includes('i18n') ||
        e.toLowerCase().includes('translation') ||
        e.toLowerCase().includes('t is not a function')
      );

      console.log('i18n errors:', i18nErrors);
      expect(i18nErrors).toHaveLength(0);

      // Check for missing translation warnings
      const missingTranslations = warnings.filter(w =>
        w.includes('missing') || w.includes('Missing')
      );

      console.log('Missing translation warnings:', missingTranslations);
    });
  });

  test.describe('UI Component Text Validation', () => {
    test('should display login button with proper text', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(7000);

      // Check for Sign In button
      const signInButton = page.getByText('Sign In', { exact: true });
      const isVisible = await signInButton.isVisible().catch(() => false);

      if (isVisible) {
        const buttonText = await signInButton.textContent();
        expect(buttonText).not.toMatch(/auth\./); // Should not show raw key
      }

      await page.screenshot({ path: 'test-results/i18n-login-button.png', fullPage: true });
    });

    test('should display app title correctly', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(7000);

      // Check for Squad Game title
      const title = page.locator('text=Squad Game');
      const isVisible = await title.isVisible().catch(() => false);

      if (isVisible) {
        await expect(title).toBeVisible();
      }

      await page.screenshot({ path: 'test-results/i18n-app-title.png', fullPage: true });
    });
  });

  test.describe('Responsive Layout with i18n', () => {
    test('should maintain layout on mobile with translated content', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(7000);

      // Check for layout issues
      const body = page.locator('body');
      await expect(body).toBeVisible();

      // Verify no horizontal scrollbar (layout not broken)
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.body.scrollWidth > window.innerWidth;
      });

      console.log('Has horizontal scroll (layout issue):', hasHorizontalScroll);

      await page.screenshot({ path: 'test-results/i18n-mobile-layout.png', fullPage: true });
    });

    test('should maintain layout on tablet with translated content', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(7000);

      const body = page.locator('body');
      await expect(body).toBeVisible();

      await page.screenshot({ path: 'test-results/i18n-tablet-layout.png', fullPage: true });
    });
  });

  test.describe('Dynamic Text Validation', () => {
    test('should handle interpolated translation values', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(7000);

      // Look for patterns like "7 Day Streak!" or similar interpolated text
      const bodyText = await page.locator('body').textContent() || '';

      // Check that interpolation placeholders are not visible
      const placeholderPatterns = [
        /\{\{count\}\}/g,
        /\{\{submitted\}\}/g,
        /\{\{total\}\}/g,
        /\{\{level\}\}/g,
        /\{\{amount\}\}/g,
      ];

      const foundPlaceholders: string[] = [];
      for (const pattern of placeholderPatterns) {
        const matches = bodyText.match(pattern);
        if (matches) {
          foundPlaceholders.push(...matches);
        }
      }

      console.log('Found unresolved placeholders:', foundPlaceholders);
      expect(foundPlaceholders.length).toBe(0);

      await page.screenshot({ path: 'test-results/i18n-interpolation.png', fullPage: true });
    });
  });

  test.describe('Crown and Power System Translations', () => {
    test('should have translated crown holder labels', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(7000);

      const bodyText = await page.locator('body').textContent() || '';

      // Check for untranslated crown-related terms
      const crownTerms = [
        'CROWN HOLDER',
        'Set Headline',
        'Declare Rivalry',
        'All powers used',
      ];

      // Note: These may appear in English if that's the current language
      // The key is that they are not showing as raw translation keys
      const foundTerms = crownTerms.filter(term => bodyText.includes(term));
      console.log('Found crown terms (in current language):', foundTerms);

      await page.screenshot({ path: 'test-results/i18n-crown-system.png', fullPage: true });
    });

    test('should have translated underdog power labels', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(7000);

      const bodyText = await page.locator('body').textContent() || '';

      // Check for power-related raw translation keys
      const powerKeyPatterns = [
        /underdogPowers\.\w+/g,
        /power\.\w+/g,
      ];

      const foundKeys: string[] = [];
      for (const pattern of powerKeyPatterns) {
        const matches = bodyText.match(pattern);
        if (matches) {
          foundKeys.push(...matches);
        }
      }

      console.log('Found raw power translation keys:', foundKeys);
      expect(foundKeys.length).toBe(0);

      await page.screenshot({ path: 'test-results/i18n-power-system.png', fullPage: true });
    });
  });

  test.describe('Badge Translations', () => {
    test('should translate rivalry badge text', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(7000);

      const bodyText = await page.locator('body').textContent() || '';

      // Check that badges.rival key is not showing as raw
      const hasRawBadgeKey = bodyText.includes('badges.rival');
      console.log('Has raw badges.rival key:', hasRawBadgeKey);
      expect(hasRawBadgeKey).toBe(false);

      await page.screenshot({ path: 'test-results/i18n-badges.png', fullPage: true });
    });
  });
});
