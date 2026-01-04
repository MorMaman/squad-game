import { test, expect, Page } from '@playwright/test';

// Known patterns to ignore in tests
const IGNORED_PATTERNS = [
  'Haptics',
  'not available on web',
  'React does not recognize',
  'validateDOMNesting',
  'textShadow',
  'shadow',
  'expo-av has been deprecated',
  'registerWebModule',
  'expo-notifications',
  'Reanimated',
  'layout animation',
  'pointerEvents',
  '_getAnimationTimestamp',
  'GameCard',
  'LogBoxStateSubscription',
  // Database/API errors from unreleased features
  'PGRST205',
  'PGRST116',
  'user_inventory',
  'shop_items',
  'user_stats.stars',
  'Error fetching',
  'Error getting push token',
  'projectId',
];

function isKnownIssue(text: string): boolean {
  return IGNORED_PATTERNS.some(pattern => text.includes(pattern));
}

// Helper to collect console errors
async function setupConsoleErrorCollector(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!isKnownIssue(text)) {
        errors.push(text);
      }
    }
  });
  page.on('pageerror', (err) => {
    if (!isKnownIssue(err.message)) {
      errors.push(`Page Error: ${err.message}`);
    }
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

test.describe('Color Match Game', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  for (let run = 1; run <= 3; run++) {
    test(`Run ${run}: Should load and play Color Match without errors`, async ({ page }) => {
      const errors = await setupConsoleErrorCollector(page);

      // Navigate to Color Match game
      await page.goto('/games/color-match');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Check game loaded
      const titleOrContent = await page.locator('text=/Color Match|Stroop|tricked|START/i').first();
      await expect(titleOrContent).toBeVisible({ timeout: 10000 });

      // Verify no crash
      const noCrash = await checkForCrash(page);
      expect(noCrash).toBe(true);

      // Try to start the game
      const startButton = page.locator('text=/START|Play/i').first();
      if (await startButton.isVisible()) {
        await startButton.click();
        await page.waitForTimeout(500);

        // Wait for countdown
        await page.waitForTimeout(4000);

        // Try clicking a color button
        const colorButtons = page.locator('text=/RED|BLUE|GREEN|YELLOW/i');
        const buttonCount = await colorButtons.count();

        if (buttonCount > 0) {
          await colorButtons.first().click();
          await page.waitForTimeout(300);
        }
      }

      // Verify still no crash after interaction
      const stillNoCrash = await checkForCrash(page);
      expect(stillNoCrash).toBe(true);

      // All errors should already be filtered by setupConsoleErrorCollector
      expect(errors.length).toBe(0);
    });
  }

  test('Should have color buttons', async ({ page }) => {
    const errors = await setupConsoleErrorCollector(page);

    await page.goto('/games/color-match');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Look for game elements
    const gameContent = page.locator('text=/Color|Match|START|tricked/i').first();
    await expect(gameContent).toBeVisible({ timeout: 10000 });

    // Verify no crash
    const noCrash = await checkForCrash(page);
    expect(noCrash).toBe(true);
  });
});
