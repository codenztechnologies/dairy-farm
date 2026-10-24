import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Droplet } from 'lucide-react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { CommandPalette, useCommandShortcut } from '../shell/palette';
import { NotificationCenter, OfflineBanner, SyncPill } from '../shell/status';
import { expectNoA11yViolations } from '../test/axe';
import { renderWithI18n } from '../test/render';
import { Banner } from './banner';
import { Button } from './button';
import { HealthScoreRing, MiniTable, Timeline } from './data-display';
import { Accordion, FormSummary, Stepper } from './disclosure';
import { Field, TextInput } from './field';
import { FileUpload } from './file-upload';
import { KpiCard } from './kpi-card';
import { ConfirmDialog, Dialog } from './overlays';
import { Combobox, DatePicker, MultiSelect, PhoneInput } from './pickers';
import { ErrorState } from './states';
import { StatusChip } from './status-chip';

const OPTIONS = [
  { value: 'a1', label: 'PK-1042 Rani', hint: 'Lactating herd' },
  { value: 'a2', label: 'PK-1049 Lali', hint: 'Dry cows' },
];

describe('DatePicker', () => {
  it('returns a plain YYYY-MM-DD business date with no time-zone shift', async () => {
    const onChange = vi.fn();
    renderWithI18n(
      <Field label="Date">
        <DatePicker value="2026-03-10" onValueChange={onChange} placeholder="Choose" />
      </Field>,
    );
    await userEvent.click(screen.getByRole('button', { name: /Date.*Mar 10, 2026/ }));
    await userEvent.click(screen.getByRole('button', { name: /March 15th, 2026/ }));
    expect(onChange).toHaveBeenCalledWith('2026-03-15');
  });

  it('can be cleared and respects max', async () => {
    const onChange = vi.fn();
    renderWithI18n(
      <DatePicker
        value="2026-03-10"
        onValueChange={onChange}
        placeholder="Choose"
        max="2026-03-12"
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /Mar/ }));
    expect(screen.getByRole('button', { name: /March 20th, 2026/ })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Clear date' }));
    expect(onChange).toHaveBeenCalledWith(undefined);
  });
});

describe('PhoneInput', () => {
  it('emits E.164 only for a valid number', async () => {
    const onChange = vi.fn();
    renderWithI18n(
      <Field label="Mobile">
        <PhoneInput value="" onValueChange={onChange} />
      </Field>,
    );
    const input = screen.getByLabelText(/Mobile/);
    await userEvent.type(input, '300 1234567');
    expect(onChange).toHaveBeenLastCalledWith('+923001234567');
    await userEvent.clear(input);
    await userEvent.type(input, '123');
    expect(onChange).toHaveBeenLastCalledWith('');
  });

  it('strips letters from the number', async () => {
    renderWithI18n(
      <Field label="Mobile">
        <PhoneInput value="" onValueChange={() => undefined} />
      </Field>,
    );
    const input = screen.getByLabelText(/Mobile/);
    await userEvent.type(input, '03a00');
    expect(input).toHaveValue('0300');
  });
});

