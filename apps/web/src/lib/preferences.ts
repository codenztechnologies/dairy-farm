import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from '@dairy/i18n';

export const THEME_COOKIE = 'theme';
export type ThemeName = 'light' | 'dark';

export function parseLocale(value: string | undefined): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export function parseTheme(value: string | undefined): ThemeName | undefined {
  return value === 'light' || value === 'dark' ? value : undefined;
}

/** UI preferences only (not auth): readable by script, one year, same-site. */
export function writePreferenceCookie(name: string, value: string): void {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax`;
}

export { LOCALE_COOKIE };
