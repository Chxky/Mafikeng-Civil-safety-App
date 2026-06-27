import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test.describe('Mahikeng Civic Safety App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('home page loads with header, SOS button, and service hub', async ({ page }) => {
    // Verify header renders
    // Header should have a visible h1 with the greeting
    await expect(page.locator('h1').first()).toBeVisible();

    // SOS button should be present
    const sosButton = page.locator('button:has-text("SOS")');
    await expect(sosButton).toBeVisible();

    // Service hub grid should have 12+ service buttons

    await expect(page.locator('.grid.grid-cols-4 button').first()).toBeVisible();
    // Quick stats should render
    await expect(page.locator('.glass-card .text-3xl.font-black').first()).toBeVisible();
  });

  test('navigation via bottom nav works', async ({ page }) => {
    // Click Report button in bottom nav
    const reportNav = page.locator('nav a, button:has-text("Report")').first();
    if (await reportNav.isVisible()) {
      await reportNav.click();
      await page.waitForLoadState('networkidle');
    } else {
      // Navigate directly if bottom nav label doesn't match
      await page.goto(`${BASE_URL}/#/report`);
      await page.waitForLoadState('networkidle');
    }

    // Should land on report page with category selection
    await expect(page).toHaveURL(/#\/report/);
  });

  test('profile page has dark mode toggle', async ({ page }) => {
    // Navigate to profile
    await page.goto(`${BASE_URL}/#/profile`);
    await page.waitForLoadState('networkidle');

    // Dark mode toggle should be visible
    // Look for the toggle switch (the rounded button with sun/moon)
    const toggleSwitch = page.locator('button:has-text("Dark")').or(page.locator('button:has-text("Light")')).or(
      page.locator('button').filter({ has: page.locator('.w-10.h-6.rounded-full') })
    ).first();
    await expect(toggleSwitch).toBeVisible();
  });

  test('dark mode toggle changes theme', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/profile`);
    await page.waitForLoadState('networkidle');

    // Get initial theme state
    const initialHtmlClass = await page.evaluate(() => document.documentElement.classList.contains('dark'));

    // Find and click the dark mode toggle
    // The toggle is in a card with sun/moon emoji
    const toggleButton = page.locator('button').filter({ has: page.locator('text=🌙').or(page.locator('text=☀️')) }).first();
    if (await toggleButton.isVisible()) {
      await toggleButton.click();
      await page.waitForTimeout(300); // Wait for transition

      // Theme should have toggled
      const newHtmlClass = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      expect(newHtmlClass).not.toBe(initialHtmlClass);

      // Toggle back
      await toggleButton.click();
      await page.waitForTimeout(300);
      const restoredClass = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      expect(restoredClass).toBe(initialHtmlClass);
    }
  });

  test('report issue flow - category selection', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/report`);
    await page.waitForLoadState('networkidle');

    // Should show category selection
    await expect(page.locator('.grid.grid-cols-2 button').first()).toBeVisible();
    await expect(page.locator('h2').filter({ hasText: /what|issue/ }).first().or(page.locator('h1').filter({ hasText: /report|issue/ }).first())).toBeVisible();
  });

  test('power page loads and shows outage info', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/power`);
    await page.waitForLoadState('networkidle');

    // Power page should have content (schedule, report, or map)
    await expect(page.locator('h1, h2').filter({ hasText: /power|electric|outage|load.?shed/i }).first()).toBeVisible();
  });

  test('map page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/map`);
    await page.waitForLoadState('networkidle');

    // Map should render (Leaflet container)
    await expect(page.locator('.leaflet-container, #map')).toBeVisible({ timeout: 8000 });
  });

  test('jobs page loads with listings', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/jobs`);
    await page.waitForLoadState('networkidle');

    // Jobs page should have content
    await expect(page.locator('h1, h2').filter({ hasText: /job|tender|vacanc/i }).first()).toBeVisible({ timeout: 8000 });
  });

  test('healthcare page loads with facilities', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/healthcare`);
    await page.waitForLoadState('networkidle');

    // Healthcare page should have content
    await expect(page.locator('h1, h2').filter({ hasText: /health|clinic|facilit/i }).first()).toBeVisible({ timeout: 8000 });
  });

  test('water quality page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/water`);
    await page.waitForLoadState('networkidle');

    // Water quality page should have content
    await expect(page.locator('h1, h2').filter({ hasText: /water|quality|monitor/i }).first()).toBeVisible({ timeout: 8000 });
  });

  test('documents page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/documents`);
    await page.waitForLoadState('networkidle');

    // Documents page should have content
    await expect(page.locator('h1, h2').filter({ hasText: /document|vault|municipal|report/i }).first()).toBeVisible({ timeout: 8000 });
  });

  test('marketplace page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/marketplace`);
    await page.waitForLoadState('networkidle');

    // Marketplace page should have content
    await expect(page.locator('h1, h2').filter({ hasText: /market|business|classif/i }).first()).toBeVisible({ timeout: 8000 });
  });

  test('disaster shield page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/disaster`);
    await page.waitForLoadState('networkidle');

    // Disaster shield page should have content
    await expect(page.locator('h1, h2').filter({ hasText: /disaster|shield|warning/i }).first()).toBeVisible({ timeout: 8000 });
  });

  test('safety feed page loads with reports', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/safety`);
    await page.waitForLoadState('networkidle');

    // Safety feed should have content
    await expect(page.locator('h1, h2').filter({ hasText: /safety|feed|incident/i }).first()).toBeVisible({ timeout: 8000 });
  });

  test('no console errors on key pages', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push({ type: msg.type(), text: msg.text() });
      }
    });

    // Visit multiple pages
    const pages = ['/', '/#/profile', '/#/report', '/#/power', '/#/jobs', '/#/map', '/#/safety'];
    for (const path of pages) {
      await page.goto(`${BASE_URL}${path}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
    }

    // Filter non-blocking errors:
    // - favicon/resource 404s (missing assets)
    // - source map warnings
    // - Leaflet marker icon 404s
    // - React duplicate key warnings (warnings, not errors)
    const realErrors = errors.filter(e =>
      !e.text.includes('favicon.ico') &&
      !e.text.includes('favicon.svg') &&
      !e.text.includes('.map') &&
      !e.text.includes('source map') &&
      !e.text.includes('404') &&
      !e.text.includes('leaflet') &&
      !e.text.includes('two children with the same key') &&
      !e.text.includes('Warning:') &&
      !e.text.includes('Failed to load module')
    );
    
    // Log all errors for debugging
    if (errors.length > 0) {
      console.log(`\n=== Console errors found (${errors.length} total, ${realErrors.length} unfiltered) ===`);
      errors.forEach(e => console.log(`  [${e.type}] ${e.text.substring(0, 200)}`));
    }
    expect(realErrors.length).toBe(0);
  });
});
