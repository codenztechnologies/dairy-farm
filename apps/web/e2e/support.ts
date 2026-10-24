import type { Page } from '@playwright/test';

export const ROUTES = ['/', '/design-system', '/login'] as const;
export const THEMES = ['light', 'dark'] as const;
export const LOCALES = ['en', 'ur'] as const;

export type Theme = (typeof THEMES)[number];
export type Locale = (typeof LOCALES)[number];

/** Opens a page with a chosen theme and language (stored in cookies, like the real preference menus). */
export async function visit(
  page: Page,
  path: string,
  { theme = 'light', locale = 'en' }: { theme?: Theme; locale?: Locale } = {},
): Promise<void> {
  await page.context().addCookies([
    { name: 'theme', value: theme, url: 'http://localhost:3100' },
    { name: 'locale', value: locale, url: 'http://localhost:3100' },
  ]);
  await page.goto(path);
  await settle(page);
}

/** Waits until fonts are ready and charts (canvas) have painted, so results do not depend on timing. */
export async function settle(page: Page): Promise<void> {
  await page.evaluate(() => document.fonts.ready);
  if (page.url().includes('/design-system')) {
    await page.locator('canvas').first().waitFor({ state: 'attached' });
    // ECharts is loaded lazily; give the first paint a moment.
    await page.waitForTimeout(400);
  }
}

/** Collects console errors and failed requests during a test. */
export function watchProblems(page: Page): string[] {
  const problems: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => {
    problems.push(`pageerror: ${error.message}`);
  });
  page.on('response', (response) => {
    if (response.status() >= 400) problems.push(`${String(response.status())}: ${response.url()}`);
  });
  return problems;
}
