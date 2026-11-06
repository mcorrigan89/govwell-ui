import { useRef, useState, type ReactNode } from 'react';
import { CalendarClock, ListChecks, Receipt, Wallet } from 'lucide-react';

import { Distribution } from '@/components/ui/distribution';
import { EventLog, EventLogEmpty, EventLogFilter, EventLogItem, type EventLogTone } from '@/components/ui/event-log';
import { Input } from '@/components/ui/input';
import { KeyHint, KeyHints } from '@/components/ui/key-hints';
import { Meter } from '@/components/ui/meter';
import { Readout } from '@/components/ui/readout';
import { FigureIcon } from '@/components/ui/figure-icon';
import { Verdict } from '@/components/ui/verdict';
import { Seal } from '@/components/ui/seal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ToneBadge, type Tone } from '@/components/ui/tone-badge';
import { useHotkeys } from '@/hooks/use-hotkeys';

function ToneBadgeDemo() {
  const rows: { permit: string; address: string; status: string; tone: Tone }[] = [
    { permit: 'B-2024-0193', address: '14 Elm Street', status: 'Issued', tone: 'ok' },
    { permit: 'B-2024-0201', address: '220 Harbor Road', status: 'Awaiting payment', tone: 'warning' },
    { permit: 'E-2024-0077', address: '9 Mill Lane', status: 'Corrections required', tone: 'destructive' },
    { permit: 'P-2024-0112', address: '5 Orchard Court', status: 'In review', tone: 'neutral' },
    { permit: 'F-2024-0040', address: '31 Station Way', status: 'Withdrawn', tone: 'dim' },
  ];
  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        <ToneBadge>In review</ToneBadge>
        <ToneBadge tone="ok">Issued</ToneBadge>
        <ToneBadge tone="info">Scheduled</ToneBadge>
        <ToneBadge tone="warning">Awaiting payment</ToneBadge>
        <ToneBadge tone="destructive">Expired</ToneBadge>
        <ToneBadge tone="muted">Withdrawn</ToneBadge>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Permit</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.permit}>
              <TableCell>{r.permit}</TableCell>
              <TableCell>{r.address}</TableCell>
              <TableCell>
                <ToneBadge tone={r.tone}>{r.status}</ToneBadge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ReadoutDemo() {
  return (
    <div className="flex flex-wrap gap-10">
      <Readout label="Open applications" value="1,284" />
      <Readout label="Drafts" value="37" tone="dim" />
      <Readout label="Awaiting payment" value="52" tone="warning" />
      <Readout label="Overdue inspections" value="9" tone="destructive" />
      <Readout label="Issued this month" value="418" tone="ok" />
    </div>
  );
}

function MeterDemo() {
  return (
    <div className="flex flex-col gap-6">
      <Meter label="Inspections passed" value={3} total={5} />
      <Meter label="Documents received" value={7} total={8} tone="ok" />
      <Meter label="Corrections outstanding" value={2} total={6} tone="destructive" />
    </div>
  );
}

function DistributionDemo() {
  return (
    <div className="flex w-full max-w-xl flex-col gap-8">
      <Distribution
        label="Applications"
        parts={[
          { name: 'Submitted', count: 64 },
          { name: 'In review', count: 112 },
          { name: 'Corrections', count: 28 },
          { name: 'Approved', count: 203 },
          { name: 'Withdrawn', count: 9 },
        ]}
      />
      <Distribution
        label="Permits issued by type"
        parts={[
          { name: 'Building', count: 184 },
          { name: 'Electrical', count: 121 },
          { name: 'Plumbing', count: 96 },
          { name: 'Mechanical', count: 74 },
          { name: 'Demolition', count: 22 },
          { name: 'Sign', count: 31 },
          { name: 'Fence', count: 48 },
          { name: 'Solar', count: 57 },
        ]}
      />
      <Distribution
        label="Inspections this week"
        parts={[
          { name: 'Passed', count: 41, tone: 'ok' },
          { name: 'Failed', count: 6, tone: 'destructive' },
          { name: 'Scheduled', count: 18, tone: 'info', dashed: true },
        ]}
      />
    </div>
  );
}

function SealDemo() {
  return (
    <div className="flex flex-wrap items-center gap-8">
      <Seal top="City of Riverton" bottom="Permit B-2024-0193" word="Issued" />
      <Seal top="Building Department" bottom="Plan review 04/12/2024" word="Approved" size={140} />
      <Seal top="Fire Marshal" bottom="Occupancy cert. 2024-031" word="Certified" tone="neutral" size={100} />
    </div>
  );
}

type Source = 'all' | 'staff' | 'automation' | 'applicant';
type Activity = { id: number; time: string; source: Exclude<Source, 'all'>; text: string; tone?: EventLogTone; end?: ReactNode };

const SOURCE_LABEL = { staff: 'Staff', automation: 'Automation', applicant: 'Applicant' } as const;
const SOURCE_BADGE = { staff: 'default', automation: 'sky', applicant: 'field' } as const;

