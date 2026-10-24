// PREVIEW ONLY. Stands in for the sign-in API until the account system exists (epic E0.4),
// so every state of the login screen can be reviewed. It never creates a session, and the
// login route is hidden in production builds. Delete this file when the real client lands.
import type { LoginInput, Problem } from '@dairy/contracts';

export type SignInResult = { ok: true } | { ok: false; problem: Problem };

function problem(status: number, code: string, requestId: string, detail?: string): Problem {
  return {
    type: `https://errors.dairy.invalid/${code.toLowerCase()}`,
    title: code,
    status,
    code,
    requestId,
    ...(detail ? { detail } : {}),
  };
}

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * Reviewer shortcuts: typing one of these as the password triggers that failure.
 * Anything else "succeeds" so the success state can be reviewed.
 */
export async function previewSignIn(values: LoginInput): Promise<SignInResult> {
  await wait(900);
  switch (values.password) {
    case 'wrong-password':
      return { ok: false, problem: problem(401, 'AUTH_INVALID_CREDENTIALS', 'PREVIEW-401') };
    case 'rate-limit':
      return { ok: false, problem: problem(429, 'RATE_LIMITED', 'PREVIEW-429') };
    case 'server-error':
      return { ok: false, problem: problem(500, 'INTERNAL_ERROR', '7F3A-92') };
    case 'offline':
      throw new TypeError('Failed to fetch');
    default:
      return { ok: true };
  }
}
