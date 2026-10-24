import axe from 'axe-core';
import { expect } from 'vitest';

/**
 * Runs axe on a rendered container and fails with a readable list of violations.
 * jsdom has no layout, so colour contrast is checked separately by the theme contrast gate.
 */
export async function expectNoA11yViolations(container: Element): Promise<void> {
  const results = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
  });
  const summary = results.violations.map(
    (violation) =>
      `${violation.id}: ${violation.help}\n  ${violation.nodes.map((node) => node.html.slice(0, 120)).join('\n  ')}`,
  );
  expect(summary, summary.join('\n')).toEqual([]);
}
