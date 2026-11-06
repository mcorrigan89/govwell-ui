import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { UserMenu } from '@/components/blocks/user-menu';
import { layoutDay, WeekCalendar, weekStartOf, type WeekCalendarEvent } from '@/components/blocks/week-calendar';
import { BusyHold, formatElapsed } from '@/components/ui/busy-hold';
import { Deadline, daysBetween, formatDeadline } from '@/components/ui/deadline';
import { ErrorPage } from '@/components/ui/error-page';
import { RelativeTime, formatRelative } from '@/components/ui/relative-time';
import {
  SettingsSection,
  SettingsSectionContent,
  SettingsSectionDescription,
  SettingsSectionFooter,
  SettingsSectionHeader,
  SettingsSectionPanel,
  SettingsSectionStatus,
  SettingsSectionTitle,
} from '@/components/ui/settings-section';
import { PATTERNS_DEMOS } from '@/docs/demos/patterns';

// jsdom lacks a few things Base UI reaches for
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
Element.prototype.scrollIntoView ??= function () {};

afterEach(() => {
  vi.useRealTimers();
});

// Thursday 5 November 2026, 10am local
const NOW = new Date(2026, 10, 5, 10, 0);
const at = (day: number, h: number, m = 0) => new Date(2026, 10, day, h, m);
// Intl puts thin spaces around the dash in a date range
const week = (label: string) => (name: string) => name.replace(/\s/g, ' ') === label;

// ── deadline ─────────────────────────────────────────────────────────────────

describe('Deadline', () => {
  it('counts calendar days, not 24-hour blocks', () => {
    expect(daysBetween(at(5, 22), at(6, 1))).toBe(1);
    expect(daysBetween(at(5, 1), at(5, 23))).toBe(0);
    expect(daysBetween(at(5, 10), at(2, 10))).toBe(-3);
    // across the end of daylight saving (1 Nov 2026 in the US) it's still whole days
    expect(daysBetween(new Date(2026, 9, 31), new Date(2026, 10, 2))).toBe(2);
  });

  it('says what is left or how late, with a tone for how worried to be', () => {
    expect(formatDeadline(at(15, 17), { now: NOW })).toMatchObject({ text: '10 days left', tone: 'ok' });
    expect(formatDeadline(at(8, 17), { now: NOW })).toMatchObject({ text: '3 days left', tone: 'warning' });
    expect(formatDeadline(at(6, 9), { now: NOW })).toMatchObject({ text: 'Due tomorrow', tone: 'warning' });
    expect(formatDeadline(at(5, 17), { now: NOW })).toMatchObject({ text: 'Due today', tone: 'warning' });
    expect(formatDeadline(at(3, 17), { now: NOW })).toMatchObject({ text: '2 days late', tone: 'destructive' });
    expect(formatDeadline(at(4, 17), { now: NOW })).toMatchObject({ text: '1 day late' });
    expect(formatDeadline(at(15, 17), { now: NOW, status: 'paused', remainingDays: 5 })).toMatchObject({
      text: 'Paused · 5 days left when it resumes',
      tone: 'muted',
    });
    expect(formatDeadline(at(3, 17), { now: NOW, status: 'met' })).toMatchObject({ text: 'Met', tone: 'muted' });
  });

  it('counts hours inside the last two days at hour precision', () => {
    expect(formatDeadline(at(5, 15, 30), { now: NOW, precision: 'hour' }).text).toBe('5 hours left');
    expect(formatDeadline(at(5, 9, 40), { now: NOW, precision: 'hour' })).toMatchObject({ text: '1 hour late', tone: 'destructive' });
    expect(formatDeadline(at(10, 10), { now: NOW, precision: 'hour' }).text).toBe('5 days left');
  });

  it('renders a <time> with the date as its title, as text or a badge', () => {
    const { rerender } = render(<Deadline due={at(3, 17)} now={NOW} locale="en-US" />);
    const time = screen.getByText('2 days late').closest('time')!;
    expect(time).toHaveAttribute('data-tone', 'destructive');
    expect(time).toHaveAttribute('title', expect.stringContaining('Nov 3, 2026'));
    expect(time).toHaveAttribute('dateTime', at(3, 17).toISOString());
    expect(time).toHaveClass('text-error');

    rerender(<Deadline due={at(15, 17)} now={NOW} variant="badge" showDate locale="en-US" />);
    const badge = screen.getByText('10 days left · Nov 15').closest('time')!;
    expect(badge).toHaveAttribute('data-slot', 'deadline');
    expect(badge).toHaveClass('bg-ok');
  });
});

