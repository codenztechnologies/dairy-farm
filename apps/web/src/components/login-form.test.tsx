import { expectNoA11yViolations, renderWithI18n } from '@dairy/ui/testing';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LoginForm } from './login-form';
import type { SignInResult } from '@/lib/preview-auth';

const ok: SignInResult = { ok: true };
function failure(status: number, code: string, requestId = 'REQ-1'): SignInResult {
  return {
    ok: false,
    problem: { type: 't', title: code, status, code, requestId },
  };
}

function setup(result: SignInResult | Error = ok, locale: 'en' | 'ur' = 'en') {
  const onSignIn = vi.fn(() =>
    result instanceof Error ? Promise.reject(result) : Promise.resolve(result),
  );
  const onSuccess = vi.fn();
  const view = renderWithI18n(<LoginForm onSignIn={onSignIn} onSuccess={onSuccess} />, locale);
  return { onSignIn, onSuccess, ...view };
}

const identifier = () => screen.getByLabelText(/Email or mobile number/);
const password = () => screen.getByLabelText(/^Password/);
const submit = () => screen.getByRole('button', { name: /Sign in/ });

async function fill(id: string, pw: string) {
  await userEvent.type(identifier(), id);
  await userEvent.type(password(), pw);
}

describe('LoginForm validation', () => {
  it('says what to enter when submitted empty, and moves focus to the first problem', async () => {
    const { onSignIn } = setup();
    await userEvent.click(submit());
    expect(await screen.findByText('Enter your email or mobile number.')).toBeInTheDocument();
    expect(screen.getByText('Enter your password.')).toBeInTheDocument();
    expect(onSignIn).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(identifier()).toHaveFocus();
    });
    expect(identifier()).toBeInvalid();
  });

  it('validates when leaving a field, not while typing', async () => {
    setup();
    await userEvent.type(identifier(), 'ali');
    expect(screen.queryByText(/valid email address or mobile number/)).not.toBeInTheDocument();
    await userEvent.tab();
    expect(
      await screen.findByText('Enter a valid email address or mobile number.'),
    ).toBeInTheDocument();
  });

  it('does not show errors for a field the person has not reached', async () => {
    setup();
    await userEvent.type(identifier(), 'ali');
    await userEvent.tab();
    await screen.findByText(/valid email address/);
    expect(screen.queryByText('Enter your password.')).not.toBeInTheDocument();
  });

  it('clears the error once the value is fixed', async () => {
    setup();
    await userEvent.type(identifier(), 'ali');
    await userEvent.tab();
    await screen.findByText(/valid email address/);
    await userEvent.clear(identifier());
    await userEvent.type(identifier(), 'ali@example.com');
    await userEvent.tab();
    await waitFor(() => {
      expect(screen.queryByText(/valid email address/)).not.toBeInTheDocument();
    });
  });
});

describe('LoginForm re-validation', () => {
  it('clears an error as soon as the value is fixed after a failed submit', async () => {
    setup();
    await userEvent.click(submit());
    await screen.findByText('Enter your password.');
    await userEvent.type(password(), 'x');
    await waitFor(() => {
      expect(screen.queryByText('Enter your password.')).not.toBeInTheDocument();
    });
  });

  it('does not scold while typing before any submit', async () => {
    setup();
    await userEvent.type(identifier(), 'a');
    expect(screen.queryByText(/valid email address/)).not.toBeInTheDocument();
  });
});

