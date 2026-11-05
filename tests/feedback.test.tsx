import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRef, useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ActorBadge } from '@/components/ui/actor-badge';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { ConfirmDialog, ConfirmDialogHost, confirm } from '@/components/ui/confirm-dialog';
import { Link } from '@/components/ui/link';
import { PageHeader } from '@/components/ui/page-header';
import { QueryState, QueryTableState } from '@/components/ui/query-state';
import { QuickTip } from '@/components/ui/quick-tip';
import { SpotlightCallout, SpotlightTour } from '@/components/ui/spotlight';
import { StatusBadge, statusHue } from '@/components/ui/status-badge';
import { Steps } from '@/components/ui/steps';
import { Table, TableBody } from '@/components/ui/table';
import { Tile } from '@/components/ui/tile';

// jsdom lacks a few things Base UI reaches for
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
Element.prototype.scrollIntoView ??= function () {};
globalThis.matchMedia ??= ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener() {},
  removeListener() {},
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent: () => false,
})) as typeof globalThis.matchMedia;

describe('QueryState', () => {
  it('shows loading, not the page or an empty state, while pending', () => {
    render(
      <QueryState query={{ status: 'pending' }} isEmpty empty="No permits">
        {() => <p>Permit list</p>}
      </QueryState>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Loading…');
    expect(screen.queryByText('Permit list')).not.toBeInTheDocument();
    expect(screen.queryByText('No permits')).not.toBeInTheDocument();
  });

  it('shows a failure with the reason and a working Try again', async () => {
    const refetch = vi.fn();
    render(
      <QueryState query={{ status: 'error', error: new Error('Timed out'), refetch }} what="the permits" isEmpty empty="No permits">
        {() => <p>Permit list</p>}
      </QueryState>,
    );
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Couldn’t load the permits.');
    expect(alert).toHaveTextContent('Timed out');
    expect(screen.queryByText('No permits')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(refetch).toHaveBeenCalledOnce();
  });

  it('shows empty only after success, and the page otherwise; explicit props work too', () => {
    const { rerender } = render(
      <QueryState status="success" isEmpty empty="No permits">
        {() => <p>Permit list</p>}
      </QueryState>,
    );
    expect(screen.getByText('No permits')).toBeInTheDocument();
    rerender(<QueryState status="success">{() => <p>Permit list</p>}</QueryState>);
    expect(screen.getByText('Permit list')).toBeInTheDocument();
  });

  it('renders one spanning table row for each state, and nothing when there are rows', () => {
    const table = (ui: React.ReactNode) => (
      <Table>
        <TableBody>{ui}</TableBody>
      </Table>
    );
    const { rerender, container } = render(
      table(<QueryTableState status="error" error="Server error" colSpan={4} isEmpty empty="No permits match." what="the permits" />),
    );
    expect(container.querySelector('td')).toHaveAttribute('colspan', '4');
    expect(screen.getByRole('alert')).toHaveTextContent('Couldn’t load the permits. Server error');
    rerender(table(<QueryTableState status="success" colSpan={4} isEmpty empty="No permits match." />));
    expect(screen.getByText('No permits match.')).toBeInTheDocument();
    rerender(table(<QueryTableState status="success" colSpan={4} isEmpty={false} empty="No permits match." />));
    expect(container.querySelector('[data-slot=query-table-state]')).toBeNull();
  });
});

describe('StatusBadge', () => {
  it('maps org hues onto GovWell tints with a square dot', () => {
    render(<StatusBadge status={{ name: 'In review', color: 'Blue' }} />);
    const badge = screen.getByText('In review');
    expect(badge).toHaveAttribute('data-hue', 'sky');
    expect(badge).toHaveClass('bg-sky-tint');
    expect(badge.querySelector('[data-slot=status-badge-dot]')).toHaveClass('bg-info', 'size-2');
    expect(statusHue('emerald')).toBe('field');
    expect(statusHue('chartreuse')).toBe('ash');
  });

  it('says Draft when there is no status', () => {
    render(<StatusBadge status={null} />);
    expect(screen.getByText('Draft')).toHaveClass('border-dashed');
  });
});

describe('ActorBadge', () => {
  it('shows a person by initials and speaks the kind before the name', () => {
    render(<ActorBadge type="person" name="Dana Whitfield" />);
    expect(screen.getByText('DW')).toBeInTheDocument();
    expect(document.querySelector('[data-slot=actor-badge]')).toHaveTextContent('Person: Dana Whitfield');
  });

  it('shows a machine actor on its tint, named by kind when unnamed', () => {
    const { container } = render(
      <>
        <ActorBadge type="ai" name="Intake assistant" />
        <ActorBadge type="system" />
      </>,
    );
    const [ai, system] = container.querySelectorAll('[data-slot=actor-badge]');
    expect(ai!.querySelector('[data-slot=actor-badge-icon]')).toHaveClass('bg-hope-tint');
    expect(ai).toHaveTextContent('AI assistant: Intake assistant');
    expect(system).toHaveTextContent(/^System$/);
  });
});

describe('Spotlight', () => {
  it('rings the target, labels a section, and cleans up on Escape', async () => {
    function Demo() {
      const ref = useRef<HTMLDivElement>(null);
      const [open, setOpen] = useState(true);
      return (
        <>
          <div ref={ref} className="border" data-testid="fees">
            Fees
          </div>
          <SpotlightCallout target={ref} kind="section" label="Fees" open={open} onOpenChange={setOpen}>
            What is due on this permit.
          </SpotlightCallout>
        </>
      );
    }
    render(<Demo />);
    const callout = await screen.findByRole('dialog');
    expect(callout).toHaveTextContent('What is due on this permit.');
    const target = screen.getByTestId('fees');
    expect(target).toHaveClass('outline-primary', 'border');
    expect(target).toHaveAttribute('data-spotlight-label', 'Fees');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    // our classes go; the target's own stay
    expect(target).not.toHaveClass('outline-primary');
    expect(target).toHaveClass('border');
    expect(target).not.toHaveAttribute('data-spotlight-label');
  });

  it('does not dismiss on an outside click', async () => {
    const onOpenChange = vi.fn();
    render(
      <>
        <button type="button">Elsewhere</button>
        <div id="submit">Submit</div>
        <SpotlightCallout target="#submit" label="Submit" onOpenChange={onOpenChange} />
      </>,
    );
    await screen.findByRole('dialog');
    await userEvent.click(screen.getByRole('button', { name: 'Elsewhere' }));
    expect(onOpenChange).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Got it' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('waits for a selector, then reports a missing target', async () => {
    vi.useFakeTimers();
    const onMissing = vi.fn();
    render(<SpotlightCallout target="#nowhere" label="Nowhere" waitFor={500} onTargetMissing={onMissing} />);
    await act(async () => {
      vi.advanceTimersByTime(700);
    });
    expect(onMissing).toHaveBeenCalledOnce();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it('steps through a tour with Next, Back and Done', async () => {
    const onFinish = vi.fn();
    render(
      <>
        <div id="a">Applicant</div>
        <div id="b">Fees</div>
        <SpotlightTour
          title="Completing an application"
          onFinish={onFinish}
          steps={[
            { target: '#a', label: 'Applicant', body: 'Who applied.' },
            { target: '#b', label: 'Fees', body: 'What is due.' },
          ]}
        />
      </>,
    );
    expect(await screen.findByText('Step 1 of 2')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('Step 2 of 2')).toBeInTheDocument();
    expect(screen.getByText('What is due.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(await screen.findByText('Step 1 of 2')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Done' }));
    expect(onFinish).toHaveBeenCalledOnce();
  });
});

describe('ConfirmDialog', () => {
  it('focuses Cancel, shows destructive styling, and stays pending until the action settles', async () => {
    let finish!: () => void;
    const onConfirm = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)));
    render(
      <ConfirmDialog
        trigger={<Button>Void permit</Button>}
        title="Void BLD-2026-0142?"
        details={['2 inspections are cancelled']}
        confirmLabel="Void"
        destructive
        onConfirm={onConfirm}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Void permit' }));
    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toHaveTextContent('2 inspections are cancelled');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus());
    const action = screen.getByRole('button', { name: 'Void' });
    expect(action).toHaveClass('bg-destructive');
    await userEvent.click(action);
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(action).toBeDisabled();
    expect(action).toHaveAttribute('aria-busy', 'true');
    // Escape can't close it while pending
    await userEvent.keyboard('{Escape}');
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    await act(async () => finish());
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
  });

  it('stays open and says why when the action fails', async () => {
    render(
      <ConfirmDialog
        defaultOpen
        title="Issue licence?"
        confirmLabel="Issue"
        onConfirm={() => Promise.reject(new Error('Fees are still due.'))}
      />,
    );
    await userEvent.click(await screen.findByRole('button', { name: 'Issue' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Fees are still due.');
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('answers confirm() with true or false', async () => {
    render(<ConfirmDialogHost />);
    let answer: Promise<boolean>;
    act(() => {
      answer = confirm({ title: 'Discard changes?', confirmLabel: 'Discard' });
    });
    await userEvent.click(await screen.findByRole('button', { name: 'Discard' }));
    await expect(answer!).resolves.toBe(true);
    act(() => {
      answer = confirm({ title: 'Discard changes?', confirmLabel: 'Discard' });
    });
    await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
    await expect(answer!).resolves.toBe(false);
  });
});

describe('PageHeader', () => {
  it('shows the eyebrow, title, count and a search that clears', async () => {
    function Demo() {
      const [q, setQ] = useState('');
      return (
        <PageHeader
          eyebrow="Permits"
          title="Building permits"
          count={1280}
          search={q}
          onSearchChange={setQ}
          searchPlaceholder="Search permits"
          actions={<Button>New permit</Button>}
        />
      );
    }
    render(<Demo />);
    expect(screen.getByRole('heading', { level: 1, name: 'Building permits' })).toHaveClass('text-4xl', 'font-normal');
    expect(screen.getByText('Permits')).toBeInTheDocument();
    expect(screen.getByText('1,280')).toBeInTheDocument();
    const search = screen.getByRole('searchbox', { name: 'Search permits' });
    await userEvent.type(search, 'elm');
    expect(search).toHaveValue('elm');
    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(search).toHaveValue('');
    await userEvent.type(search, 'oak{Escape}');
    expect(search).toHaveValue('');
  });
});

describe('Banner', () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => window.localStorage.clear());

  it('folds its details behind a chevron', async () => {
    render(<Banner tone="warning" title="Not ready to approve" collapsible items={['Structural review outstanding']} />);
    expect(screen.queryByText('Structural review outstanding')).not.toBeInTheDocument();
    const toggle = screen.getByRole('button', { name: 'Show details' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(toggle);
    expect(screen.getByText('Structural review outstanding')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hide details' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('remembers being dismissed by key', async () => {
    const onDismiss = vi.fn();
    const { unmount } = render(<Banner title="Renewals open 1 December" dismissible dismissKey="renewals-2026" onDismiss={onDismiss} />);
    expect(screen.getByRole('region', { name: 'Renewals open 1 December' })).toHaveClass('bg-primary');
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onDismiss).toHaveBeenCalledOnce();
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
    unmount();
    render(<Banner title="Renewals open 1 December" dismissible dismissKey="renewals-2026" />);
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });
});

describe('Steps', () => {
  it('works out each step’s status from currentStep, with per-item overrides', () => {
    render(
      <Steps
        currentStep={1}
        items={[{ title: 'Apply' }, { title: 'Review' }, { title: 'Inspect', status: 'error' }, { title: 'Issue' }]}
      />,
    );
    const items = screen.getAllByRole('listitem');
    expect(items.map((li) => li.getAttribute('data-status'))).toEqual(['finish', 'process', 'error', 'wait']);
    expect(items[1]).toHaveAttribute('aria-current', 'step');
    expect(items[1]!.querySelector('[data-slot=steps-marker]')).toHaveClass('bg-primary');
    expect(items[0]!.querySelector('[data-slot=steps-marker]')).toHaveClass('bg-secondary');
    expect(items[2]).toHaveTextContent('Inspect (error)');
  });

  it('makes steps clickable, except disabled ones', async () => {
    const onStepClick = vi.fn();
    render(
      <Steps
        currentStep={2}
        onStepClick={onStepClick}
        items={[{ title: 'Apply' }, { title: 'Review', disabled: true }, { title: 'Pay' }]}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /Apply/ }));
    expect(onStepClick).toHaveBeenCalledWith(0);
    expect(screen.getByRole('button', { name: /Review/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Pay/ })).toHaveAttribute('aria-current', 'step');
  });
});

describe('Tile', () => {
  it('is a button that reports selection', async () => {
    const onClick = vi.fn();
    render(<Tile title="Building permit" description="New builds" selected onClick={onClick} />);
    const tile = screen.getByRole('button', { name: /Building permit/ });
    expect(tile).toHaveAttribute('aria-pressed', 'true');
    expect(tile).toHaveAttribute('data-selected');
    await userEvent.click(tile);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('is a link with href, and a disabled link goes nowhere', async () => {
    const onClick = vi.fn();
    render(
      <>
        <Tile href="/fees" title="Pay a fee" />
        <Tile href="/code" title="Code enforcement" disabled onClick={onClick} />
      </>,
    );
    expect(screen.getByRole('link', { name: /Pay a fee/ })).toHaveAttribute('href', '/fees');
    const disabled = screen.getByText('Code enforcement').closest('a')!;
    expect(disabled).not.toHaveAttribute('href');
    expect(disabled).toHaveAttribute('aria-disabled', 'true');
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('QuickTip', () => {
  it('opens its help in a popover on click', async () => {
    render(<QuickTip content="The cost of the work." />);
    await userEvent.click(screen.getByRole('button', { name: 'Help' }));
    expect(await screen.findByText('The cost of the work.')).toBeInTheDocument();
  });

  it('shows a tooltip on focus in hover mode, and renders nothing without content', async () => {
    const { container } = render(
      <>
        <QuickTip trigger="hover" label="About parcels" content="On the tax bill" />
        <QuickTip content="" />
      </>,
    );
    expect(container.querySelectorAll('[data-slot=quick-tip]')).toHaveLength(1);
    await userEvent.tab();
    expect(await screen.findByText('On the tax bill')).toBeInTheDocument();
  });
});

describe('Link', () => {
  it('opens an external link in a new tab and says so', () => {
    render(
      <Link href="https://example.gov" external>
        City council
      </Link>,
    );
    const link = screen.getByRole('link', { name: /City council/ });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noreferrer');
    expect(link).toHaveTextContent('(opens in a new tab)');
    expect(link).toHaveClass('decoration-1', 'hover:decoration-2');
  });

  it('renders as a button, and a disabled link has no href', async () => {
    const onClick = vi.fn();
    render(
      <>
        {/* oxlint-disable-next-line jsx-a11y/control-has-associated-label -- the Link's children name it */}
        <Link render={<button type="button" />} onClick={onClick}>
          Resend email
        </Link>
        <Link href="/archive" disabled>
          Archive
        </Link>
      </>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Resend email' }));
    expect(onClick).toHaveBeenCalledOnce();
    const archive = screen.getByText('Archive');
    expect(archive).not.toHaveAttribute('href');
    expect(archive).toHaveAttribute('aria-disabled', 'true');
  });
});
