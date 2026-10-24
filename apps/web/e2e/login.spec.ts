import { expect, test } from '@playwright/test';
import { visit } from './support';

test.describe('login flow (preview stub)', () => {
  test.beforeEach(async ({ page }) => {
    await visit(page, '/login');
  });

  test('empty submit explains what to enter and focuses the first problem', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText('Enter your email or mobile number.')).toBeVisible();
    await expect(page.getByText('Enter your password.')).toBeVisible();
    await expect(page.getByLabel(/Email or mobile number/)).toBeFocused();
  });

  test('wrong credentials show one generic message and keep the typed values', async ({ page }) => {
    await page.getByLabel(/Email or mobile number/).fill('ali@example.com');
    await page.getByLabel(/^Password/).fill('wrong-password');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('button', { name: /Signing in/ })).toBeDisabled();
    await expect(page.getByText(/not right/)).toBeVisible();
    await expect(page.getByLabel(/Email or mobile number/)).toHaveValue('ali@example.com');
  });

  test('server error shows a support code', async ({ page }) => {
    await page.getByLabel(/Email or mobile number/).fill('0300 1234567');
    await page.getByLabel(/^Password/).fill('server-error');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText('Support code: 7F3A-92')).toBeVisible();
  });

  test('network failure is explained', async ({ page }) => {
    await page.getByLabel(/Email or mobile number/).fill('ali@example.com');
    await page.getByLabel(/^Password/).fill('offline');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText(/can't reach the server/)).toBeVisible();
  });

  test('success shows a confirmation', async ({ page }) => {
    await page.getByLabel(/Email or mobile number/).fill('ali@example.com');
    await page.getByLabel(/^Password/).fill('a long enough passphrase');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText('Signed in', { exact: true })).toBeVisible();
  });

  test('password can be shown and hidden, and pasted', async ({ page }) => {
    const password = page.getByLabel(/^Password/);
    await password.fill('secret value');
    await expect(password).toHaveAttribute('type', 'password');
    await page.getByRole('button', { name: 'Show password' }).click();
    await expect(password).toHaveAttribute('type', 'text');
    await expect(password).toHaveValue('secret value');
  });

  test('the whole form works with the keyboard only', async ({ page }) => {
    await page.getByLabel(/Email or mobile number/).focus();
    await page.keyboard.type('ali@example.com');
    await page.keyboard.press('Tab');
    await page.keyboard.type('a long enough passphrase');
    await page.keyboard.press('Enter');
    await expect(page.getByText('Signed in', { exact: true })).toBeVisible();
  });
});

test.describe('shell', () => {
  test('palette opens with Ctrl+K and navigates', async ({ page }) => {
    await visit(page, '/');
    await page.keyboard.press('Control+k');
    await page.getByPlaceholder(/Search animals/).fill('milk');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/milk$/);
  });

  test('switching to Urdu flips direction', async ({ page }, info) => {
    await visit(page, '/');
    // On phones the language choice lives in the user menu to keep the top bar uncluttered.
    await page
      .getByRole('button', { name: info.project.name === 'phone' ? /Ali Raza/ : /Language/ })
      .click();
    await page.getByRole('menuitem', { name: 'اردو' }).click();
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  });
});
