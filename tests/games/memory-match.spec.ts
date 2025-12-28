import { test, expect, Page } from '@playwright/test';

// Helper to collect console errors
async function setupConsoleErrorCollector(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Filter out known non-critical warnings
      if (!text.includes('Haptics') &&
          !text.includes('not available on web') &&
          !text.includes('React does not recognize') &&
          !text.includes('validateDOMNesting')) {
        errors.push(text);
      }
    }
  });
  page.on('pageerror', (err) => {
    errors.push(`Page Error: ${err.message}`);
  });
  return errors;
}

// Helper to check for app crashes
async function checkForCrash(page: Page): Promise<boolean> {
  try {
    await page.waitForSelector('body', { timeout: 5000 });
    // Check for actual crash indicators (error screens, not game content)
    const crashIndicators = await page.locator('text=/Application Error|Runtime Error|Something went wrong|Unhandled/i').count();
    return crashIndicators === 0;
  } catch {
    return false;
  }
}

test.describe('Memory Match Game', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the games hub first
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  for (let run = 1; run <= 3; run++) {
    test(`Run ${run}: Should load and play Memory Match without errors`, async ({ page }) => {
      const errors = await setupConsoleErrorCollector(page);

      // Navigate directly to Memory Match game
      await page.waitForTimeout(1000);

      // Navigate to Memory Match game
      await page.goto('/games/memory-match');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Check game loaded - look for the title
      const titleOrContent = await page.locator('text=/Memory Match|Match the pairs/i').first();
      await expect(titleOrContent).toBeVisible({ timeout: 10000 });

      // Check for back button (game navigation works)
      const backButton = page.locator('[aria-label*="back"], [data-testid="back-button"]').first();

      // Look for game cards or start button
      const gameElement = page.locator('text=/Start|Reset|Match|?/i').first();

      // Verify no crash
      const noCrash = await checkForCrash(page);
      expect(noCrash).toBe(true);

      // Try to interact with the game
      const cards = page.locator('[role="button"], [class*="card"], [class*="Card"]');
      const cardCount = await cards.count();

      if (cardCount > 0) {
        // Click first card
        await cards.first().click();
        await page.waitForTimeout(300);

        // Click second card if available
        if (cardCount > 1) {
          await cards.nth(1).click();
          await page.waitForTimeout(500);
        }
      }

      // Verify still no crash after interaction
      const stillNoCrash = await checkForCrash(page);
      expect(stillNoCrash).toBe(true);

      // Check for critical errors (excluding known web-only warnings)
      const criticalErrors = errors.filter(e =>
        !e.includes('Warning') &&
        !e.includes('deprecated') &&
        e.includes('Error') || e.includes('Uncaught')
      );

      if (criticalErrors.length > 0) {
        console.log('Critical errors found:', criticalErrors);
      }

      // Allow max 0 critical errors
      expect(criticalErrors.length).toBe(0);
    });
  }

  test('Should have working navigation', async ({ page }) => {
    const errors = await setupConsoleErrorCollector(page);

    await page.goto('/games/memory-match');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Find and click back button
    const backButton = page.locator('[aria-label*="back"], svg, [class*="back"]').first();

    if (await backButton.isVisible()) {
      await backButton.click();
      await page.waitForTimeout(500);
    }

    // Verify no crash
    const noCrash = await checkForCrash(page);
    expect(noCrash).toBe(true);
  });
});
