import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Droplet } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithI18n } from '../test/render';
import { Banner } from './banner';
import { Button } from './button';
import { Field, TextInput } from './field';
import { KpiCard } from './kpi-card';
import { EmptyState, ErrorState, FilteredEmptyState } from './states';
import { StatusChip } from './status-chip';

describe('Button', () => {
  it('fires onClick', async () => {
    const onClick = vi.fn();
    renderWithI18n(<Button onClick={onClick}>Go</Button>);
    await userEvent.click(screen.getByRole('button', { name: 'Go' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('blocks clicks and announces busy while loading', async () => {
    const onClick = vi.fn();
    renderWithI18n(
      <Button loading loadingLabel="Saving" onClick={onClick}>
        Save
      </Button>,
    );
    const button = screen.getByRole('button', { name: /Save/ });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('defaults to type=button so it never submits a form by accident', () => {
    renderWithI18n(<Button>Go</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });
});

describe('Field + TextInput', () => {
  it('links label, helper and error to the input', () => {
    renderWithI18n(
      <Field
        label="Tag number"
        helper="Printed on the tag"
        error="Use letters and numbers"
        required
      >
        <TextInput />
      </Field>,
    );
    const input = screen.getByLabelText(/Tag number/);
    expect(input).toBeRequired();
    expect(input).toBeInvalid();
    expect(input).toHaveAccessibleDescription('Use letters and numbers Printed on the tag');
    expect(screen.getByRole('alert')).toHaveTextContent('Use letters and numbers');
  });

  it('marks optional fields as optional', () => {
    renderWithI18n(
      <Field label="Notes">
        <TextInput />
      </Field>,
    );
    expect(screen.getByText('(optional)')).toBeInTheDocument();
  });
});

describe('State components', () => {
  it('ErrorState shows the support code and retries', async () => {
    const onRetry = vi.fn();
    renderWithI18n(<ErrorState requestId="7F3A-92" onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Support code: 7F3A-92')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('EmptyState renders its action', () => {
    renderWithI18n(
      <EmptyState title="No animals yet" body="Add one" action={<Button>Add</Button>} />,
    );
    expect(screen.getByRole('heading', { name: 'No animals yet' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
  });

  it('FilteredEmptyState clears filters', async () => {
    const onClear = vi.fn();
    renderWithI18n(<FilteredEmptyState onClear={onClear} />);
    await userEvent.click(screen.getByRole('button', { name: 'Clear all filters' }));
    expect(onClear).toHaveBeenCalledOnce();
  });
});

describe('StatusChip', () => {
  it('always has text, not just colour', () => {
    renderWithI18n(<StatusChip status="lactating" />);
    expect(screen.getByText('Lactating')).toBeInTheDocument();
  });

  it('is translated', () => {
    renderWithI18n(<StatusChip status="dry" />, 'ur');
    expect(screen.getByText('خشک')).toBeInTheDocument();
  });
});

describe('KpiCard', () => {
  it('puts the value first and describes the delta in words for screen readers', () => {
    renderWithI18n(
      <KpiCard
        label="Today's milk"
        value="1,284 L"
        icon={Droplet}
        tint="blue"
        delta={{ percent: 5.2, direction: 'up', formatted: '5.2%' }}
        comparison="vs yesterday"
      />,
    );
    expect(screen.getByText('1,284 L')).toBeInTheDocument();
    expect(screen.getByText('Up 5.2 percent')).toBeInTheDocument();
    expect(screen.getByText('vs yesterday')).toBeInTheDocument();
  });
});

describe('Banner', () => {
  it('uses alert for danger and status for info', () => {
    renderWithI18n(
      <>
        <Banner tone="danger">Failed</Banner>
        <Banner tone="info">FYI</Banner>
      </>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Failed');
    expect(screen.getByRole('status')).toHaveTextContent('FYI');
  });

  it('can be dismissed', async () => {
    const onDismiss = vi.fn();
    renderWithI18n(<Banner onDismiss={onDismiss}>Hi</Banner>);
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