function EventLogDemo() {
  const [source, setSource] = useState<Source>('all');
  const [events, setEvents] = useState<Activity[]>([
    { id: 5, time: 'Today, 2:14 PM', source: 'staff', text: 'Framing inspection passed (J. Ortiz)', tone: 'ok' },
    { id: 4, time: 'Today, 9:02 AM', source: 'automation', text: 'Reminder sent: inspection tomorrow' },
    {
      id: 3,
      time: 'Yesterday, 4:40 PM',
      source: 'staff',
      text: 'Corrections requested on sheet A-201',
      tone: 'destructive',
      end: <ToneBadge tone="destructive">Open</ToneBadge>,
    },
    { id: 2, time: 'Mar 3, 11:15 AM', source: 'applicant', text: 'Plan review fee paid: $812.50', tone: 'ok' },
    { id: 1, time: 'Mar 2, 3:30 PM', source: 'applicant', text: 'Application submitted' },
  ]);
  const next = useRef(6);
  const shown = source === 'all' ? events : events.filter((e) => e.source === source);
  return (
    <div className="flex w-full max-w-xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <EventLogFilter<Source>
          value={source}
          onValueChange={setSource}
          options={[
            { value: 'all', label: 'All' },
            { value: 'staff', label: 'Staff' },
            { value: 'automation', label: 'Automation' },
            { value: 'applicant', label: 'Applicant' },
          ]}
        />
        <button
          type="button"
          className="text-sm underline underline-offset-4 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring"
          onClick={() =>
            setEvents((list) => [
              { id: next.current++, time: 'Just now', source: 'automation', text: 'Certificate of occupancy drafted', tone: 'info' },
              ...list,
            ])
          }
        >
          Add an event
        </button>
      </div>
      <EventLog aria-label="Permit B-2024-0193 activity">
        {shown.length === 0 && <EventLogEmpty>No activity from this source.</EventLogEmpty>}
        {shown.map((e) => (
          <EventLogItem key={e.id} time={e.time} tag={SOURCE_LABEL[e.source]} tagVariant={SOURCE_BADGE[e.source]} tone={e.tone} end={e.end}>
            {e.text}
          </EventLogItem>
        ))}
      </EventLog>
    </div>
  );
}

function UseHotkeysDemo() {
  const [last, setLast] = useState('Nothing yet');
  const [index, setIndex] = useState(0);
  const search = useRef<HTMLInputElement>(null);
  const queue = ['B-2024-0193', 'B-2024-0201', 'E-2024-0077', 'P-2024-0112'];
  useHotkeys({
    j: () => setIndex((i) => Math.min(i + 1, queue.length - 1)),
    k: () => setIndex((i) => Math.max(i - 1, 0)),
    a: () => setLast(`Approved ${queue[index]}`),
    '/': () => search.current?.focus(),
  });
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <Input ref={search} placeholder="Search permits (press /)" aria-label="Search permits" />
      <ul className="flex flex-col border border-border">
        {queue.map((p, i) => (
          <li key={p} aria-current={i === index ? 'true' : undefined} className={i === index ? 'bg-accent px-4 py-2' : 'px-4 py-2'}>
            {p}
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {last}
      </p>
      <KeyHints>
        <KeyHint keys={['J', 'K']}>move</KeyHint>
        <KeyHint keys={['A']}>approve</KeyHint>
        <KeyHint keys={['/']}>search</KeyHint>
      </KeyHints>
    </div>
  );
}

function KeyHintsDemo() {
  return (
    <div className="flex flex-col gap-6">
      <KeyHints>
        <KeyHint keys={['A']}>approve</KeyHint>
        <KeyHint keys={['J', 'K']}>next / previous</KeyHint>
        <KeyHint keys={['⌘', 'K']}>search</KeyHint>
        <KeyHint keys={['1', '9']} range>
          open tab
        </KeyHint>
      </KeyHints>
      <KeyHints className="flex-wrap border-t border-border pt-4">
        <KeyHint keys={['R']}>request corrections</KeyHint>
        <KeyHint keys={['S']}>schedule inspection</KeyHint>
        <KeyHint keys={['Esc']}>close</KeyHint>
      </KeyHints>
    </div>
  );
}

// figures in hairline tiles, each with its kind's icon on a tint: the
// caseload strip and a permit's header in govwell-cqrs
function FigureIconDemo() {
  const figures = [
    { label: 'Open steps', value: '38', tone: 'info', icon: ListChecks, tint: 'sky' },
    { label: 'Collected all time', value: '$16,627.26', tone: 'ok', icon: Wallet, tint: 'teal' },
    { label: 'Balance due', value: '$6,448.30', tone: 'warning', icon: Receipt, tint: 'amber' },
    { label: 'Valid until', value: '4/27/2027', tone: 'neutral', icon: CalendarClock, tint: 'hope' },
  ] as const;
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(12rem,1fr))] border-t border-l border-border">
      {figures.map((f) => (
        <div key={f.label} className="flex items-start justify-between gap-3 border-r border-b border-border p-5 whitespace-nowrap">
          <Readout label={f.label} value={f.value} tone={f.tone} />
          <FigureIcon icon={f.icon} tint={f.tint} />
        </div>
      ))}
    </div>
  );
}

function VerdictDemo() {
  return (
    <div className="flex flex-col items-start gap-3">
      <Verdict kind="pass" subject="Zoning">
        Approved
      </Verdict>
      <Verdict kind="noted" subject="Building">
        Approved as noted
      </Verdict>
      <Verdict kind="revise" subject="Fire">
        Revise and resubmit
      </Verdict>
      <Verdict kind="pending" subject="Engineering">
        In review
      </Verdict>
      <div className="flex gap-3">
        <Verdict kind="pass">Passed</Verdict>
        <Verdict kind="fail">Failed</Verdict>
      </div>
    </div>
  );
}

export const INSTRUMENTS_DEMOS: Record<string, () => ReactNode> = {
  'tone-badge': ToneBadgeDemo,
  readout: ReadoutDemo,
  verdict: VerdictDemo,
  'figure-icon': FigureIconDemo,
  meter: MeterDemo,
  distribution: DistributionDemo,
  seal: SealDemo,
  'event-log': EventLogDemo,
  'use-hotkeys': UseHotkeysDemo,
  'key-hints': KeyHintsDemo,
};