describe('LoginForm submission', () => {
  it('sends the trimmed identifier and reports success', async () => {
    const { onSignIn, onSuccess } = setup();
    await fill('  ali@example.com ', 'a long enough passphrase');
    await userEvent.click(submit());
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledOnce();
    });
    expect(onSignIn).toHaveBeenCalledWith({
      identifier: 'ali@example.com',
      password: 'a long enough passphrase',
    });
  });

  it('submits with Enter straight after typing, without leaving the last field first', async () => {
    const { onSignIn } = setup();
    await userEvent.type(identifier(), 'ali@example.com');
    await userEvent.tab();
    // Typing the password and pressing Enter never blurs the password field.
    await userEvent.type(password(), 'a long enough passphrase{Enter}');
    await waitFor(() => {
      expect(onSignIn).toHaveBeenCalledOnce();
    });
    expect(screen.queryByText('Enter your password.')).not.toBeInTheDocument();
  });

  it('accepts a Pakistani mobile number', async () => {
    const { onSignIn } = setup();
    await fill('0300 1234567', 'pw');
    await userEvent.click(submit());
    await waitFor(() => {
      expect(onSignIn).toHaveBeenCalled();
    });
  });

  it('shows one generic message for wrong credentials and keeps what was typed', async () => {
    setup(failure(401, 'AUTH_INVALID_CREDENTIALS'));
    await fill('ali@example.com', 'wrong');
    await userEvent.click(submit());
    expect(
      await screen.findByText(
        'That email, number or password is not right. Check it and try again.',
      ),
    ).toBeInTheDocument();
    expect(identifier()).toHaveValue('ali@example.com');
    expect(password()).toHaveValue('wrong');
    // No request id for expected failures: it would only confuse the person.
    expect(screen.queryByText(/Support code/)).not.toBeInTheDocument();
  });

  it('explains rate limiting', async () => {
    setup(failure(429, 'RATE_LIMITED'));
    await fill('ali@example.com', 'x');
    await userEvent.click(submit());
    expect(await screen.findByText(/Too many attempts/)).toBeInTheDocument();
  });

  it('shows the support code for failures on our side', async () => {
    setup(failure(500, 'INTERNAL_ERROR', '7F3A-92'));
    await fill('ali@example.com', 'x');
    await userEvent.click(submit());
    expect(await screen.findByText(/problem on our side/)).toBeInTheDocument();
    expect(screen.getByText('Support code: 7F3A-92')).toBeInTheDocument();
  });

  it('explains a network failure without losing input', async () => {
    setup(new TypeError('Failed to fetch'));
    await fill('ali@example.com', 'x');
    await userEvent.click(submit());
    expect(await screen.findByText(/can't reach the server/)).toBeInTheDocument();
    expect(password()).toHaveValue('x');
  });

  it('can be retried after a failure', async () => {
    const { onSignIn } = setup(failure(401, 'AUTH_INVALID_CREDENTIALS'));
    await fill('ali@example.com', 'x');
    await userEvent.click(submit());
    await screen.findByText(/not right/);
    await userEvent.click(submit());
    await waitFor(() => {
      expect(onSignIn).toHaveBeenCalledTimes(2);
    });
  });

  it('blocks double submission while a request is running', async () => {
    let finish: (value: SignInResult) => void = () => undefined;
    const onSignIn = vi.fn(
      () =>
        new Promise<SignInResult>((resolve) => {
          finish = resolve;
        }),
    );
    renderWithI18n(<LoginForm onSignIn={onSignIn} />);
    await fill('ali@example.com', 'x');
    await userEvent.click(submit());
    const busy = await screen.findByRole('button', { name: /Signing in/ });
    expect(busy).toBeDisabled();
    expect(busy).toHaveAttribute('aria-busy', 'true');
    await userEvent.click(busy);
    expect(onSignIn).toHaveBeenCalledOnce();
    finish(ok);
  });
});

describe('LoginForm password field', () => {
  it('toggles visibility with an accessible control', async () => {
    setup();
    expect(password()).toHaveAttribute('type', 'password');
    await userEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(password()).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Hide password' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('lets password managers and paste work (autocomplete hints, no paste blocking)', async () => {
    setup();
    expect(identifier()).toHaveAttribute('autocomplete', 'username');
    expect(password()).toHaveAttribute('autocomplete', 'current-password');
    await userEvent.click(password());
    await userEvent.paste('pasted-secret');
    expect(password()).toHaveValue('pasted-secret');
  });
});

describe('LoginForm in Urdu', () => {
  it('shows validation messages in Urdu', async () => {
    setup(ok, 'ur');
    await userEvent.click(screen.getByRole('button', { name: /سائن اِن کریں/ }));
    expect(await screen.findByText('اپنا ای میل یا موبائل نمبر درج کریں۔')).toBeInTheDocument();
  });
});

describe('LoginForm accessibility', () => {
  it('has no axe violations, including with errors showing', async () => {
    const { container } = setup();
    await expectNoA11yViolations(container);
    await userEvent.click(submit());
    await screen.findByText('Enter your password.');
    await expectNoA11yViolations(container);
  });
});
