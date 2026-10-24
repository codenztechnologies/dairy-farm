import { createI18n, type Locale } from '@dairy/i18n';
import { render, type RenderResult } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import type { ReactElement } from 'react';

export function renderWithI18n(ui: ReactElement, locale: Locale = 'en'): RenderResult {
  return render(<I18nextProvider i18n={createI18n(locale)}>{ui}</I18nextProvider>);
}
