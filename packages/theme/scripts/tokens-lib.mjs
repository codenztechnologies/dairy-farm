// Shared parsing for packages/theme/tokens.css: used by the contrast gate and the generators.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const THEME_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');

export function readTokensCss() {
  return readFileSync(join(THEME_DIR, 'tokens.css'), 'utf8');
}

function blockVars(css, selectorPattern) {
  const vars = {};
  const re = new RegExp(`(?:^|\\n)(${selectorPattern})\\s*\\{([\\s\\S]*?)\\n\\}`, 'g');
  for (const m of css.matchAll(re)) {
    for (const d of m[2].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) vars[d[1]] = d[2].trim();
  }
  return vars;
}

/** Returns raw (unresolved) variable maps for the primitives, light and dark themes. */
export function loadThemes(css = readTokensCss()) {
  const root = blockVars(css, ':root');
  const light = { ...root, ...blockVars(css, `:root,\\s*\\[data-theme=["']light["']\\]`) };
  const dark = { ...light, ...blockVars(css, `\\[data-theme=["']dark["']\\]`) };
  return { root, light, dark };
}

/** Follows var(--x) chains until a literal value. Throws on missing tokens or cycles. */
export function resolve(vars, name, depth = 0) {
  const value = vars[name];
  if (value === undefined) throw new Error(`Missing token ${name}`);
  const ref = /^var\((--[\w-]+)\)$/.exec(value);
  if (ref) {
    if (depth >= 10) throw new Error(`Token reference cycle at ${name}`);
    return resolve(vars, ref[1], depth + 1);
  }
  return value;
}

/** Parses #rgb, #rrggbb, #rrggbbaa, rgb()/rgba() (comma or space syntax). Returns null otherwise. */
export function parseColor(input) {
  const value = input.trim().toLowerCase();
  const hex = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(value);
  if (hex) {
    let h = hex[1];
    if (h.length <= 4) h = [...h].map((c) => c + c).join('');
    const n = (i) => Number.parseInt(h.slice(i, i + 2), 16);
    return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) / 255 : 1 };
  }
  const fn = /^rgba?\(\s*([^)]+)\)$/.exec(value);
  if (fn) {
    const parts = fn[1].split(/[\s,/]+/).filter(Boolean);
    if (parts.length < 3) return null;
    const channel = (p) => (p.endsWith('%') ? (Number.parseFloat(p) / 100) * 255 : Number(p));
    const alpha =
      parts[3] === undefined
        ? 1
        : parts[3].endsWith('%')
          ? Number.parseFloat(parts[3]) / 100
          : Number(parts[3]);
    const [r, g, b] = parts.slice(0, 3).map(channel);
    if ([r, g, b, alpha].some((x) => Number.isNaN(x))) return null;
    return { r, g, b, a: alpha };
  }
  return null;
}

/** Composites a (possibly translucent) colour over an opaque backdrop. */
export function over(fg, backdrop) {
  const a = fg.a;
  return {
    r: fg.r * a + backdrop.r * (1 - a),
    g: fg.g * a + backdrop.g * (1 - a),
    b: fg.b * a + backdrop.b * (1 - a),
    a: 1,
  };
}

export function toHex({ r, g, b }) {
  return `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`;
}

export function toRn({ r, g, b, a }) {
  return a >= 1
    ? toHex({ r, g, b })
    : `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${Number(a.toFixed(3))})`;
}

export function luminance({ r, g, b }) {
  const [R, G, B] = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

export function contrastRatio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
