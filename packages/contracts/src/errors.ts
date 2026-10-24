import { z } from 'zod';

/** One field-level problem inside a problem+json response (docs/01 section 6). */
export const fieldErrorSchema = z.strictObject({
  /** Dotted path of the field, e.g. "identifier" or "items.0.litres". */
  field: z.string().min(1),
  /** Stable machine code, e.g. "TAG_TAKEN". */
  code: z.string().min(1),
  /** Localised human message that says how to fix it. */
  message: z.string().min(1),
});

/** RFC 9457 problem details as returned by every API error. */
export const problemSchema = z.strictObject({
  type: z.string(),
  title: z.string(),
  status: z.number().int().min(400).max(599),
  /** Stable code clients branch on, e.g. "AUTH_INVALID_CREDENTIALS". */
  code: z.string().min(1),
  detail: z.string().optional(),
  /** Quote this to support (also sent as X-Request-Id). */
  requestId: z.string().min(1),
  errors: z.array(fieldErrorSchema).optional(),
});

export type FieldError = z.infer<typeof fieldErrorSchema>;
export type Problem = z.infer<typeof problemSchema>;
