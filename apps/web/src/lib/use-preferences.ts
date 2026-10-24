'use client';

import { useRouter } from 'next/navigation';
import { useState, useSyncExternalStore } from 'react';
import { LOCALE_COOKIE, THEME_COOKIE, writePreferenceCookie, type ThemeName } from './preferences';
import type { Locale } from '@dairy/i18n';

function subscribeSystemTheme(onChange: () => void): () => void {
  const query = window.matchMedia('(prefers-color-scheme: dark)');
  query.addEventListener('change', onChange);
  return () => {
    query.removeEventListener('change', onChange);
  };
}

function getSystemDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/** Language and colour theme choices, stored in cookies so the server renders the right lang/dir/theme. */
export function usePreferences(initialTheme: ThemeName | undefined): {
  theme: ThemeName;
  toggleTheme: () => void;
  changeLocale: (next: Locale) => void;
} {
  const router = useRouter();
  const systemDark = useSyncExternalStore(subscribeSystemTheme, getSystemDark, () => false);
  const [choice, setChoice] = useState<ThemeName | undefined>(initialTheme);
  // Without a saved choice the CSS follows the OS setting; mirror it for the toggle icon.
  const theme: ThemeName = choice ?? (systemDark ? 'dark' : 'light');

  function changeLocale(next: Locale) {
    writePreferenceCookie(LOCALE_COOKIE, next);
    router.refresh();
  }

  function toggleTheme() {
    const next: ThemeName = theme === 'dark' ? 'light' : 'dark';
    setChoice(next);
    document.documentElement.dataset.theme = next;
    writePreferenceCookie(THEME_COOKIE, next);
  }

  return { theme, toggleTheme, changeLocale };
}
