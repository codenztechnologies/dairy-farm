/** One exported column: a heading and how to read its value from a row. */
export interface CsvColumn<T> {
  header: string;
  value: (row: T) => string | number | boolean | null | undefined;
}

// A cell that starts with one of these is run as a formula by Excel and Google Sheets
// ("CSV injection"). Farm data includes free text typed by staff and customers, so every text cell
// that could be read as a formula is forced to plain text with a leading apostrophe.
const FORMULA_START = /^[=+\-@\t\r]/;

function cell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '';
  // Real numbers (including negatives) are data, not text: leave them alone.
  let text = String(value);
  if (typeof value === 'string' && FORMULA_START.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/** RFC 4180 CSV with CRLF line endings. */
export function toCsv<T>(columns: readonly CsvColumn<T>[], rows: readonly T[]): string {
  const header = columns.map((column) => cell(column.header)).join(',');
  const lines = rows.map((row) => columns.map((column) => cell(column.value(row))).join(','));
  return [header, ...lines].join('\r\n') + '\r\n';
}

/** Saves CSV text as a file. Adds a byte-order mark so Excel reads Urdu text as UTF-8. */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 0);
}