// ── relative time ────────────────────────────────────────────────────────────

describe('RelativeTime', () => {
  it('says the largest unit that fits, in words', () => {
    const now = NOW.getTime();
    const f = (offset: number) => formatRelative(now + offset, { now, locale: 'en-US' });
    expect(f(-20_000)).toBe('just now');
    expect(f(-5 * 60_000)).toBe('5 minutes ago');
    expect(f(-3 * 3_600_000)).toBe('3 hours ago');
    expect(f(-26 * 3_600_000)).toBe('yesterday');
    expect(f(2 * 86_400_000)).toBe('in 2 days');
    expect(f(-16 * 86_400_000)).toBe('2 weeks ago');
    expect(formatRelative(now - 5 * 60_000, { now, locale: 'en-US', style: 'narrow' })).toBe('5m ago');
  });

  it('keeps itself current, with the full date as its title', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    render(<RelativeTime date={NOW.getTime() - 50 * 60_000} locale="en-US" />);
    const time = screen.getByText('1 hour ago');
    expect(time.tagName).toBe('TIME');
    expect(time).toHaveAttribute('title', expect.stringContaining('2026'));
    act(() => {
      vi.advanceTimersByTime(80 * 60_000);
    });
    expect(screen.getByText('2 hours ago')).toBeInTheDocument();
  });
});

// ── busy hold ────────────────────────────────────────────────────────────────

describe('BusyHold', () => {
  function Form({ busy }: { busy: boolean }) {
    return (
      <BusyHold busy={busy} label="Reading the site plan">
        <label>
          Scope of work <input defaultValue="Rear deck" />
        </label>
        <button type="button">Save</button>
      </BusyHold>
    );
  }

  it('disables every control inside, says what is happening and keeps the content in view', () => {
    const { rerender } = render(<Form busy={false} />);
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();

    rerender(<Form busy />);
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'Scope of work' })).toBeDisabled();
    expect(screen.getByRole('group')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Reading the site plan');
    // still there to read
    expect(screen.getByRole('textbox', { name: 'Scope of work' })).toHaveValue('Rear deck');

    rerender(<Form busy={false} />);
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
  });

  it('counts the time so far', () => {
    vi.useFakeTimers();
    render(<Form busy />);
    act(() => {
      vi.advanceTimersByTime(65_000);
    });
    expect(screen.getByText('1m 05s')).toBeInTheDocument();
    expect(formatElapsed(8_400)).toBe('8s');
  });
});

// ── error page ───────────────────────────────────────────────────────────────

describe('ErrorPage', () => {
  it('says what happened in words, offers a way back and folds the technical message away', async () => {
    const onRetry = vi.fn();
    render(<ErrorPage error={new Error('503 Service Unavailable')} reference="req_7f3a" onRetry={onRetry} homeHref="/home" />);
    expect(screen.getByRole('alert')).toHaveAccessibleName('This page ran into a problem');
    expect(screen.getByRole('heading', { level: 1 })).toHaveClass('font-normal');
    expect(screen.queryByText('503 Service Unavailable')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledOnce();
    expect(screen.getByRole('link', { name: 'Go to home' })).toHaveAttribute('href', '/home');

    await userEvent.click(screen.getByRole('button', { name: 'Technical details' }));
    expect(await screen.findByText('503 Service Unavailable')).toBeInTheDocument();
    expect(screen.getByText('req_7f3a')).toBeInTheDocument();
  });

  it('has a not-found variant with no details to show', () => {
    render(<ErrorPage variant="not-found" />);
    expect(screen.getByRole('heading', { name: 'We couldn’t find that page' })).toBeInTheDocument();
    expect(screen.getByText('Not found · 404')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Technical details' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to home' })).toHaveAttribute('href', '/');
  });
});

// ── settings section ─────────────────────────────────────────────────────────

