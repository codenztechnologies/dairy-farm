import i18next, { type i18n } from 'i18next';
import ICU from 'i18next-icu';
import enCommon from '../locales/en/common.json';
import urCommon from '../locales/ur/common.json';

export const LOCALES = ['en', 'ur'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALE_COOKIE = 'locale';

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

export function direction(locale: Locale): 'ltr' | 'rtl' {
  return locale === 'ur' ? 'rtl' : 'ltr';
}

export const resources = {
  en: { common: enCommon },
  ur: { common: urCommon },
} as const;

export const defaultNS = 'common';

/** Creates an isolated, synchronously initialised i18next instance (safe per request on the server). */
export function createI18n(locale: Locale): i18n {
  const instance = i18next.createInstance();
  void instance.use(new ICU()).init({
    lng: locale,
    fallbackLng: DEFAULT_LOCALE,
    resources,
    defaultNS,
    ns: [defaultNS],
    interpolation: { escapeValue: false },
    initAsync: false,
    returnNull: false,
  });
  return instance;
}

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS;
    resources: (typeof resources)['en'];
  }
}
