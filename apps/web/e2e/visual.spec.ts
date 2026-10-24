import { expect, test } from '@playwright/test';
import { visit } from './support';

// Visual regression. Baselines are generated on Linux in CI (workflow "Update visual baselines"),
// so these only run when VISUAL=1. Locally on Windows the fonts render differently.
test.skip(!process.env.VISUAL, 'visual tests run only with VISUAL=1 (see docs/06)');

const VARIANTS = [
  { name: 'light-en', theme: 'light', locale: 'en' },
  { name: 'dark-en', theme: 'dark', locale: 'en' },
  { name: 'light-ur', theme: 'light', locale: 'ur' },
] as const;

for (const variant of VARIANTS) {
  test(`dashboard ${variant.name}`, async ({ page }) => {
    await visit(page, '/', variant);
    await expect(page).toHaveScreenshot(`dashboard-${variant.name}.png`, { fullPage: true });
  });

  test(`login ${variant.name}`, async ({ page }) => {
    await visit(page, '/login', variant);
    await expect(page).toHaveScreenshot(`login-${variant.name}.png`, { fullPage: true });
  });

  test(`design system sections ${variant.name}`, async ({ page }) => {
    await visit(page, '/design-system', variant);
    const sections = page.locator('main > div > section');
    const count = await sections.count();
    expect(count).toBeGreaterThan(10);
    for (let index = 0; index < count; index += 1) {
      const section = sections.nth(index);
      // The async search section shows live timing and the table demo is data-driven; both are covered by tests.
      await section.scrollIntoViewIfNeeded();
      await expect(section).toHaveScreenshot(
        `design-system-${variant.name}-${String(index + 1).padStart(2, '0')}.png`,
      );
    }
  });
}
