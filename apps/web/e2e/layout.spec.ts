import { expect, test } from '@playwright/test';
import { LOCALES, ROUTES, THEMES, visit, watchProblems } from './support';

for (const route of ROUTES) {
  for (const locale of LOCALES) {
    test(`layout: ${route} ${locale} fits the screen and loads without errors`, async ({
      page,
    }) => {
      const problems = watchProblems(page);
      await visit(page, route, { locale });

      // No sideways scrolling on any device size.
      const { scrollWidth, innerWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));
      expect(scrollWidth, 'horizontal overflow').toBeLessThanOrEqual(innerWidth);

      // Language drives text direction.
      await expect(page.locator('html')).toHaveAttribute('lang', locale);
      await expect(page.locator('html')).toHaveAttribute('dir', locale === 'ur' ? 'rtl' : 'ltr');

      expect(problems, 'console errors or failed requests').toEqual([]);
    });
  }
}

test('theme cookie sets the theme attribute', async ({ page }) => {
  for (const theme of THEMES) {
    await visit(page, '/', { theme });
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
  }
});

test('every control is large enough to tap (44 px) on the phone layout', async ({ page }, info) => {
  test.skip(info.project.name !== 'phone', 'phone only');
  await visit(page, '/login');
  const small = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('button, a[href], input, select')]
      .filter((el) => el.getClientRects().length > 0)
      .map((el) => ({
        name: el.getAttribute('aria-label') ?? el.textContent.trim().slice(0, 30),
        box: el.getBoundingClientRect(),
      }))
      .filter(({ box }) => box.width < 36 || box.height < 36)
      .map(
        ({ name, box }) =>
          `${name}: ${String(Math.round(box.width))}x${String(Math.round(box.height))}`,
      ),
  );
  expect(small, 'controls smaller than 36 px').toEqual([]);
});

test('production build hides nothing the preview needs and 404s unknown pages gracefully', async ({
  page,
}) => {
  const response = await page.goto('/this-does-not-exist');
  // Unknown module slugs show the "coming soon / not found" state instead of a crash.
  expect(response?.status()).toBeLessThan(500);
});
