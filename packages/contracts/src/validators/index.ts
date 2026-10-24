// Every regex used for validation lives here, with tests (CLAUDE.md rule 4).
import { parsePhoneNumberFromString } from 'libphonenumber-js/min';

/** Ear tag number: letters, digits and hyphens, 1 to 20 characters (docs/10 section 4). */
export const TAG_NUMBER = /^[A-Za-z0-9-]{1,20}$/;

/**
 * Names (people, animals, farms): 1 to 80 characters, any language, no control characters.
 * Allows letters from any script (Urdu, Latin), digits, spaces and common punctuation.
 */
export const DISPLAY_NAME = /^[^\p{Cc}\p{Cf}]{1,80}$/u;

/** Phone typed by a person: optional leading +, digits, spaces, hyphens and brackets; 7 to 20 characters. */
export const PHONE_LIKE = /^\+?[\d\s\-()]{7,20}$/;

/** Pragmatic email check. The real proof of ownership is the confirmation link, not the regex. */
export const EMAIL_LIKE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Plain business date, never a timestamp: YYYY-MM-DD. */
export const BUSINESS_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Decimal as a string with at most `decimals` places, no exponent, no sign. */
export function decimalPattern(decimals: number): RegExp {
  return decimals === 0 ? /^\d+$/ : new RegExp(`^\\d+(\\.\\d{1,${String(decimals)}})?$`);
}

export function isEmail(value: string): boolean {
  return value.length <= 254 && EMAIL_LIKE.test(value);
}

/** True for a number libphonenumber accepts for the given default region (Pakistan unless told otherwise). */
export function isValidPhone(
  value: string,
  region: 'PK' | 'IN' | 'BD' | 'AE' | 'SA' | 'GB' | 'US' = 'PK',
): boolean {
  return PHONE_LIKE.test(value) && (parsePhoneNumberFromString(value, region)?.isValid() ?? false);
}

/** Normalises a valid phone to E.164, or returns undefined. */
export function toE164(
  value: string,
  region: 'PK' | 'IN' | 'BD' | 'AE' | 'SA' | 'GB' | 'US' = 'PK',
): string | undefined {
  const parsed = PHONE_LIKE.test(value) ? parsePhoneNumberFromString(value, region) : undefined;
  return parsed?.isValid() ? parsed.number : undefined;
}

/** True for a real calendar date written as YYYY-MM-DD (rejects 2026-02-31). */
export function isBusinessDate(value: string): boolean {
  if (!BUSINESS_DATE.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number) as [number, number, number];
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}
