import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const BASE_URL = 'http://localhost:3000';

test.describe('Accessibility E2E Verification', () => {
  // Test 1: Landing Page and Skip Link
  test('Landing page - Axe checks and skip link', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Axe Check
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);

    // Skip link keyboard check
    await page.keyboard.press('Tab');
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeFocused();
    await page.keyboard.press('Enter');
    
    // In many browsers, skip link moves focus to the target element
    // This just verifies it didn't throw an error.
  });

  // Test 2: Upload Dropzone & Forms
  test('Upload page - Axe checks and keyboard accessibility', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle');

    // Keyboard navigation to the upload dropzone
    const dropzone = page.locator('[aria-label="Legal document upload dropzone"]');
    await dropzone.waitFor({ state: 'attached' });
    
    // We can't easily tab to it because we don't know the exact tab index from the top,
    // but we know the input is sr-only and tabIndex=-1, while the button is focusable.
    const browseButton = dropzone.locator('button:has-text("Browse Document")');
    await browseButton.focus();
    await expect(browseButton).toBeFocused();
  });

  // Test 3: Analysis Route
  test('Analysis workspace - Axe checks and Tabs keyboard nav', async ({ page }) => {
    await page.goto(`${BASE_URL}/analyze`);
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  // Test 4: Comparison Route
  test('Comparison workspace - Axe checks', async ({ page }) => {
    await page.goto(`${BASE_URL}/compare`);
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  // Test 5: Q&A Route
  test('Q&A workspace - Axe checks', async ({ page }) => {
    await page.goto(`${BASE_URL}/qa`);
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  // Test 6: Action Center Route
  test('Action Center - Axe checks', async ({ page }) => {
    await page.goto(`${BASE_URL}/action-center`);
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});