describe('Combobox', () => {
  it('filters static options locally and selects one', async () => {
    const onChange = vi.fn();
    renderWithI18n(
      <Combobox
        value={undefined}
        onValueChange={onChange}
        placeholder="Choose"
        searchPlaceholder="Search"
        options={OPTIONS}
      />,
    );
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.type(screen.getByPlaceholderText('Search'), 'lali');
    expect(screen.queryByText('PK-1042 Rani')).not.toBeInTheDocument();
    await userEvent.click(screen.getByText('PK-1049 Lali'));
    expect(onChange).toHaveBeenCalledWith('a2', OPTIONS[1]);
  });

  it('shows loading, then results, and ignores answers for older queries', async () => {
    const resolvers: Record<string, () => void> = {};
    const loadOptions = vi.fn(
      (query: string) =>
        new Promise<typeof OPTIONS>((resolve) => {
          resolvers[query] = () => {
            resolve(OPTIONS.filter((o) => o.label.toLowerCase().includes(query)));
          };
        }),
    );
    renderWithI18n(
      <Combobox
        value={undefined}
        onValueChange={() => undefined}
        placeholder="Choose"
        searchPlaceholder="Search"
        loadOptions={loadOptions}
      />,
    );
    await userEvent.click(screen.getByRole('combobox'));
    await waitFor(() => {
      expect(loadOptions).toHaveBeenCalledWith('');
    });
    await userEvent.type(screen.getByPlaceholderText('Search'), 'lali');
    await waitFor(() => {
      expect(loadOptions).toHaveBeenCalledWith('lali');
    });
    // The slow answer for the first query arrives after the newer one is requested: it must not show.
    act(() => {
      resolvers.lali?.();
    });
    expect(await screen.findByText('PK-1049 Lali')).toBeInTheDocument();
    act(() => {
      resolvers['']?.();
    });
    expect(screen.queryByText('PK-1042 Rani')).not.toBeInTheDocument();
  });

  it('says so when the server request fails', async () => {
    renderWithI18n(
      <Combobox
        value={undefined}
        onValueChange={() => undefined}
        placeholder="Choose"
        searchPlaceholder="Search"
        loadOptions={() => Promise.reject(new Error('offline'))}
      />,
    );
    await userEvent.click(screen.getByRole('combobox'));
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load the list');
  });
});

describe('MultiSelect', () => {
  it('adds and removes values as chips', async () => {
    function Wrapper() {
      const [value, setValue] = useState<string[]>(['a1']);
      return (
        <MultiSelect
          value={value}
          onValueChange={setValue}
          placeholder="Choose groups"
          searchPlaceholder="Search"
          options={OPTIONS}
        />
      );
    }
    renderWithI18n(<Wrapper />);
    expect(screen.getByText('PK-1042 Rani')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByText('PK-1049 Lali'));
    await userEvent.keyboard('{Escape}');
    await userEvent.click(screen.getByRole('button', { name: 'Remove PK-1042 Rani' }));
    expect(screen.queryByText('PK-1042 Rani')).not.toBeInTheDocument();
    expect(screen.getByText('PK-1049 Lali')).toBeInTheDocument();
  });
});

describe('FileUpload', () => {
  it('accepts valid files and reports rejected ones with a reason', async () => {
    const onFiles = vi.fn();
    const onProblems = vi.fn();
    renderWithI18n(
      <Field label="Photos">
        <FileUpload
          files={[]}
          onFilesChange={onFiles}
          onProblems={onProblems}
          accept="image/*"
          maxSizeBytes={1000}
        />
      </Field>,
    );
    const input = screen.getByLabelText(/Choose photos/);
    const ok = new File(['x'], 'cow.png', { type: 'image/png' });
    const wrongType = new File(['x'], 'notes.pdf', { type: 'application/pdf' });
    const tooBig = new File([new Uint8Array(2000)], 'big.png', { type: 'image/png' });
    await userEvent.upload(input, [ok, wrongType, tooBig], { applyAccept: false });
    expect(onFiles).toHaveBeenCalledWith([ok]);
    expect(onProblems).toHaveBeenCalledWith([
      { name: 'notes.pdf', reason: 'type' },
      { name: 'big.png', reason: 'size' },
    ]);
  });

  it('lets a chosen file be removed', async () => {
    const onFiles = vi.fn();
    const file = new File(['x'], 'cow.png', { type: 'image/png' });
    renderWithI18n(<FileUpload files={[file]} onFilesChange={onFiles} />);
    await userEvent.click(screen.getByRole('button', { name: 'Remove cow.png' }));
    expect(onFiles).toHaveBeenCalledWith([]);
  });
});

