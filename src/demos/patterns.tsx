import { useState, type ReactNode } from 'react';
import { CircleHelp, Globe, Settings } from 'lucide-react';

import { UserMenu, type UserMenuOrganization } from '@/components/blocks/user-menu';
import { WeekCalendar, weekStartOf, type WeekCalendarEvent } from '@/components/blocks/week-calendar';
import { BusyHold } from '@/components/ui/busy-hold';
import { Button } from '@/components/ui/button';
import { Deadline } from '@/components/ui/deadline';
import { ErrorPage } from '@/components/ui/error-page';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RelativeTime } from '@/components/ui/relative-time';
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
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

// Demos for the page patterns: deadlines, relative times, holding a region
// while the AI works, the error page, settings sections, the user menu and
// the inspections week.

const DAY = 86_400_000;
const inDays = (n: number, hour = 17, from = Date.now()) => {
  const d = new Date(from + n * DAY);
  d.setHours(hour, 0, 0, 0);
  return d;
};

// ── deadline ─────────────────────────────────────────────────────────────────

function DeadlineDemo() {
  const [now] = useState(() => Date.now());
  const rows: { label: string; node: ReactNode }[] = [
    { label: 'Plan review · BLD-2026-0142', node: <Deadline due={inDays(12)} showDate /> },
    { label: 'Fee payment · BLD-2026-0139', node: <Deadline due={inDays(2)} /> },
    { label: 'Corrections · BLD-2026-0131', node: <Deadline due={inDays(0, 23)} /> },
    { label: 'Abatement · CE-2026-0088', node: <Deadline due={inDays(-2)} /> },
    { label: 'Re-inspection · BLD-2026-0120', node: <Deadline due={new Date(now + 5 * 3_600_000)} precision="hour" /> },
    { label: 'Applicant response · ZON-2026-0014', node: <Deadline due={inDays(20)} status="paused" remainingDays={9} /> },
    { label: 'Licence renewal · BUS-2026-0410', node: <Deadline due={inDays(-1)} status="met" metAt={inDays(-3)} /> },
  ];
  return (
    <div className="flex flex-col gap-8">
      <ul className="flex flex-col divide-y divide-border border border-border">
        {rows.map((r) => (
          <li key={r.label} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <span>{r.label}</span>
            {r.node}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Deadline variant="badge" due={inDays(12)} />
        <Deadline variant="badge" due={inDays(1)} />
        <Deadline variant="badge" due={inDays(-4)} />
        <Deadline variant="badge" due={inDays(6)} status="paused" />
        <Deadline variant="badge" due={inDays(-1)} status="met" />
      </div>
    </div>
  );
}

// ── relative time ────────────────────────────────────────────────────────────

function RelativeTimeDemo() {
  const [now] = useState(() => Date.now());
  const rows = [
    { what: 'Dana Ruiz approved the plan review', at: now - 20_000 },
    { what: 'Resident uploaded a revised site plan', at: now - 5 * 60_000 },
    { what: 'Inspection result recorded: passed', at: now - 3 * 3_600_000 },
    { what: 'Invoice INV-3381 sent to the applicant', at: now - DAY - 3_600_000 },
    { what: 'Code case CE-2026-0088 opened', at: now - 16 * DAY },
    { what: 'Planning commission hearing', at: now + 2 * DAY + 3_600_000 },
  ];
  return (
    <ul className="flex flex-col divide-y divide-border border border-border">
      {rows.map((r) => (
        <li key={r.what} className="flex flex-wrap items-baseline justify-between gap-3 px-4 py-3">
          <span>{r.what}</span>
          <RelativeTime date={r.at} className="text-sm text-muted-foreground" />
        </li>
      ))}
      <li className="flex flex-wrap items-baseline justify-between gap-3 px-4 py-3">
        <span>Short and narrow styles</span>
        <span className="flex gap-4 text-sm text-muted-foreground">
          <RelativeTime date={now - 5 * 60_000} style="short" />
          <RelativeTime date={now - 5 * 60_000} style="narrow" />
        </span>
      </li>
    </ul>
  );
}

// ── busy hold ────────────────────────────────────────────────────────────────

function BusyHoldDemo() {
  const [busy, setBusy] = useState(false);
  const read = () => {
    setBusy(true);
    window.setTimeout(() => setBusy(false), 8000);
  };
  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <div>
        <Button onClick={read} disabled={busy}>
          Read the site plan
        </Button>
      </div>
      <BusyHold busy={busy} label="Reading the site plan (12 pages)">
        <div className="flex flex-col gap-4 border border-border p-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="bh-scope">Scope of work</Label>
            <Textarea id="bh-scope" defaultValue="Replace the rear deck and add a 12 × 16 ft screened porch." />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="bh-value">Valuation</Label>
            <Input id="bh-value" defaultValue="$48,500" />
          </div>
          <div className="flex gap-3">
            <Button>Save</Button>
            <Button variant="outline">Discard</Button>
          </div>
        </div>
      </BusyHold>
    </div>
  );
}

// ── error page ───────────────────────────────────────────────────────────────

function ErrorPageDemo() {
  const [variant, setVariant] = useState<'error' | 'not-found'>('error');
  const error = new Error('GET /api/records/BLD-2026-0142/fees failed: 503 Service Unavailable');
  return (
    <div className="flex flex-col gap-4">
      <ToggleGroup value={[variant]} onValueChange={(v: string[]) => v[0] && setVariant(v[0] as typeof variant)} aria-label="Which page">
        <ToggleGroupItem value="error">Error</ToggleGroupItem>
        <ToggleGroupItem value="not-found">Not found</ToggleGroupItem>
      </ToggleGroup>
      <div className="border border-border">
        {variant === 'error' ? (
          <ErrorPage error={error} reference="req_7f3a91c2" onRetry={() => undefined} onBack={() => undefined} homeHref="#/" />
        ) : (
          <ErrorPage variant="not-found" homeHref="#/" homeLabel="Go to Applications" />
        )}
      </div>
    </div>
  );
}

// ── settings section ─────────────────────────────────────────────────────────

function LateFeesSection() {
  const [saved, setSaved] = useState({ percent: '1.5', grace: '30' });
  const [percent, setPercent] = useState(saved.percent);
  const [grace, setGrace] = useState(saved.grace);
  const [status, setStatus] = useState('');
  const dirty = percent !== saved.percent || grace !== saved.grace;
  return (
    <SettingsSection>
      <SettingsSectionHeader>
        <SettingsSectionTitle>Late fees</SettingsSectionTitle>
        <SettingsSectionDescription>
          Added to an unpaid invoice once its grace period ends. Changes apply to invoices issued from now on.
        </SettingsSectionDescription>
      </SettingsSectionHeader>
      <SettingsSectionPanel>
        <SettingsSectionContent>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ss-percent">Monthly late fee (%)</Label>
            <Input
              id="ss-percent"
              inputMode="decimal"
              value={percent}
              onChange={(e) => {
                setPercent(e.target.value);
                setStatus('');
              }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ss-grace">Grace period (days)</Label>
            <Input
              id="ss-grace"
              inputMode="numeric"
              value={grace}
              onChange={(e) => {
                setGrace(e.target.value);
                setStatus('');
              }}
            />
          </div>
        </SettingsSectionContent>
        <SettingsSectionFooter>
          <SettingsSectionStatus>{dirty ? 'Unsaved changes' : status}</SettingsSectionStatus>
          <Button
            variant="outline"
            disabled={!dirty}
            onClick={() => {
              setPercent(saved.percent);
              setGrace(saved.grace);
            }}
          >
            Cancel
          </Button>
          <Button
            disabled={!dirty}
            onClick={() => {
              setSaved({ percent, grace });
              setStatus('Saved');
            }}
          >
            Save
          </Button>
        </SettingsSectionFooter>
      </SettingsSectionPanel>
    </SettingsSection>
  );
}

function SettingsSectionDemo() {
  return (
    <div className="flex flex-col gap-12">
      <LateFeesSection />
      <SettingsSection variant="destructive">
        <SettingsSectionHeader>
          <SettingsSectionTitle>Retire this record type</SettingsSectionTitle>
          <SettingsSectionDescription>
            Residents can no longer apply for a Fence permit. Records already open keep going; nothing is deleted.
          </SettingsSectionDescription>
        </SettingsSectionHeader>
        <SettingsSectionPanel>
          <SettingsSectionContent>
            <p>214 permits use this type. 6 are still open.</p>
          </SettingsSectionContent>
          <SettingsSectionFooter>
            <Button variant="destructive">Retire Fence permit</Button>
          </SettingsSectionFooter>
        </SettingsSectionPanel>
      </SettingsSection>
    </div>
  );
}

// ── user menu ────────────────────────────────────────────────────────────────

const ORGS: UserMenuOrganization[] = [
  { id: 'springfield', name: 'City of Springfield', role: 'admin' },
  { id: 'shelby', name: 'Shelby County', role: 'permit-technician' },
  { id: 'ogdenville', name: 'Town of Ogdenville', role: 'inspector' },
];

function UserMenuDemo() {
  const [org, setOrg] = useState('springfield');
  const [signedOut, setSignedOut] = useState(false);
  const user = { name: 'Dana Ruiz', email: 'dana.ruiz@springfield.gov' };
  const links = [
    { label: 'Your account', href: '#/account', icon: Settings },
    { label: 'View public portal', href: '#/portal', icon: Globe },
    { label: 'Help and training', href: '#/help', icon: CircleHelp },
  ];
  return (
    <div className="flex flex-col gap-8">
      <div className="flex h-16 items-center justify-end gap-3 border border-border px-4">
        <span className="mr-auto text-sm text-muted-foreground">{signedOut ? 'Signed out' : 'Top bar'}</span>
        <UserMenu
          user={user}
          organizations={ORGS}
          activeOrganizationId={org}
          onSwitchOrganization={setOrg}
          links={links}
          onSignOut={() => setSignedOut(true)}
        />
      </div>
      <div className="flex gap-6">
        <div className="flex h-80 w-60 flex-col justify-end bg-slate">
          <UserMenu
            variant="sidebar"
            user={user}
            organizations={ORGS}
            activeOrganizationId={org}
            onSwitchOrganization={setOrg}
            links={links}
            onSignOut={() => setSignedOut(true)}
          />
        </div>
        <div className="flex h-80 w-16 flex-col justify-end bg-slate">
          <UserMenu
            variant="sidebar"
            collapsed
            user={user}
            organizations={ORGS.slice(0, 1)}
            activeOrganizationId="springfield"
            links={links}
            onSignOut={() => setSignedOut(true)}
          />
        </div>
      </div>
    </div>
  );
}

// ── week calendar ────────────────────────────────────────────────────────────

/** this week's inspections, around today */
export function inspectionWeek(now = new Date()): WeekCalendarEvent[] {
  const monday = weekStartOf(now);
  const at = (day: number, h: number, m = 0) => new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + day, h, m);
  return [
    {
      id: 'i1',
      title: 'Footing',
      subtitle: 'BLD-2026-0142 · 18 Elm St',
      meta: 'Sam Okafor',
      start: at(0, 8),
      end: at(0, 9),
      tone: 'ok',
      label: 'passed',
      done: true,
    },
    {
      id: 'i2',
      title: 'Rough electrical',
      subtitle: 'BLD-2026-0139 · 4 Harbor Rd',
      meta: 'Priya Nair',
      start: at(0, 10, 30),
      end: at(0, 11, 30),
      tone: 'destructive',
      label: 'failed',
      done: true,
    },
    {
      id: 'i3',
      title: 'Framing',
      subtitle: 'BLD-2026-0131 · 220 Main St',
      meta: 'Sam Okafor',
      start: at(1, 9),
      end: at(1, 10, 30),
      tone: 'neutral',
      label: 'booked',
    },
    {
      id: 'i4',
      title: 'Fire alarm',
      subtitle: 'COM-2026-0022 · 90 Market St',
      meta: 'Lee Chen',
      start: at(1, 9, 30),
      end: at(1, 11),
      tone: 'neutral',
      label: 'booked',
    },
    {
      id: 'i5',
      title: 'Final plumbing',
      subtitle: 'BLD-2026-0120 · 7 Birch Ln',
      meta: 'Priya Nair',
      start: at(2, 13),
      end: at(2, 14),
      status: { name: 'Awaiting re-inspection', color: 'amber' },
    },
    {
      id: 'i6',
      title: 'Property maintenance',
      subtitle: 'CE-2026-0088 · 51 Oak Ave',
      meta: 'Jordan Wells',
      start: at(3, 8, 30),
      end: at(3, 9, 15),
      status: { name: 'In review', color: 'blue' },
    },
    {
      id: 'i7',
      title: 'Pool barrier',
      subtitle: 'BLD-2026-0150 · 3 Lakeview Ct',
      meta: 'Sam Okafor',
      start: at(4, 15),
      end: at(4, 16),
      tone: 'neutral',
      label: 'booked',
    },
    {
      id: 'i8',
      title: 'Food service licence',
      subtitle: 'BUS-2026-0410 · 12 Main St',
      meta: 'Lee Chen',
      start: at(4, 11),
      end: at(4, 12),
      tone: 'ok',
      label: 'passed',
      done: true,
    },
  ];
}

function WeekCalendarDemo() {
  const [layout, setLayout] = useState<'auto' | 'grid' | 'list'>('auto');
  const [opened, setOpened] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-4">
      <WeekCalendar
        events={inspectionWeek()}
        layout={layout}
        onEventClick={(e) => setOpened(`${e.title} · ${e.subtitle ?? ''}`)}
        toolbar={
          <ToggleGroup value={[layout]} onValueChange={(v: string[]) => v[0] && setLayout(v[0] as typeof layout)} aria-label="Layout">
            <ToggleGroupItem value="auto">Auto</ToggleGroupItem>
            <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
            <ToggleGroupItem value="list">List</ToggleGroupItem>
          </ToggleGroup>
        }
      />
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {opened ? `Opened: ${opened}` : 'Click an inspection to open it.'}
      </p>
    </div>
  );
}

export const PATTERNS_DEMOS: Record<string, () => ReactNode> = {
  deadline: DeadlineDemo,
  'relative-time': RelativeTimeDemo,
  'busy-hold': BusyHoldDemo,
  'error-page': ErrorPageDemo,
  'settings-section': SettingsSectionDemo,
  'user-menu': UserMenuDemo,
  'week-calendar': WeekCalendarDemo,
};
