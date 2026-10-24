import { describe, expect, it } from 'vitest';
import { toCsv } from './csv';

interface Row {
  name: string;
  litres: number | null;
  note?: string;
}

const columns = [
  { header: 'Name', value: (r: Row) => r.name },
  { header: 'Litres', value: (r: Row) => r.litres },
  { header: 'Note', value: (r: Row) => r.note },
];

describe('toCsv', () => {
  it('writes a header, CRLF line endings and a trailing newline', () => {
    const csv = toCsv(columns, [{ name: 'Rani', litres: 18.5, note: 'ok' }]);
    expect(csv).toBe('Name,Litres,Note\r\nRani,18.5,ok\r\n');
  });

  it('quotes cells that contain commas, quotes or line breaks', () => {
    const csv = toCsv(columns, [{ name: 'Rani, "the best"', litres: 1, note: 'line1\nline2' }]);
    expect(csv).toContain('"Rani, ""the best"""');
    expect(csv).toContain('"line1\nline2"');
  });

  it('leaves empty values empty and keeps Urdu text intact', () => {
    const csv = toCsv(columns, [{ name: 'رانی', litres: null }]);
    expect(csv).toBe('Name,Litres,Note\r\nرانی,,\r\n');
  });

  it('neutralises formula injection in text cells', () => {
    for (const evil of [
      '=HYPERLINK("http://evil","x")',
      '+1+1',
      '-2+3',
      '@SUM(A1)',
      '\tcmd',
      '\rcmd',
    ]) {
      const csv = toCsv(columns, [{ name: evil, litres: 1 }]);
      const line = csv.split('\r\n')[1] ?? '';
      expect(line.replace(/^"/, '').startsWith("'")).toBe(true);
    }
  });

  it('does not touch real numbers, including negatives', () => {
    const csv = toCsv(columns, [{ name: 'Adjustment', litres: -3.5 }]);
    expect(csv).toContain('Adjustment,-3.5');
  });

  it('also protects header cells', () => {
    const csv = toCsv([{ header: '=bad', value: () => 'x' }], [{}]);
    expect(csv.startsWith("'=bad")).toBe(true);
  });

  it('handles no rows', () => {
    expect(toCsv(columns, [])).toBe('Name,Litres,Note\r\n');
  });
});
