import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// jsdom lacks several browser APIs that Radix, cmdk and the chart wrapper use. Add them only when missing.
function polyfill(target: object, name: string, value: unknown): void {
  if (!(name in target))
    Object.defineProperty(target, name, { value, configurable: true, writable: true });
}

const noop = (): undefined => undefined;

polyfill(
  globalThis,
  'ResizeObserver',
  class {
    observe = noop;
    unobserve = noop;
    disconnect = noop;
  },
);
polyfill(Element.prototype, 'scrollIntoView', noop);
polyfill(Element.prototype, 'hasPointerCapture', () => false);
polyfill(Element.prototype, 'setPointerCapture', noop);
polyfill(Element.prototype, 'releasePointerCapture', noop);
polyfill(window, 'matchMedia', (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: noop,
  removeEventListener: noop,
  addListener: noop,
  removeListener: noop,
  dispatchEvent: () => false,
}));

afterEach(() => {
  cleanup();
});
