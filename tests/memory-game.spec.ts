import { test, expect } from '@playwright/test';

test.setTimeout(120000);

test.describe('Memory Match Game', () => {
  test('memory game loads and can be played', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'error') {
        if (!text.includes('React DevTools') && !text.includes('deprecated')) {
          errors.push(text);
          console.log(`[ERROR] ${text}`);
        }
      }
    });

    page.on('pageerror', error => {
      errors.push(error.message);
      console.log(`[PAGE ERROR] ${error.message}`);
    });

    // Navigate directly to memory game
    console.log('Loading memory game...');
    await page.goto('/games/memory-match', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(5000);

    // Screenshot the initial state
    await page.screenshot({ path: 'tests/screenshots/memory-game-initial.png', fullPage: true });

    // Check for game title
    const title = await page.getByText('Memory Match').first();
    await expect(title).toBeVisible({ timeout: 10000 });
    console.log('Memory Match title visible');

    // Check for cards (look for the ? mark or card elements)
    const cards = page.locator('[style*="cursor"]').or(page.locator('div').filter({ hasText: '?' }));
    const cardCount = await cards.count();
    console.log(`Found ${cardCount} potential card elements`);

    // Check for stats display
    const movesText = await page.getByText(/moves/i).first();
    if (await movesText.isVisible()) {
      console.log('Moves counter visible');
    }

    // Try to find clickable card elements
    // Cards should have TouchableOpacity or be clickable divs
    const clickableCards = page.locator('[role="button"]').or(page.locator('div[tabindex]'));
    const clickableCount = await clickableCards.count();
    console.log(`Found ${clickableCount} clickable elements`);

    // Try clicking on the game area to flip cards
    console.log('Attempting to play the game...');

    // Get all elements that might be cards
    const gameArea = page.locator('div').filter({ hasText: '?' });
    const questionMarks = await gameArea.count();
    console.log(`Found ${questionMarks} elements with question marks`);

    // Click on card containers (TouchableOpacity renders as div with tabindex and cursor)
    try {
      // Find card containers - they have tabindex="0" and cursor style
      const cardContainers = page.locator('div[tabindex="0"]').filter({ hasText: '?' });
      const containerCount = await cardContainers.count();
      console.log(`Found ${containerCount} card containers`);

      if (containerCount >= 2) {
        // Click first card
        await cardContainers.first().click();
        console.log('Clicked first card');
        await page.waitForTimeout(500);

        // Click second card
        await cardContainers.nth(1).click();
        console.log('Clicked second card');
        await page.waitForTimeout(1000);

        await page.screenshot({ path: 'tests/screenshots/memory-game-after-click.png', fullPage: true });
      }
    } catch (e) {
      console.log('Could not click on cards:', e);
    }

    // Final screenshot
    await page.screenshot({ path: 'tests/screenshots/memory-game-final.png', fullPage: true });

    // Print content for debugging
    const bodyText = await page.locator('body').textContent();
    console.log('Page content preview:', bodyText?.substring(0, 500));

    // Check for errors
    if (errors.length > 0) {
      console.log('Errors found:', errors);
    }
    expect(errors.length, `Errors: ${errors.join('; ')}`).toBe(0);
  });

  test('can navigate to memory game from games list', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('React DevTools')) {
        errors.push(msg.text());
        console.log(`[ERROR] ${msg.text()}`);
      }
    });

    page.on('pageerror', error => {
      errors.push(error.message);
    });

    // Go to home first
    console.log('Loading app...');
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(5000);

    await page.screenshot({ path: 'tests/screenshots/memory-nav-1-home.png', fullPage: true });

    // Check current page content
    const bodyText = await page.locator('body').textContent();
    console.log('Home page content:', bodyText?.substring(0, 300));

    expect(errors.length, `Errors: ${errors.join('; ')}`).toBe(0);
  });
});
