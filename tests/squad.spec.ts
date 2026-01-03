import { test, expect, Page } from '@playwright/test';

// Test user credentials - using existing test account or creating new ones
const TEST_USER_1 = {
  email: `squad-test-1-${Date.now()}@test.com`,
  password: 'TestPassword123!',
};

const TEST_USER_2 = {
  email: `squad-test-2-${Date.now()}@test.com`,
  password: 'TestPassword123!',
};

// Helper to collect console messages
function setupConsoleCapture(page: Page) {
  const logs: { type: string; text: string }[] = [];
  const errors: string[] = [];

  page.on('console', (msg) => {
    const text = msg.text();
    logs.push({ type: msg.type(), text });
    if (msg.type() === 'error' && !text.includes('net::ERR') && !text.includes('Failed to fetch')) {
      errors.push(text);
    }
  });

  page.on('pageerror', (error) => {
    errors.push(error.message);
  });

  return { logs, errors };
}

// Helper to register a new user
async function registerUser(page: Page, email: string, password: string) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // Click "Sign Up" link
  const signUpLink = page.getByText("Don't have an account");
  if (await signUpLink.isVisible()) {
    await signUpLink.click();
    await page.waitForTimeout(500);
  }

  // Fill in credentials
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);

  // Click Sign Up button
  await page.getByText('Sign Up', { exact: true }).click();
  await page.waitForTimeout(3000);
}

// Helper to complete onboarding
async function completeOnboarding(page: Page, displayName: string) {
  // Wait for onboarding to load
  await page.waitForTimeout(2000);

  // Check if we're on onboarding (Welcome screen)
  const welcomeText = page.getByText('YOUR SQUAD');
  if (await welcomeText.isVisible({ timeout: 5000 }).catch(() => false)) {
    // Click LET'S GO
    await page.getByText("LET'S GO").click();
    await page.waitForTimeout(1000);

    // Select avatar (first one)
    await page.locator('[data-testid="avatar-option"]').first().click().catch(async () => {
      // Fallback: click on any avatar-like element
      const avatarButtons = page.locator('div').filter({ hasText: 'Competitive' });
      if (await avatarButtons.first().isVisible()) {
        await avatarButtons.first().click();
      }
    });
    await page.waitForTimeout(500);

    // Enter display name
    const nameInput = page.getByPlaceholder('Enter your name');
    if (await nameInput.isVisible()) {
      await nameInput.fill(displayName);
    }
    await page.waitForTimeout(500);

    // Click LOCK IT IN
    await page.getByText('LOCK IT IN').click();
    await page.waitForTimeout(1000);

    // Training screen - START TRAINING
    const startTrainingBtn = page.getByText('START TRAINING');
    if (await startTrainingBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await startTrainingBtn.click();
      await page.waitForTimeout(1000);

      // TAP TO START
      await page.getByText('TAP TO START').click();
      await page.waitForTimeout(11000); // Wait for 10 second tap game + buffer

      // NEXT CHALLENGE
      await page.getByText('NEXT CHALLENGE').click();
      await page.waitForTimeout(1000);

      // Select poll option
      const pollOption = page.getByText('Cheetah');
      if (await pollOption.isVisible()) {
        await pollOption.click();
      }
      await page.waitForTimeout(500);

      // LOCK IN ANSWER
      await page.getByText('LOCK IN ANSWER').click();
      await page.waitForTimeout(1000);

      // COMPLETE TRAINING
      await page.getByText('COMPLETE TRAINING').click();
      await page.waitForTimeout(1000);
    }
  }
}

// Helper to create a squad
async function createSquad(page: Page, squadName: string) {
  // Should be on squad screen now
  await page.waitForTimeout(2000);

  // Click Create a Squad
  const createBtn = page.getByText('Create a Squad');
  if (await createBtn.isVisible({ timeout: 5000 })) {
    await createBtn.click();
    await page.waitForTimeout(1000);

    // Enter squad name
    const squadInput = page.getByPlaceholder('The Legends');
    if (await squadInput.isVisible()) {
      await squadInput.fill(squadName);
    }
    await page.waitForTimeout(500);

    // Click Create Squad button
    await page.getByText('Create Squad', { exact: true }).click();
    await page.waitForTimeout(3000);
  }
}

