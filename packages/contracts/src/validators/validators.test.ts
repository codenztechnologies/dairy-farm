import { describe, expect, it } from 'vitest';
import {
  DISPLAY_NAME,
  TAG_NUMBER,
  decimalPattern,
  isBusinessDate,
  isEmail,
  isValidPhone,
  toE164,
} from './index';

describe('TAG_NUMBER', () => {
  it.each(['PK-1042', 'a', '1234567890123456-789'])('accepts %s', (value) => {
    expect(TAG_NUMBER.test(value)).toBe(true);
  });
  it.each(['', 'PK 1042', 'PK_1042', '123456789012345678901', 'PK-1042!', "PK'--", 'ٹیگ'])(
    'rejects %j',
    (value) => {
      expect(TAG_NUMBER.test(value)).toBe(false);
    },
  );
});

describe('DISPLAY_NAME', () => {
  it.each(['Rani', 'رانی', 'Ali Raza', "O'Brien", 'Mehek-2'])('accepts %s', (value) => {
    expect(DISPLAY_NAME.test(value)).toBe(true);
  });
  it('rejects empty, control and over-long values', () => {
    expect(DISPLAY_NAME.test('')).toBe(false);
    expect(DISPLAY_NAME.test('a\u0000b')).toBe(false);
    expect(DISPLAY_NAME.test('a‮b')).toBe(false); // bidi override, used to spoof names
    expect(DISPLAY_NAME.test('x'.repeat(81))).toBe(false);
  });
});

describe('phone', () => {
  it('accepts Pakistani mobiles in common formats and normalises to E.164', () => {
    for (const value of ['0300 1234567', '03001234567', '+92 300 1234567', '300-1234567']) {
      expect(isValidPhone(value)).toBe(true);
      expect(toE164(value)).toBe('+923001234567');
    }
  });
  it('rejects too short, lettered and invalid numbers', () => {
    for (const value of ['123', 'abc1234567', '0300 12345', '+92 123 4567890']) {
      expect(isValidPhone(value)).toBe(false);
      expect(toE164(value)).toBeUndefined();
    }
  });
  it('respects the region', () => {
    expect(toE164('020 7946 0958', 'GB')).toBe('+442079460958');
  });
});

describe('email', () => {
  it('accepts normal addresses and rejects obvious mistakes', () => {
    expect(isEmail('ali@example.com')).toBe(true);
    expect(isEmail('ali@example')).toBe(false);
    expect(isEmail('ali @example.com')).toBe(false);
    expect(isEmail('@example.com')).toBe(false);
    expect(isEmail(`${'a'.repeat(250)}@x.com`)).toBe(false);
  });
});

describe('isBusinessDate', () => {
  it('accepts real dates', () => {
    expect(isBusinessDate('2026-10-24')).toBe(true);
    expect(isBusinessDate('2028-02-29')).toBe(true);
  });
  it('rejects impossible and badly shaped dates', () => {
    for (const value of [
      '2026-02-30',
      '2027-02-29',
      '2026-13-01',
      '24-10-2026',
      '2026-10-24T10:00:00Z',
      '',
    ]) {
      expect(isBusinessDate(value)).toBe(false);
    }
  });
});

describe('decimalPattern', () => {
  it('limits decimal places and rejects signs and exponents', () => {
    const money = decimalPattern(2);
    expect(money.test('120')).toBe(true);
    expect(money.test('120.5')).toBe(true);
    expect(money.test('120.55')).toBe(true);
    expect(money.test('120.555')).toBe(false);
    expect(money.test('-1')).toBe(false);
    expect(money.test('1e5')).toBe(false);
    expect(money.test('.5')).toBe(false);
    expect(decimalPattern(0).test('7.5')).toBe(false);
  });
});
