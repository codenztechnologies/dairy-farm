import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { LOCALES, ROUTES, THEMES, visit } from './support';

// Real browser, real layout: this is where colour contrast is checked for every theme and language.
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

async function scan(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  return results.violations.map(
    (v) =>
      `${v.id} (${v.impact ?? 'n/a'}): ${v.help}\n${v.nodes
        .slice(0, 4)
        .map(
          (n) =>
            `   ${n.target.join(' ')}\n   ${n.failureSummary?.split('\n').slice(0, 3).join(' | ') ?? ''}`,
        )
        .join('\n')}`,
  );
}

for (const route of ROUTES) {
  for (const theme of THEMES) {
    for (const locale of LOCALES) {
      test(`axe: ${route} ${theme} ${locale}`, async ({ page }) => {
        await visit(page, route, { theme, locale });
        expect(await scan(page), 'accessibility violations').toEqual([]);
      });
    }
  }
}

test.describe('axe: open overlays', () => {
  test('command palette', async ({ page }) => {
    await visit(page, '/');
    await page.keyboard.press('Control+k');
    await expect(page.getByRole('dialog')).toBeVisible();
    expect(await scan(page)).toEqual([]);
  });

  test('notification centre', async ({ page }) => {
    await visit(page, '/');
    await page.getByRole('button', { name: /Notifications/ }).click();
    await expect(page.getByText('Mark all as read')).toBeVisible();
    expect(await scan(page)).toEqual([]);
  });

  test('dialog and confirm dialog on the design system page', async ({ page }) => {
    await visit(page, '/design-system');
    await page.getByRole('button', { name: 'Open dialog' }).click();
    await expect(page.getByRole('dialog', { name: 'Add a note' })).toBeVisible();
    expect(await scan(page)).toEqual([]);
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Delete animal' }).click();
    await expect(page.getByRole('alertdialog')).toBeVisible();
    expect(await scan(page)).toEqual([]);
  });

  test('login form with validation errors showing', async ({ page }) => {
    await visit(page, '/login');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText('Enter your password.')).toBeVisible();
    expect(await scan(page)).toEqual([]);
  });
});
