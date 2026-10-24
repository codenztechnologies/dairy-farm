import { cn } from '../lib/cn';

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts.at(-1)?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

/** Initials avatar. The accessible name comes from the surrounding control or the visible name. */
export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    // Initials are generated content (not text): a button that contains the avatar keeps a visible
    // label equal to its accessible name, as WCAG 2.5.3 (label in name) requires.
    <span
      aria-hidden
      data-initials={initialsOf(name)}
      className={cn(
        'grid size-9 shrink-0 place-items-center rounded-full bg-primary-soft text-sm font-semibold text-nav-active-text before:content-[attr(data-initials)]',
        className,
      )}
    />
  );
}
