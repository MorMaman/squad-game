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

test.describe('Reaction Time Game', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  for (let run = 1; run <= 3; run++) {
    test(`Run ${run}: Should load and play Reaction Time without errors`, async ({ page }) => {
      const errors = await setupConsoleErrorCollector(page);

      // Navigate to Reaction Time game
      await page.goto('/games/reaction-time');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Check game loaded
      const titleOrContent = await page.locator('text=/Reaction Time|Round|START|How fast/i').first();
      await expect(titleOrContent).toBeVisible({ timeout: 10000 });

      // Verify no crash
      const noCrash = await checkForCrash(page);
      expect(noCrash).toBe(true);

      // Try to start the game
      const startButton = page.locator('text=/START/i').first();
      if (await startButton.isVisible()) {
        await startButton.click();
        await page.waitForTimeout(500);

        // Game should show "Wait..." or similar
        const waitIndicator = page.locator('text=/Wait|TAP|Too Early/i').first();

        // Wait for the game to transition (2-5 seconds delay in the game)
        await page.waitForTimeout(3000);

        // Try tapping
        const gameArea = page.locator('[class*="circle"], [class*="game"], [role="button"]').first();
        if (await gameArea.isVisible()) {
          await gameArea.click();
          await page.waitForTimeout(500);
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

  test('Should display round counter', async ({ page }) => {
    const errors = await setupConsoleErrorCollector(page);

    await page.goto('/games/reaction-time');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Look for round indicator
    const roundText = page.locator('text=/Round|1\\/5|Results/i').first();
    await expect(roundText).toBeVisible({ timeout: 10000 });

    // Verify no crash
    const noCrash = await checkForCrash(page);
    expect(noCrash).toBe(true);
  });
});
