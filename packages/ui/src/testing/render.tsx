import { createI18n, type Locale } from '@dairy/i18n';
import { render, type RenderResult } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import type { ReactElement, ReactNode } from 'react';

/** Renders with the real catalogs. Uses a wrapper so `rerender` keeps the provider. */
export function renderWithI18n(ui: ReactElement, locale: Locale = 'en'): RenderResult {
  const i18n = createI18n(locale);
  function Wrapper({ children }: { children: ReactNode }) {
    return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
  }
  return render(ui, { wrapper: Wrapper });
}