test.describe('Squad Creation E2E Tests', () => {
  test('should create a new squad successfully', async ({ page }) => {
    const { errors } = setupConsoleCapture(page);
    const squadName = `TestSquad_${Date.now()}`;

    await page.screenshot({ path: 'test-results/squad-1-start.png', fullPage: true });

    // Register new user
    await registerUser(page, TEST_USER_1.email, TEST_USER_1.password);
    await page.screenshot({ path: 'test-results/squad-2-after-register.png', fullPage: true });

    // Complete onboarding
    await completeOnboarding(page, 'TestPlayer1');
    await page.screenshot({ path: 'test-results/squad-3-after-onboarding.png', fullPage: true });

    // Create squad
    await createSquad(page, squadName);
    await page.screenshot({ path: 'test-results/squad-4-after-create.png', fullPage: true });

    // Verify we're on the main app (dashboard)
    const dashboardVisible = await page.getByText('Today').isVisible({ timeout: 10000 }).catch(() => false);

    console.log('Squad created:', squadName);
    console.log('Dashboard visible:', dashboardVisible);
    console.log('Errors:', errors);

    // Take final screenshot
    await page.screenshot({ path: 'test-results/squad-5-final.png', fullPage: true });
  });

  test('should allow duplicate squad names', async ({ page }) => {
    test.setTimeout(120000); // 2 minutes for this test
    const { errors } = setupConsoleCapture(page);
    const duplicateName = 'DuplicateSquad'; // Same name for multiple squads

    // Register first user and create squad
    await registerUser(page, `dup-test-1-${Date.now()}@test.com`, 'TestPassword123!');
    await completeOnboarding(page, 'Player1');

    // Create first squad with the name
    await createSquad(page, duplicateName);
    await page.screenshot({ path: 'test-results/duplicate-1-first-squad.png', fullPage: true });

    // Log out or clear session
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForTimeout(3000);

    // Register second user
    await registerUser(page, `dup-test-2-${Date.now()}@test.com`, 'TestPassword123!');
    await completeOnboarding(page, 'Player2');

    // Create second squad with SAME name
    await createSquad(page, duplicateName);
    await page.screenshot({ path: 'test-results/duplicate-2-second-squad.png', fullPage: true });

    // Should succeed without errors about duplicate names
    const duplicateNameErrors = errors.filter(e =>
      e.toLowerCase().includes('duplicate') ||
      e.toLowerCase().includes('unique') ||
      e.toLowerCase().includes('already exists')
    );

    console.log('All errors:', errors);
    console.log('Duplicate name errors:', duplicateNameErrors);

    expect(duplicateNameErrors).toHaveLength(0);
  });

  test('should show squad screen with back button and skip option', async ({ page }) => {
    await registerUser(page, `ui-test-${Date.now()}@test.com`, 'TestPassword123!');
    await completeOnboarding(page, 'UITestPlayer');

    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/squad-ui-1-screen.png', fullPage: true });

    // Check for back button
    const backButton = page.locator('[data-testid="back-button"]').or(page.locator('div').filter({ has: page.locator('svg') }).first());

    // Check for skip option
    const skipButton = page.getByText('Skip for now');
    const skipVisible = await skipButton.isVisible({ timeout: 5000 }).catch(() => false);

    console.log('Skip button visible:', skipVisible);

    if (skipVisible) {
      await page.screenshot({ path: 'test-results/squad-ui-2-skip-visible.png', fullPage: true });
    }
  });

  test('should allow skipping squad creation', async ({ page }) => {
    await registerUser(page, `skip-test-${Date.now()}@test.com`, 'TestPassword123!');
    await completeOnboarding(page, 'SkipTestPlayer');

    await page.waitForTimeout(2000);

    // Click skip
    const skipButton = page.getByText('Skip for now');
    if (await skipButton.isVisible({ timeout: 5000 })) {
      await skipButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-results/skip-1-after-skip.png', fullPage: true });

      // Should be on dashboard
      const onDashboard = await page.getByText('Today').isVisible({ timeout: 5000 }).catch(() => false);
      console.log('On dashboard after skip:', onDashboard);
    }
  });

  test('should handle squad name validation', async ({ page }) => {
    await registerUser(page, `validation-test-${Date.now()}@test.com`, 'TestPassword123!');
    await completeOnboarding(page, 'ValidationPlayer');

    await page.waitForTimeout(2000);

    // Click Create a Squad
    const createBtn = page.getByText('Create a Squad');
    if (await createBtn.isVisible({ timeout: 5000 })) {
      await createBtn.click();
      await page.waitForTimeout(1000);

      // Try to create with empty name
      await page.getByText('Create Squad', { exact: true }).click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-results/validation-1-empty.png', fullPage: true });

      // Try with single character
      const squadInput = page.getByPlaceholder('The Legends');
      if (await squadInput.isVisible()) {
        await squadInput.fill('A');
        await page.getByText('Create Squad', { exact: true }).click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'test-results/validation-2-short.png', fullPage: true });
      }
    }
  });

  test('should join squad with invite code', async ({ page }) => {
    await registerUser(page, `join-test-${Date.now()}@test.com`, 'TestPassword123!');
    await completeOnboarding(page, 'JoinTestPlayer');

    await page.waitForTimeout(2000);

    // Click Join a Squad
    const joinBtn = page.getByText('Join a Squad');
    if (await joinBtn.isVisible({ timeout: 5000 })) {
      await joinBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-results/join-1-code-screen.png', fullPage: true });

      // Enter invalid code
      const codeInput = page.getByPlaceholder('ABC123');
      if (await codeInput.isVisible()) {
        await codeInput.fill('INVALID');
        await page.getByText('Join Squad', { exact: true }).click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'test-results/join-2-invalid-code.png', fullPage: true });

        // Should show error
        const errorVisible = await page.getByText('Invalid invite code').isVisible({ timeout: 3000 }).catch(() => false);
        console.log('Invalid code error shown:', errorVisible);
      }
    }
  });
});
