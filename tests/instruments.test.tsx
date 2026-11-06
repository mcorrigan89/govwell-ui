import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Distribution } from '@/components/ui/distribution';
import { EventLog, EventLogEmpty, EventLogFilter, EventLogItem } from '@/components/ui/event-log';
import { KeyHint, KeyHints } from '@/components/ui/key-hints';
import { Meter } from '@/components/ui/meter';
import { Readout } from '@/components/ui/readout';
import { Seal } from '@/components/ui/seal';
import { ToneBadge } from '@/components/ui/tone-badge';
import { Verdict } from '@/components/ui/verdict';
import { FigureIcon } from '@/components/ui/figure-icon';
import { useHotkeys, type HotkeyHandler } from '@/hooks/use-hotkeys';
import { INSTRUMENTS_DEMOS } from '../src/demos/instruments';

describe('ToneBadge', () => {
  it('maps the signal tones onto GovWell status fills', () => {
    render(
      <>
        <ToneBadge tone="ok">Issued</ToneBadge>
        <ToneBadge tone="system">Awaiting payment</ToneBadge>
        <ToneBadge tone="signal" glow>
          Expired
        </ToneBadge>
        <ToneBadge tone="phosphor">In review</ToneBadge>
        <ToneBadge tone="dim">Withdrawn</ToneBadge>
      </>,
    );
    expect(screen.getByText('Issued')).toHaveClass('bg-ok', 'text-ok-foreground', 'eyebrow-type', 'rounded-none');
    expect(screen.getByText('Awaiting payment')).toHaveClass('bg-warning');
    const expired = screen.getByText('Expired');
    expect(expired).toHaveClass('bg-destructive');
    expect(expired.className).not.toMatch(/shadow/);
    expect(expired).not.toHaveAttribute('glow');
    expect(screen.getByText('In review')).toHaveClass('border-border');
    expect(screen.getByText('Withdrawn')).toHaveClass('bg-ash-tint');
  });

  it('takes the GovWell names, defaults to neutral and passes className through', () => {
    render(
      <>
        <ToneBadge tone="info">Scheduled</ToneBadge>
        <ToneBadge tone="destructive">Revoked</ToneBadge>
        <ToneBadge className="ml-2">Draft</ToneBadge>
      </>,
    );
    expect(screen.getByText('Scheduled')).toHaveClass('bg-info');
    expect(screen.getByText('Revoked')).toHaveClass('bg-destructive');
    const draft = screen.getByText('Draft');
    expect(draft).toHaveAttribute('data-tone', 'neutral');
    expect(draft).toHaveClass('ml-2', 'border-border');
  });
});