describe('SettingsSection', () => {
  it('is a region named by its title, with the form in a panel and a footer', () => {
    render(
      <SettingsSection variant="destructive">
        <SettingsSectionHeader>
          <SettingsSectionTitle>Retire this record type</SettingsSectionTitle>
          <SettingsSectionDescription>Nothing is deleted.</SettingsSectionDescription>
        </SettingsSectionHeader>
        <SettingsSectionPanel>
          <SettingsSectionContent>214 permits use it.</SettingsSectionContent>
          <SettingsSectionFooter>
            <SettingsSectionStatus>6 still open</SettingsSectionStatus>
            <button type="button">Retire</button>
          </SettingsSectionFooter>
        </SettingsSectionPanel>
      </SettingsSection>,
    );
    const section = screen.getByRole('region', { name: 'Retire this record type' });
    expect(section).toHaveAttribute('data-variant', 'destructive');
    expect(section).toHaveClass('@3xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]');
    expect(within(section).getByRole('status')).toHaveTextContent('6 still open');
  });

  it('tracks unsaved changes, cancels and saves (demo)', async () => {
    const Demo = PATTERNS_DEMOS['settings-section']!;
    render(<Demo />);
    const section = screen.getByRole('region', { name: 'Late fees' });
    const save = within(section).getByRole('button', { name: 'Save' });
    expect(save).toBeDisabled();
    const grace = within(section).getByRole('textbox', { name: 'Grace period (days)' });
    await userEvent.clear(grace);
    await userEvent.type(grace, '45');
    expect(within(section).getByRole('status')).toHaveTextContent('Unsaved changes');
    await userEvent.click(within(section).getByRole('button', { name: 'Cancel' }));
    expect(grace).toHaveValue('30');
    await userEvent.type(grace, '0');
    await userEvent.click(save);
    expect(within(section).getByRole('status')).toHaveTextContent('Saved');
    expect(save).toBeDisabled();
  });
});

// ── user menu ────────────────────────────────────────────────────────────────