describe('Form helpers', () => {
  it('FormSummary lists problems, links to fields and takes focus', async () => {
    renderWithI18n(
      <>
        <FormSummary issues={[{ fieldId: 'tag', label: 'Tag number', message: 'Too long' }]} />
        <input id="tag" aria-label="tag" />
      </>,
    );
    const alert = screen.getByRole('alert');
    expect(alert).toHaveFocus();
    expect(alert).toHaveTextContent('Fix 1 problem before saving');
    await userEvent.click(screen.getByRole('link', { name: 'Tag number' }));
    expect(screen.getByLabelText('tag')).toHaveFocus();
  });

  it('FormSummary renders nothing without issues', () => {
    renderWithI18n(<FormSummary issues={[]} />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('Stepper marks the current step', () => {
    renderWithI18n(
      <Stepper
        current={1}
        steps={[
          { id: 'a', label: 'Basics' },
          { id: 'b', label: 'Status' },
        ]}
      />,
    );
    expect(screen.getByText('Status').closest('li')).toHaveAttribute('aria-current', 'step');
    expect(screen.getByText('completed')).toBeInTheDocument();
  });

  it('Accordion opens and closes a section', async () => {
    renderWithI18n(<Accordion items={[{ value: 'a', title: 'Question', content: 'Answer' }]} />);
    await userEvent.click(screen.getByRole('button', { name: 'Question' }));
    expect(screen.getByText('Answer')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Question' }));
    expect(screen.queryByText('Answer')).not.toBeInTheDocument();
  });
});

describe('Data display', () => {
  it('HealthScoreRing exposes value and the band in words', () => {
    renderWithI18n(<HealthScoreRing score={34} label="Farm health score" />);
    const meter = screen.getByRole('meter', { name: 'Farm health score' });
    expect(meter).toHaveAttribute('aria-valuenow', '34');
    expect(meter).toHaveAttribute('aria-valuetext', '34, Needs attention');
  });

  it('HealthScoreRing clamps out-of-range scores', () => {
    renderWithI18n(<HealthScoreRing score={140} label="Score" />);
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '100');
  });

  it('MiniTable aligns numeric columns to the end and shows the empty slot', () => {
    const { rerender } = renderWithI18n(
      <MiniTable
        title="Top animals"
        rows={[{ id: '1', tag: 'PK-1', avg: '24.5' }]}
        getRowId={(r) => r.id}
        columns={[
          { key: 'tag', label: 'Animal', render: (r) => r.tag },
          { key: 'avg', label: 'Avg', numeric: true, render: (r) => r.avg },
        ]}
      />,
    );
    expect(screen.getByText('24.5').closest('td')).toHaveClass('text-end');
    rerender(
      <MiniTable
        title="Top animals"
        rows={[]}
        getRowId={(r: { id: string }) => r.id}
        columns={[]}
        empty={<p>Nothing yet</p>}
      />,
    );
    expect(screen.getByText('Nothing yet')).toBeInTheDocument();
  });

  it('Timeline renders events in order', () => {
    renderWithI18n(
      <Timeline
        events={[
          { id: '1', title: 'Calved', time: '24 Oct', icon: Droplet },
          { id: '2', title: 'Vaccinated', time: '12 Oct', icon: Droplet },
        ]}
      />,
    );
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Calved');
    expect(items[1]).toHaveTextContent('Vaccinated');
  });
});

describe('Status and notifications', () => {
  it('SyncPill always includes words', () => {
    renderWithI18n(<SyncPill status="pending" pendingCount={3} />);
    expect(screen.getByText('3 entries waiting to sync')).toBeInTheDocument();
  });

  it('OfflineBanner mentions queued entries', () => {
    renderWithI18n(<OfflineBanner pendingCount={1} />);
    expect(screen.getByRole('alert')).toHaveTextContent('1 entry waiting to sync');
  });

  it('NotificationCenter counts unread in its name and can mark all read', async () => {
    const onMarkAll = vi.fn();
    renderWithI18n(
      <NotificationCenter
        onMarkAllRead={onMarkAll}
        items={[
          { id: '1', title: 'Vaccination due', time: '1 min ago', unread: true },
          { id: '2', title: 'Low stock', time: '2 h ago', unread: false },
        ]}
      />,
    );
    const bell = screen.getByRole('button', { name: /Notifications: 1 new notification/ });
    await userEvent.click(bell);
    await userEvent.click(screen.getByRole('button', { name: 'Mark all as read' }));
    expect(onMarkAll).toHaveBeenCalledOnce();
    expect(screen.getByText('Unread')).toBeInTheDocument();
  });
});

describe('CommandPalette', () => {
  const groups = [
    {
      heading: 'Go to',
      items: [
        { id: 'd', label: 'Dashboard', onSelect: vi.fn() },
        { id: 'a', label: 'Animals', hint: 'Herd', onSelect: vi.fn() },
      ],
    },
  ];

  it('filters, runs the chosen command and closes', async () => {
    const onOpenChange = vi.fn();
    renderWithI18n(
      <CommandPalette open onOpenChange={onOpenChange} groups={groups} placeholder="Search" />,
    );
    await userEvent.type(screen.getByPlaceholderText('Search'), 'anim');
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    await userEvent.click(screen.getByText('Animals'));
    expect(groups[0]?.items[1]?.onSelect).toHaveBeenCalledOnce();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows a helpful empty message', async () => {
    renderWithI18n(
      <CommandPalette open onOpenChange={() => undefined} groups={groups} placeholder="Search" />,
    );
    await userEvent.type(screen.getByPlaceholderText('Search'), 'zzzz');
    expect(screen.getByText(/No results/)).toBeInTheDocument();
  });

  it('Ctrl+K toggles via the shortcut hook', async () => {
    const onToggle = vi.fn();
    function Probe() {
      useCommandShortcut(onToggle);
      return null;
    }
    renderWithI18n(<Probe />);
    await userEvent.keyboard('{Control>}k{/Control}');
    expect(onToggle).toHaveBeenCalledOnce();
  });
});

describe('Accessibility (axe)', () => {
  it('has no violations in common building blocks', async () => {
    const { container } = renderWithI18n(
      <main>
        <h1>Page</h1>
        <Button variant="primary">Save</Button>
        <Field label="Tag number" helper="Printed on the tag" error="Too long" required>
          <TextInput />
        </Field>
        <StatusChip status="sick" />
        <KpiCard
          label="Milk"
          value="12 L"
          icon={Droplet}
          tint="blue"
          delta={{ percent: 5, direction: 'up', formatted: '5%' }}
        />
        <Banner tone="warning">Careful</Banner>
        <ErrorState requestId="AB-1" onRetry={() => undefined} />
        <HealthScoreRing score={70} label="Farm health score" />
        <Stepper current={0} steps={[{ id: 'a', label: 'One' }]} />
        <Accordion items={[{ value: 'a', title: 'Q', content: 'A' }]} />
        <SyncPill status="synced" />
      </main>,
    );
    await expectNoA11yViolations(container);
  });

  it('has no violations in open dialogs', async () => {
    renderWithI18n(
      <>
        <Dialog open onOpenChange={() => undefined} title="Add a note" description="Visible to all">
          <Field label="Note">
            <TextInput />
          </Field>
        </Dialog>
      </>,
    );
    await expectNoA11yViolations(document.body);
  });

  it('has no violations in a confirm dialog', async () => {
    renderWithI18n(
      <ConfirmDialog
        open
        onOpenChange={() => undefined}
        title="Delete?"
        description="Cannot be undone"
        confirmLabel="Delete"
        onConfirm={() => undefined}
      />,
    );
    await expectNoA11yViolations(document.body);
  });

  it('has no violations in pickers', async () => {
    const { container } = renderWithI18n(
      <main>
        <Field label="Date">
          <DatePicker value={undefined} onValueChange={() => undefined} placeholder="Choose" />
        </Field>
        <Field label="Animal">
          <Combobox
            value={undefined}
            onValueChange={() => undefined}
            placeholder="Choose"
            searchPlaceholder="Search"
            options={OPTIONS}
          />
        </Field>
        <Field label="Photos">
          <FileUpload files={[]} onFilesChange={() => undefined} />
        </Field>
      </main>,
    );
    await expectNoA11yViolations(container);
  });
});
