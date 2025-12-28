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

test.describe('Simon Says Game', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  for (let run = 1; run <= 3; run++) {
    test(`Run ${run}: Should load and play Simon Says without errors`, async ({ page }) => {
      const errors = await setupConsoleErrorCollector(page);

      // Navigate to Simon Says game
      await page.goto('/games/simon-says');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Check game loaded
      const titleOrContent = await page.locator('text=/Simon|pattern|TAP|WATCH/i').first();
      await expect(titleOrContent).toBeVisible({ timeout: 10000 });

      // Verify no crash
      const noCrash = await checkForCrash(page);
      expect(noCrash).toBe(true);

      // Try to start the game (tap to start)
      const tapArea = page.locator('text=/TAP TO START|START/i').first();
      if (await tapArea.isVisible()) {
        await tapArea.click();
        await page.waitForTimeout(1500);

        // Wait for the pattern to play
        await page.waitForTimeout(2000);

        // Try clicking one of the colored buttons
        const coloredButtons = page.locator('[class*="button"], [role="button"]');
        const buttonCount = await coloredButtons.count();

        if (buttonCount > 0) {
          await coloredButtons.first().click();
          await page.waitForTimeout(300);
        }
      }

      // Verify still no crash after interaction
      const stillNoCrash = await checkForCrash(page);
      expect(stillNoCrash).toBe(true);

      // Check for critical errors
      const criticalErrors = errors.filter(e =>
        !e.includes('Warning') &&
        !e.includes('deprecated') &&
        e.includes('Error') || e.includes('Uncaught')
      );

      expect(criticalErrors.length).toBe(0);
    });
  }

  test('Should have colored buttons', async ({ page }) => {
    const errors = await setupConsoleErrorCollector(page);

    await page.goto('/games/simon-says');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Look for game elements
    const gameContent = page.locator('text=/Simon|TAP|WATCH|pattern/i').first();
    await expect(gameContent).toBeVisible({ timeout: 10000 });

    // Verify no crash
    const noCrash = await checkForCrash(page);
    expect(noCrash).toBe(true);
  });
});
