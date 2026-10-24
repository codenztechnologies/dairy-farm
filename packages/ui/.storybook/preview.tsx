import { createI18n, direction, type Locale } from '@dairy/i18n';
import { useEffect, useMemo } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Toaster, TooltipProvider } from '../src';
import type { Decorator, Preview } from '@storybook/react-vite';
import './preview.css';

// Toolbar controls: the same theme and language switches the app has, so every story can be checked
// in light/dark and English/Urdu (right-to-left) without writing extra stories.
const withApp: Decorator = (Story, context) => {
  const theme = context.globals.theme as 'light' | 'dark';
  const locale = context.globals.locale as Locale;
  const i18n = useMemo(() => createI18n(locale), [locale]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.lang = locale;
    root.dir = direction(locale);
  }, [theme, locale]);

  return (
    <I18nextProvider i18n={i18n}>
      <TooltipProvider>
        <div className="min-h-40 bg-bg p-6 text-text">
          <Story />
        </div>
        <Toaster />
      </TooltipProvider>
    </I18nextProvider>
  );
};

const preview: Preview = {
  decorators: [withApp],
  globalTypes: {
    theme: {
      description: 'Colour theme',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        dynamicTitle: true,
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
      },
    },
    locale: {
      description: 'Language (Urdu is right-to-left)',
      toolbar: {
        title: 'Language',
        icon: 'globe',
        dynamicTitle: true,
        items: [
          { value: 'en', title: 'English' },
          { value: 'ur', title: 'اردو' },
        ],
      },
    },
  },
  initialGlobals: { theme: 'light', locale: 'en' },
  parameters: {
    layout: 'fullscreen',
    controls: { expanded: true },
    a11y: { test: 'error' },
  },
};

export default preview;
