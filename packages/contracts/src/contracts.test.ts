import { describe, expect, it } from 'vitest';
import { loginSchema, newPasswordSchema, PASSWORD_MAX } from './auth';
import { problemSchema } from './errors';

function messages(result: {
  success: boolean;
  error?: { issues: { message: string }[] };
}): string[] {
  return result.success ? [] : (result.error?.issues.map((i) => i.message) ?? []);
}

describe('loginSchema', () => {
  it('accepts an email or a phone number and trims the identifier', () => {
    expect(loginSchema.parse({ identifier: '  ali@example.com ', password: 'x' }).identifier).toBe(
      'ali@example.com',
    );
    expect(loginSchema.safeParse({ identifier: '0300 1234567', password: 'x' }).success).toBe(true);
  });

  it('reports required fields with i18n keys', () => {
    expect(messages(loginSchema.safeParse({ identifier: '', password: '' }))).toEqual([
      'validation.loginIdentifierRequired',
      'validation.loginPasswordRequired',
    ]);
  });

  it('rejects an identifier that is neither email nor phone', () => {
    expect(messages(loginSchema.safeParse({ identifier: 'ali', password: 'x' }))).toEqual([
      'validation.invalidIdentifier',
    ]);
  });

  it('rejects unknown keys (strict) so extra fields cannot be smuggled in', () => {
    const result = loginSchema.safeParse({ identifier: 'a@b.co', password: 'x', isAdmin: true });
    expect(result.success).toBe(false);
  });

  it('rejects over-long passwords but not short ones (the server judges those)', () => {
    expect(loginSchema.safeParse({ identifier: 'a@b.co', password: 'x' }).success).toBe(true);
    expect(
      loginSchema.safeParse({ identifier: 'a@b.co', password: 'x'.repeat(PASSWORD_MAX + 1) })
        .success,
    ).toBe(false);
  });

  it('rejects non-string input without throwing', () => {
    expect(loginSchema.safeParse({ identifier: 42, password: null }).success).toBe(false);
    expect(loginSchema.safeParse(undefined).success).toBe(false);
  });
});

describe('newPasswordSchema', () => {
  it('requires at least 10 characters and nothing else', () => {
    expect(messages(newPasswordSchema.safeParse('short'))).toEqual(['validation.passwordTooShort']);
    expect(newPasswordSchema.safeParse('aaaaaaaaaa').success).toBe(true);
    expect(newPasswordSchema.safeParse('correct horse battery staple').success).toBe(true);
  });
});

describe('problemSchema', () => {
  it('accepts the standard envelope with field errors', () => {
    const problem = {
      type: 'https://errors.example/validation',
      title: 'Validation failed',
      status: 400,
      code: 'VALIDATION_FAILED',
      requestId: '7F3A-92',
      errors: [
        { field: 'identifier', code: 'REQUIRED', message: 'Enter your email or mobile number.' },
      ],
    };
    expect(problemSchema.parse(problem)).toEqual(problem);
  });

  it('rejects non-error statuses and missing request ids', () => {
    expect(
      problemSchema.safeParse({ type: 't', title: 't', status: 200, code: 'X', requestId: 'r' })
        .success,
    ).toBe(false);
    expect(problemSchema.safeParse({ type: 't', title: 't', status: 500, code: 'X' }).success).toBe(
      false,
    );
  });
});