describe('UserMenu', () => {
  const orgs = [
    { id: 'springfield', name: 'City of Springfield', role: 'admin' },
    { id: 'shelby', name: 'Shelby County', role: 'permit-technician' },
  ];

  it('shows who and where, switches organization and signs out', async () => {
    const onSwitch = vi.fn();
    const onSignOut = vi.fn();
    render(
      <UserMenu
        user={{ name: 'Dana Ruiz', email: 'dana@springfield.gov' }}
        organizations={orgs}
        activeOrganizationId="springfield"
        onSwitchOrganization={onSwitch}
        links={[{ label: 'Your account', href: '/account' }]}
        onSignOut={onSignOut}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Dana Ruiz' }));
    const menu = await screen.findByRole('menu');
    expect(within(menu).getByText('dana@springfield.gov')).toBeInTheDocument();
    expect(within(menu).getByRole('menuitemradio', { name: /City of Springfield/ })).toHaveAttribute('aria-checked', 'true');
    expect(within(menu).getByText('Permit technician')).toBeInTheDocument();
    expect(within(menu).getByRole('menuitem', { name: 'Your account' })).toHaveAttribute('href', '/account');

    await userEvent.click(within(menu).getByRole('menuitemradio', { name: /Shelby County/ }));
    expect(onSwitch).toHaveBeenCalledWith('shelby');
    // let the menu finish closing first: under load its exit can still be
    // running, and a click would land in the closing menu instead of a new one
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'Dana Ruiz' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Sign out' }));
    expect(onSignOut).toHaveBeenCalledOnce();
  });

  it('with one organization, names it rather than offering to switch; collapsed, is just the avatar', async () => {
    render(
      <UserMenu
        variant="sidebar"
        collapsed
        user={{ name: 'Dana Ruiz' }}
        organizations={orgs.slice(0, 1)}
        activeOrganizationId="springfield"
      />,
    );
    const trigger = screen.getByRole('button', { name: 'Dana Ruiz' });
    expect(trigger).toHaveTextContent('DR');
    await userEvent.click(trigger);
    const menu = await screen.findByRole('menu');
    expect(within(menu).queryByRole('menuitemradio')).not.toBeInTheDocument();
    expect(within(menu).getByText('City of Springfield · Admin')).toBeInTheDocument();
  });
});

// ── week calendar ────────────────────────────────────────────────────────────

const EVENTS: WeekCalendarEvent[] = [
  { id: 'a', title: 'Footing', subtitle: 'BLD-0142 · 18 Elm St', start: at(2, 8), end: at(2, 9), tone: 'ok', label: 'passed', done: true },
  { id: 'b', title: 'Framing', subtitle: 'BLD-0131 · 220 Main St', start: at(5, 9), end: at(5, 10, 30), label: 'booked' },
  { id: 'c', title: 'Fire alarm', start: at(5, 9, 30), end: at(5, 11), status: { name: 'In review', color: 'blue' } },
  { id: 'd', title: 'Next week', start: at(10, 9) },
];

describe('WeekCalendar', () => {
  it('starts weeks on Monday and lays overlapping events side by side', () => {
    expect(weekStartOf(NOW)).toEqual(new Date(2026, 10, 2));
    expect(weekStartOf(new Date(2026, 10, 8, 23))).toEqual(new Date(2026, 10, 2));
    const placed = layoutDay(EVENTS.slice(1, 3));
    expect(placed.map((p) => [p.event.id, p.lane, p.lanes])).toEqual([
      ['b', 0, 2],
      ['c', 1, 2],
    ]);
    expect(layoutDay([EVENTS[0]!])[0]).toMatchObject({ lane: 0, lanes: 1 });
  });

  it('places events by day and time in the grid, marks today and opens an event', async () => {
    const onEventClick = vi.fn();
    render(
      <WeekCalendar events={EVENTS} now={NOW} layout="grid" locale="en-US" onEventClick={onEventClick} hourHeight={60} startHour={7} />,
    );
    expect(screen.getByRole('heading', { name: week('Nov 2 – 8, 2026') })).toBeInTheDocument();
    const thursday = screen.getByRole('group', { name: 'Thursday, November 5, today' });
    const framing = within(thursday).getByRole('button', { name: /Framing/ });
    // 9am with the grid starting at 7am, 60px an hour
    expect(framing.style.top).toBe('121px');
    expect(within(thursday).getByRole('button', { name: /Fire alarm.*In review/ })).toHaveAttribute('data-hue', 'sky');
    expect(screen.queryByText(/Next week/)).not.toBeInTheDocument();
    const monday = screen.getByRole('group', { name: 'Monday, November 2' });
    expect(within(monday).getByRole('button', { name: /Footing.*passed, done/ })).toHaveAttribute('data-hue', 'field');
    await userEvent.click(framing);
    expect(onEventClick).toHaveBeenCalledWith(EVENTS[1]);
  });

  it('moves a week at a time and back to this week', async () => {
    function Controlled() {
      const [week, setWeek] = useState(new Date(2026, 10, 2));
      return <WeekCalendar events={EVENTS} now={NOW} layout="list" locale="en-US" weekStart={week} onWeekChange={setWeek} />;
    }
    render(<Controlled />);
    const thisWeek = screen.getByRole('button', { name: 'This week' });
    expect(thisWeek).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Next week' }));
    expect(screen.getByRole('heading', { name: week('Nov 9 – 15, 2026') })).toBeInTheDocument();
    expect(screen.getByText('Next week')).toBeInTheDocument();
    expect(thisWeek).toBeEnabled();
    await userEvent.click(screen.getByRole('button', { name: 'Previous week' }));
    await userEvent.click(screen.getByRole('button', { name: 'Previous week' }));
    expect(screen.getByRole('heading', { name: week('Oct 26 – Nov 1, 2026') })).toBeInTheDocument();
    await userEvent.click(thisWeek);
    await waitFor(() => expect(screen.getByRole('heading', { name: week('Nov 2 – 8, 2026') })).toBeInTheDocument());
  });

  it('lists the week by day on narrow screens, with today marked and empty days said', () => {
    render(<WeekCalendar events={EVENTS} now={NOW} layout="list" locale="en-US" />);
    const today = screen.getByRole('listitem', { name: /Thursday, November 5/ });
    expect(today).toHaveAttribute('data-today');
    expect(within(today).getByText('Today')).toBeInTheDocument();
    expect(within(today).getByText('In review')).toBeInTheDocument();
    expect(within(today).getByText('booked')).toBeInTheDocument();
    expect(within(screen.getByRole('listitem', { name: /Tuesday, November 3/ })).getByText('Nothing booked')).toBeInTheDocument();
    expect(within(screen.getByRole('listitem', { name: /Monday, November 2/ })).getByLabelText('Done')).toBeInTheDocument();
  });
});

// ── demos ────────────────────────────────────────────────────────────────────

describe('PATTERNS_DEMOS', () => {
  it('renders every demo', () => {
    for (const [name, Demo] of Object.entries(PATTERNS_DEMOS)) {
      const { unmount } = render(<Demo />);
      expect(document.body.textContent, name).not.toBe('');
      unmount();
    }
  });
});
