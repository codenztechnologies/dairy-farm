import { z } from 'zod';
import { PHONE_LIKE, isEmail } from './validators';

// Messages are i18n keys (catalog namespace `validation`), translated at the edge by the form kit.
// Parameters such as min/max come from the Zod issue itself.

export const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 128;
export const IDENTIFIER_MAX = 254;

/**
 * Sign-in. Deliberately lenient about passwords: the server decides, and the error shown for a wrong
 * identifier or password is always the same generic one (docs/05, no account enumeration).
 */
export const loginSchema = z.strictObject({
  /** Email or mobile number. */
  identifier: z
    .string({ error: 'validation.loginIdentifierRequired' })
    .trim()
    .min(1, 'validation.loginIdentifierRequired')
    .max(IDENTIFIER_MAX, 'validation.tooLong')
    .refine(
      // Empty is already reported as required; do not pile a second message on it.
      (value) => value === '' || isEmail(value) || PHONE_LIKE.test(value),
      'validation.invalidIdentifier',
    ),
  password: z
    .string({ error: 'validation.loginPasswordRequired' })
    .min(1, 'validation.loginPasswordRequired')
    .max(PASSWORD_MAX, 'validation.tooLong'),
});

/** Choosing a new password: length only, no composition rules (docs/05 section 3). Breach check is server-side. */
export const newPasswordSchema = z
  .string({ error: 'validation.required' })
  .min(PASSWORD_MIN, 'validation.passwordTooShort')
  .max(PASSWORD_MAX, 'validation.tooLong');

export type LoginInput = z.infer<typeof loginSchema>;
