/**
 * Preview-only routes (design system, stub login) exist in development and in the end-to-end build
 * (`NEXT_PUBLIC_PREVIEW_ROUTES=1`). Real production builds leave them out: they answer 404.
 */
export const PREVIEW_ROUTES =
  process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_PREVIEW_ROUTES === '1';