describe('Readout', () => {
  it('shows the figure above its label', () => {
    render(<Readout label="Open applications" value="1,284" />);
    const value = screen.getByText('1,284');
    expect(value).toHaveClass('font-normal', 'tabular-nums');
    expect(value.compareDocumentPosition(screen.getByText('Open applications')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('marks a status tone with a square and turns attention red', () => {
    const { container } = render(
      <>
        <Readout label="Issued" value="418" tone="ok" />
        <Readout label="Overdue" value="9" tone="signal" />
        <Readout label="Drafts" value="37" tone="dim" />
      </>,
    );
    expect(container.querySelector('[data-tone="ok"] .bg-ok')).toBeInTheDocument();
    expect(screen.getByText('9')).toHaveClass('text-error');
    expect(screen.getByText('37')).toHaveClass('text-muted-foreground');
  });
});

describe('Meter', () => {
  it('is a labelled meter with n of m segments filled', () => {
    const { container } = render(<Meter label="Inspections passed" value={3} total={5} />);
    const meter = screen.getByRole('meter', { name: 'Inspections passed' });
    expect(meter).toHaveAttribute('aria-valuenow', '3');
    expect(meter).toHaveAttribute('aria-valuemax', '5');
    expect(meter).toHaveAttribute('aria-valuetext', '3 of 5');
    const segments = container.querySelectorAll('[data-slot="meter-segment"]');
    expect(segments).toHaveLength(5);
    expect(container.querySelectorAll('[data-filled]')).toHaveLength(3);
    expect(segments[0]).toHaveClass('bg-secondary');
    expect(segments[4]).toHaveClass('bg-ash-tint');
    expect(screen.getByText('3/5')).toBeInTheDocument();
  });

  it('clamps the value and fills in the tone', () => {
    const { container } = render(<Meter label="Corrections" value={9} total={4} tone="signal" />);
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '4');
    expect(container.querySelectorAll('.bg-destructive')).toHaveLength(4);
  });
});

describe('Distribution', () => {
  it('splits the bar by count and leaves out empty parts', () => {
    const { container } = render(
      <Distribution
        label="Applications"
        parts={[
          { name: 'Submitted', count: 10 },
          { name: 'In review', count: 30, tone: 'ok' },
          { name: 'Withdrawn', count: 0 },
          { name: 'Scheduled', count: 5, tone: 'info', dashed: true },
        ]}
      />,
    );
    expect(screen.getByRole('img', { name: 'Applications: Submitted 10, In review 30, Scheduled 5' })).toBeInTheDocument();
    const parts = container.querySelectorAll<HTMLElement>('[data-slot="distribution-part"]');
    expect(parts).toHaveLength(3);
    expect(parts[0].style.flexGrow).toBe('10');
    expect(parts[0].style.background).toBe('var(--chart-1)');
    expect(parts[1].style.background).toBe('var(--ok)');
    expect(parts[1]).toHaveAttribute('title', 'In review: 30 (67%)');
    expect(parts[2]).toHaveClass('border-dashed');
    expect(parts[2].style.borderColor).toBe('var(--info)');
    expect(container.querySelectorAll('[data-slot="distribution-legend-item"]')).toHaveLength(3);
  });

  it('says none when every part is empty', () => {
    render(<Distribution label="Fees" parts={[{ name: 'Paid', count: 0 }]} />);
    expect(screen.getByRole('img', { name: 'Fees: none' })).toBeInTheDocument();
  });
});

describe('Seal', () => {
  it('is a named image with the lines in uppercase and corner nodes', () => {
    const { container } = render(<Seal top="City of Riverton" bottom="Permit B-2024-0193" word="Issued" />);
    const seal = screen.getByRole('img', { name: 'Issued: City of Riverton, Permit B-2024-0193' });
    expect(seal).toHaveAttribute('width', '120');
    expect(within(seal).getByText('CITY OF RIVERTON')).toBeInTheDocument();
    expect(within(seal).getByText('PERMIT B-2024-0193')).toBeInTheDocument();
    expect(within(seal).getByText('ISSUED')).toBeInTheDocument();
    expect(container.querySelectorAll('rect[width="7"]')).toHaveLength(4);
    expect(container.querySelector('circle')).toBeNull();
  });

  it('squeezes a long line to fit and defaults the word to PASSED', () => {
    render(<Seal top="Department of Buildings and Code Enforcement" bottom="2024" size={160} />);
    const seal = screen.getByRole('img');
    expect(seal).toHaveAttribute('width', '160');
    expect(within(seal).getByText('DEPARTMENT OF BUILDINGS AND CODE ENFORCEMENT')).toHaveAttribute('textLength', '100');
    expect(within(seal).getByText('2024')).not.toHaveAttribute('textLength');
    expect(within(seal).getByText('PASSED')).toBeInTheDocument();
  });
});

describe('EventLog', () => {
  it('lists events with time, source badge and tone', () => {
    render(
      <EventLog aria-label="Activity">
        <EventLogItem time="2:14 PM" dateTime="2024-03-04T14:14" tag="Staff" tone="ok" end={<span>#4412</span>}>
          Framing inspection passed
        </EventLogItem>
        <EventLogItem time="9:02 AM" tag="Automation" tagVariant="sky" tone="signal">
          Corrections requested
        </EventLogItem>
      </EventLog>,
    );
    const items = within(screen.getByRole('list', { name: 'Activity' })).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Framing inspection passed');
    expect(within(items[0]).getByText('2:14 PM').tagName).toBe('TIME');
    expect(within(items[0]).getByText('2:14 PM')).toHaveAttribute('dateTime', '2024-03-04T14:14');
    expect(within(items[0]).getByText('Staff')).toHaveClass('bg-ash-tint', 'eyebrow-type');
    expect(within(items[0]).getByText('#4412')).toBeInTheDocument();
    expect(items[0].querySelector('[data-slot="event-log-node"]')).toHaveClass('bg-ok');
    expect(within(items[1]).getByText('Automation')).toHaveClass('bg-sky-tint');
    expect(within(items[1]).getByText('Corrections requested')).toHaveClass('text-error');
  });

  it('fades in only the events that arrive after it first renders', async () => {
    function Live() {
      const [events, setEvents] = useState(['Application submitted']);
      return (
        <>
          <button onClick={() => setEvents((e) => ['Fee paid', ...e])}>Add</button>
          <EventLog aria-label="Activity">
            {events.map((t) => (
              <EventLogItem key={t} time="now">
                {t}
              </EventLogItem>
            ))}
          </EventLog>
        </>
      );
    }
    render(<Live />);
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));
    const [fresh, old] = screen.getAllByRole('listitem');
    expect(fresh).toHaveTextContent('Fee paid');
    expect(fresh).toHaveAttribute('data-fresh');
    expect(old).not.toHaveAttribute('data-fresh');
  });

  it('filters by source with a toggle group', async () => {
    type Source = 'all' | 'staff' | 'applicant';
    const events = [
      { id: 1, source: 'staff', text: 'Inspection passed' },
      { id: 2, source: 'applicant', text: 'Fee paid' },
    ];
    function Filtered() {
      const [source, setSource] = useState<Source>('all');
      const shown = events.filter((e) => source === 'all' || e.source === source);
      return (
        <>
          <EventLogFilter<Source>
            value={source}
            onValueChange={setSource}
            options={[
              { value: 'all', label: 'All' },
              { value: 'staff', label: 'Staff' },
              { value: 'applicant', label: 'Applicant' },
            ]}
          />
          <EventLog aria-label="Activity">
            {shown.length === 0 && <EventLogEmpty>Nothing</EventLogEmpty>}
            {shown.map((e) => (
              <EventLogItem key={e.id} time="now" tag={e.source}>
                {e.text}
              </EventLogItem>
            ))}
          </EventLog>
        </>
      );
    }
    render(<Filtered />);
    expect(screen.getByRole('group', { name: 'Filter the activity' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Staff' }));
    expect(screen.getByRole('button', { name: 'Staff' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Inspection passed')).toBeInTheDocument();
    expect(screen.queryByText('Fee paid')).not.toBeInTheDocument();
    // pressing the pressed one again keeps it selected rather than clearing
    await userEvent.click(screen.getByRole('button', { name: 'Staff' }));
    expect(screen.getByRole('button', { name: 'Staff' })).toHaveAttribute('aria-pressed', 'true');
  });
});

function Keys({ keys, enabled }: { keys: Record<string, HotkeyHandler>; enabled?: boolean }) {
  useHotkeys(keys, { enabled });
  return (
    <>
      <input aria-label="Search" />
      <button>Save</button>
      <div role="dialog">
        <button>In dialog</button>
      </div>
    </>
  );
}

describe('useHotkeys', () => {
  it('fires single keys case-insensitively, but not while typing or in a dialog', async () => {
    const approve = vi.fn();
    render(<Keys keys={{ a: approve }} />);
    await userEvent.keyboard('a');
    await userEvent.keyboard('A');
    expect(approve).toHaveBeenCalledTimes(2);
    await userEvent.click(screen.getByRole('textbox', { name: 'Search' }));
    await userEvent.keyboard('a');
    expect(approve).toHaveBeenCalledTimes(2);
    screen.getByRole('button', { name: 'In dialog' }).focus();
    await userEvent.keyboard('a');
    expect(approve).toHaveBeenCalledTimes(2);
  });

  it('runs mod+ bindings from a field and ignores plain keys with a modifier held', async () => {
    const palette = vi.fn();
    const approve = vi.fn();
    render(<Keys keys={{ 'mod+k': palette, a: approve }} />);
    await userEvent.click(screen.getByRole('textbox', { name: 'Search' }));
    await userEvent.keyboard('{Control>}k{/Control}');
    expect(palette).toHaveBeenCalledTimes(1);
    await userEvent.keyboard('{Meta>}k{/Meta}');
    expect(palette).toHaveBeenCalledTimes(2);
    (document.activeElement as HTMLElement).blur();
    await userEvent.keyboard('{Control>}a{/Control}');
    expect(approve).not.toHaveBeenCalled();
  });

  it('prevents the default unless the handler returns false, and can be disabled', () => {
    const { rerender } = render(<Keys keys={{ '/': () => {}, escape: () => false }} />);
    const slash = new KeyboardEvent('keydown', { key: '/', bubbles: true, cancelable: true });
    document.body.dispatchEvent(slash);
    expect(slash.defaultPrevented).toBe(true);
    const esc = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    document.body.dispatchEvent(esc);
    expect(esc.defaultPrevented).toBe(false);
    rerender(<Keys keys={{ '/': () => {} }} enabled={false} />);
    const again = new KeyboardEvent('keydown', { key: '/', bubbles: true, cancelable: true });
    document.body.dispatchEvent(again);
    expect(again.defaultPrevented).toBe(false);
  });

  it('only fires shift+ bindings with Shift held', async () => {
    const back = vi.fn();
    render(<Keys keys={{ 'shift+j': back }} />);
    await userEvent.keyboard('j');
    expect(back).not.toHaveBeenCalled();
    await userEvent.keyboard('{Shift>}J{/Shift}');
    expect(back).toHaveBeenCalledTimes(1);
  });
});

describe('KeyHints', () => {
  it('is a labelled list of keycaps and what they do', () => {
    render(
      <KeyHints>
        <KeyHint keys={['J', 'K']}>move</KeyHint>
        <KeyHint keys={['1', '9']} range>
          open tab
        </KeyHint>
      </KeyHints>,
    );
    const list = screen.getByRole('list', { name: 'Keyboard shortcuts' });
    const [move, tab] = within(list).getAllByRole('listitem');
    expect(move.querySelectorAll('kbd')).toHaveLength(2);
    expect(move).toHaveTextContent('JKmove');
    expect(tab.querySelectorAll('kbd')).toHaveLength(2);
    expect(within(tab).getByLabelText('to')).toHaveTextContent('–');
  });
});

describe('INSTRUMENTS_DEMOS', () => {
  it('renders every demo', () => {
    for (const [name, Demo] of Object.entries(INSTRUMENTS_DEMOS)) {
      const { unmount } = render(<Demo />);
      expect(document.body.textContent, name).not.toBe('');
      unmount();
    }
  });
});

describe('Verdict', () => {
  it('stamps a pass on Field and a fail on red, the decision in sentence case on its tint', () => {
    render(
      <>
        <Verdict kind="pass" subject="Zoning">
          Approved
        </Verdict>
        <Verdict kind="fail">Failed</Verdict>
      </>,
    );
    const pass = screen.getByText('Approved').closest('[data-verdict]')!;
    expect(pass).toHaveAttribute('data-verdict', 'pass');
    expect(pass.firstElementChild).toHaveClass('bg-ok', 'animate-in');
    expect(pass.lastElementChild).toHaveClass('bg-field-tint');
    expect(within(pass as HTMLElement).getByText('Zoning')).toBeInTheDocument();
    expect(pass.className).not.toMatch(/uppercase|eyebrow/);
    const fail = screen.getByText('Failed').closest('[data-verdict]')!;
    expect(fail.firstElementChild).toHaveClass('bg-destructive');
  });

  it('keeps the mark out of the accessible name', () => {
    render(<Verdict kind="revise">Revise</Verdict>);
    expect(screen.getByText('Revise').closest('[data-verdict]')!.firstElementChild).toHaveAttribute('aria-hidden');
  });
});

describe('FigureIcon', () => {
  it('draws the icon on its tint, hidden from assistive tech', () => {
    const { container } = render(<FigureIcon icon={(p) => <svg data-testid="icon" {...p} />} tint="amber" />);
    const tile = container.firstElementChild!;
    expect(tile).toHaveClass('bg-amber-tint', 'text-tint-foreground', 'size-9');
    expect(tile).toHaveAttribute('aria-hidden');
    expect(screen.getByTestId('icon')).toHaveClass('size-4');
  });
});
