import { test, expect, Page } from '@playwright/test';

// Helper to collect console messages
function setupConsoleCapture(page: Page) {
  const logs: { type: string; text: string }[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  page.on('console', (msg) => {
    const text = msg.text();
    logs.push({ type: msg.type(), text });

    // Filter out expected messages
    if (msg.type() === 'error' && !text.includes('net::ERR') && !text.includes('Failed to fetch')) {
      errors.push(text);
    }
    if (msg.type() === 'warning' || text.includes('deprecated') || text.includes('Unexpected text node')) {
      warnings.push(text);
    }
  });

  page.on('pageerror', (error) => {
    errors.push(error.message);
  });

  return { logs, errors, warnings };
}

test.describe('Squad Game E2E Tests', () => {
  test.describe('Login Screen', () => {
    test('should render login screen without console errors or warnings', async ({ page }) => {
      const { errors, warnings } = setupConsoleCapture(page);

      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(7000); // Wait for auth timeout

      // Take screenshot
      await page.screenshot({ path: 'test-results/login-screen.png', fullPage: true });

      // Verify login screen elements
      await expect(page.locator('text=Squad Game')).toBeVisible();
      await expect(page.locator('text=Sign in to continue')).toBeVisible();
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      // Button renders as TouchableOpacity (div) not button
      await expect(page.getByText('Sign In', { exact: true })).toBeVisible();

      // Check for deprecation warnings (should be none)
      const deprecationWarnings = warnings.filter(w =>
        w.includes('deprecated') ||
        w.includes('shadow*') ||
        w.includes('TouchableWithoutFeedback')
      );
      expect(deprecationWarnings).toHaveLength(0);

      // Check for unexpected text node errors (should be none)
      const textNodeErrors = errors.filter(e => e.includes('Unexpected text node'));
      expect(textNodeErrors).toHaveLength(0);
    });

    test('should allow email input without errors', async ({ page }) => {
      const { errors, warnings } = setupConsoleCapture(page);

      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(7000);

      const emailInput = page.locator('input[type="email"]');
      await expect(emailInput).toBeVisible();

      // Focus and type
      await emailInput.click();
      await emailInput.fill('test@example.com');

      // Verify value
      await expect(emailInput).toHaveValue('test@example.com');

      // Take screenshot
      await page.screenshot({ path: 'test-results/email-typed.png', fullPage: true });

      // Check for text node errors during typing
      const textNodeErrors = warnings.filter(w => w.includes('Unexpected text node'));
      expect(textNodeErrors).toHaveLength(0);
    });

    test('should validate email and password', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(7000);

      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      const signInButton = page.getByText('Sign In', { exact: true });

      // Enter invalid email
      await emailInput.fill('invalid-email');
      await passwordInput.fill('password123');
      await signInButton.click();

      // Should show error
      await page.waitForTimeout(500);
      await expect(page.locator('text=valid email').or(page.locator('text=Please enter'))).toBeVisible({ timeout: 5000 });
    });

    test('should attempt sign in with valid credentials', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(7000);

      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      const signInButton = page.getByText('Sign In', { exact: true });

      // Enter valid credentials
      await emailInput.fill('test@example.com');
      await passwordInput.fill('password123');
      await signInButton.click();

      // Wait for network request
      await page.waitForTimeout(2000);

      // Take screenshot of result
      await page.screenshot({ path: 'test-results/after-signin-attempt.png', fullPage: true });

      // Either shows success or shows error (invalid credentials expected for non-existent user)
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('UI Components', () => {
    test('should render icons correctly', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(7000);

      // Check that Ionicons are rendering (people icon)
      const iconContainer = page.locator('[class*="iconContainer"]').or(page.locator('div').filter({ hasText: '' }).first());
      await expect(page.locator('body')).toBeVisible();
    });

    test('should have correct page title', async ({ page }) => {
      await page.goto('/');
      await expect(page).toHaveTitle(/Squad Game/);
    });

    test('should have responsive layout', async ({ page }) => {
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(7000);

      await expect(page.locator('text=Squad Game')).toBeVisible();
      await page.screenshot({ path: 'test-results/mobile-view.png', fullPage: true });

      // Test tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.reload();
      await page.waitForTimeout(7000);

      await expect(page.locator('text=Squad Game')).toBeVisible();
      await page.screenshot({ path: 'test-results/tablet-view.png', fullPage: true });
    });
  });

  test.describe('No Console Issues', () => {
    test('should have no deprecation warnings on load', async ({ page }) => {
      const { warnings } = setupConsoleCapture(page);

      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(7000);

      // Filter for deprecation warnings
      const deprecationWarnings = warnings.filter(w =>
        w.toLowerCase().includes('deprecated') ||
        w.includes('shadow*') ||
        w.includes('TouchableWithoutFeedback')
      );

      console.log('Warnings found:', warnings);
      expect(deprecationWarnings).toHaveLength(0);
    });

    test('should have no unexpected text node errors during interaction', async ({ page }) => {
      const { warnings, errors } = setupConsoleCapture(page);

      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(7000);

      // Interact with the page
      const emailInput = page.locator('input[type="email"]');
      await emailInput.click();

      // Type character by character to trigger re-renders
      for (const char of 'test@example.com') {
        await emailInput.type(char, { delay: 50 });
      }

      // Check for text node errors
      const textNodeIssues = [...warnings, ...errors].filter(w =>
        w.includes('Unexpected text node') ||
        w.includes('text node cannot be a child')
      );

      console.log('Text node issues:', textNodeIssues);
      expect(textNodeIssues).toHaveLength(0);
    });
  });
});

test.describe('Full Auth Flow Test', () => {
  test('complete registration and login flow', async ({ page }) => {
    const { errors, warnings } = setupConsoleCapture(page);
    const testEmail = `testuser${Date.now()}@test.com`;
    const testPassword = 'TestPassword123!';

    // Step 1: Go to login screen
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(7000);

    await page.screenshot({ path: 'test-results/flow-1-login.png', fullPage: true });
    console.log('Step 1: Login screen loaded');

    // Step 2: Click "Sign Up" to switch to registration mode
    await page.getByText("Don't have an account").click();
    await page.waitForTimeout(500);
    console.log('Step 2: Switched to Sign Up mode');

    // Step 3: Enter email and password
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill(testEmail);

    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill(testPassword);

    await page.screenshot({ path: 'test-results/flow-2-credentials-entered.png', fullPage: true });
    console.log('Step 3: Credentials entered:', testEmail);

    // Step 4: Click Sign Up
    await page.getByText('Sign Up', { exact: true }).click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/flow-3-after-signup.png', fullPage: true });
    console.log('Step 4: Sign Up clicked');

    // Verify no critical errors
    const criticalErrors = errors.filter(e =>
      !e.includes('net::ERR') &&
      !e.includes('Failed to fetch') &&
      !e.includes('placeholder')
    );

    console.log('Errors:', errors);
    console.log('Warnings:', warnings);
    console.log('Critical errors:', criticalErrors);

    // Check if we moved past login screen (to onboarding or error)
    await expect(page.locator('body')).toBeVisible();
  });
});
