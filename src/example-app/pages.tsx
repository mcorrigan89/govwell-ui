import { useMemo, useState, type ComponentType, type ReactNode } from 'react';
import {
  ArrowLeft,
  BarChart3,
  Bell,
  Check,
  ClipboardCheck,
  Construction,
  FileStack,
  FileText,
  Lock,
  Mail,
  MoreVertical,
  Plus,
  Printer,
  Share2,
  Timer,
  Users,
  Wallet,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';

import { DataTable, dataTableColumns } from '@/components/blocks/data-table';
import { FigureIcon } from '@/components/ui/figure-icon';
import { Verdict } from '@/components/ui/verdict';
import { WeekCalendar } from '@/components/blocks/week-calendar';
import { ActorBadge } from '@/components/ui/actor-badge';
import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from '@/components/ui/attachment';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Deadline } from '@/components/ui/deadline';
import { DescriptionDetails, DescriptionItem, DescriptionList, DescriptionTerm } from '@/components/ui/description-list';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { EventLog, EventLogEmpty, EventLogItem } from '@/components/ui/event-log';
import { SegmentedControl, SegmentedControlItem } from '@/components/ui/segmented-control';
import { Separator } from '@/components/ui/separator';
import { Stat, StatLabel, StatValue } from '@/components/ui/stat';
import { StatusBadge } from '@/components/ui/status-badge';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import {
  findRecord,
  INSPECTIONS,
  isOpen,
  issuedByMonth,
  ME,
  money,
  RECORD_TYPES,
  recordsOfType,
  RECORDS,
  shortDate,
  STAFF,
  STATUSES,
  startOfToday,
  WORKFLOW,
  type PermitRecord,
  type StatusKey,
} from './data';

// ── the page frame: GovWell's <Page>, a padded header over a padded body ─────

const gutter = 'px-4 md:px-6';

function Page({
  icon: Icon,
  title,
  subtitle,
  back,
  actions,
  children,
}: {
  icon?: ComponentType<{ className?: string }>;
  title: ReactNode;
  subtitle?: ReactNode;
  back?: { href: string; label: string };
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <header className={cn('flex flex-col gap-3 pt-4 md:pt-6', gutter)}>
        {back && (
          <a
            href={back.href}
            className="flex w-fit items-center gap-1.5 text-sm font-light text-muted-foreground outline-none hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring"
          >
            <ArrowLeft className="size-3.5" />
            {back.label}
          </a>
        )}
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
          <div className="flex min-w-0 items-start gap-3">
            {Icon && <Icon className="mt-2 size-6 shrink-0 text-muted-foreground" />}
            <div className="flex min-w-0 flex-col gap-1">
              <h1 className="text-3xl leading-tight font-normal tracking-tight">{title}</h1>
              {subtitle && <div className="text-base font-light text-muted-foreground">{subtitle}</div>}
            </div>
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      </header>
      <div className={cn('flex flex-1 flex-col gap-6 py-4 md:py-6', gutter)}>{children}</div>
    </div>
  );
}

function IconAction({ label, icon: Icon, onClick }: { label: string; icon: ComponentType<{ className?: string }>; onClick?: () => void }) {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant="ghost" size="icon-sm" aria-label={label} onClick={onClick} />}>
        <Icon />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

const go = (href: string) => {
  location.hash = href;
};

// ── Insights ─────────────────────────────────────────────────────────────────

const CHART_CONFIG = {
  building: { label: 'Building', color: 'var(--chart-1)' },
  zoning: { label: 'Zoning', color: 'var(--chart-2)' },
} satisfies ChartConfig;

export function InsightsPage() {
  const [period, setPeriod] = useState<'4w' | 'quarter' | 'year'>('4w');
  const scale = period === '4w' ? 1 : period === 'quarter' ? 3 : 12;
  const months = useMemo(() => issuedByMonth(), []);
  const open = RECORDS.filter(isOpen);
  const byStatus = (Object.keys(STATUSES) as StatusKey[])
    .map((key) => ({ key, status: STATUSES[key], count: RECORDS.filter((r) => r.statusKey === key).length }))
    .filter((s) => s.count > 0);
  const most = Math.max(...byStatus.map((s) => s.count));

  return (
    <Page
      icon={BarChart3}
      title="Insights"
      actions={
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer data-icon="inline-start" /> Print
        </Button>
      }
    >
      <div className="flex flex-wrap items-center gap-3">
        <SegmentedControl aria-label="Period" value={period} onValueChange={setPeriod} size="sm" fitContent>
          <SegmentedControlItem value="4w">Past 4 weeks</SegmentedControlItem>
          <SegmentedControlItem value="quarter">Quarter</SegmentedControlItem>
          <SegmentedControlItem value="year">Year</SegmentedControlItem>
        </SegmentedControl>
        <span className="text-sm text-muted-foreground">All record types</span>
      </div>
      <Separator />

      <Section title="Overview" description="What came in, how fast it went out, and what it brought in.">
        <div className="grid grid-cols-2 border-t border-l border-border lg:grid-cols-4">
          {[
            { value: String(Math.round(RECORDS.length * 0.6 * scale)), label: 'Records created', icon: FileStack, tint: 'sky' as const },
            { value: `${Math.max(6, 14 - scale)} days`, label: 'Median issuance time', icon: Timer, tint: 'hope' as const },
            { value: money(18_400 * scale), label: 'Revenue collected', icon: Wallet, tint: 'field' as const },
            { value: String(INSPECTIONS.length * 4 * scale), label: 'Inspections logged', icon: ClipboardCheck, tint: 'teal' as const },
          ].map((s) => (
            <div key={s.label} className="flex items-start justify-between gap-3 border-r border-b border-border p-5">
              <Stat>
                <StatValue className="text-4xl">{s.value}</StatValue>
                <StatLabel>{s.label}</StatLabel>
              </Stat>
              <FigureIcon icon={s.icon} tint={s.tint} />
            </div>
          ))}
        </div>
      </Section>

      <div className="grid gap-6 xl:grid-cols-[3fr_2fr]">
        <Section title="Records created" description="By month and record type.">
          <ChartContainer config={CHART_CONFIG} className="h-64 w-full">
            <BarChart data={months} accessibilityLayer>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} width={32} />
              <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="building" stackId="a" fill="var(--color-building)" />
              <Bar dataKey="zoning" stackId="a" fill="var(--color-zoning)" />
            </BarChart>
          </ChartContainer>
        </Section>
        <Section title="Where records are" description={`${open.length} open across both modules.`}>
          <ul className="grid grid-cols-[max-content_1fr_2rem] items-center gap-x-3 gap-y-3">
            {byStatus.map((s) => (
              <li key={s.key} className="contents">
                <StatusBadge status={s.status} />
                <span className="h-2 bg-muted">
                  <span className="block h-full bg-secondary" style={{ width: `${(s.count / most) * 100}%` }} />
                </span>
                <span className="text-right text-sm tabular-nums">{s.count}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </Page>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-normal">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

// ── Records list ─────────────────────────────────────────────────────────────

type View = 'todo' | 'waiting' | 'expiring' | 'all';
const VIEWS: { id: View; label: string; test: (r: PermitRecord) => boolean }[] = [
  { id: 'todo', label: 'To do', test: (r) => ['submitted', 'review', 'inspections'].includes(r.statusKey) },
  { id: 'waiting', label: 'Waiting', test: (r) => r.statusKey === 'waiting' },
  {
    id: 'expiring',
    label: 'Due soon',
    test: (r) => isOpen(r) && !!r.due && r.due.getTime() - startOfToday().getTime() < 7 * 86_400_000,
  },
  { id: 'all', label: 'All', test: () => true },
];

const col = dataTableColumns<PermitRecord>();
const COLUMNS = col.columns([
  col.accessor('number', {
    header: 'Record #',
    cell: (c) => (
      <a
        href={`#/records/${c.row.original.typeId}/${c.row.original.id}`}
        onClick={(e) => e.stopPropagation()}
        className="font-normal underline decoration-border underline-offset-4 hover:decoration-foreground"
      >
        {c.getValue()}
      </a>
    ),
  }),
  col.accessor('applicant', { header: 'Applicant' }),
  col.accessor('address', { header: 'Address' }),
  col.accessor('kind', { header: 'Record type' }),
  col.accessor((r) => WORKFLOW[Math.min(r.step, WORKFLOW.length - 1)], { id: 'step', header: 'Current step' }),
  col.accessor((r) => r.status.name, { id: 'status', header: 'Status', cell: (c) => <StatusBadge status={c.row.original.status} /> }),
  col.accessor((r) => r.assignee?.name ?? '', {
    id: 'owner',
    header: 'Record owner',
    cell: (c) => c.getValue() || <span className="text-muted-foreground">No owner</span>,
  }),
  col.accessor((r) => r.submitted.getTime(), { id: 'submitted', header: 'Submitted', cell: (c) => shortDate(new Date(c.getValue())) }),
  col.accessor((r) => r.due?.getTime() ?? Infinity, {
    id: 'due',
    header: 'Due',
    cell: (c) => (c.row.original.due ? <Deadline due={c.row.original.due} /> : <span className="text-muted-foreground">—</span>),
  }),
]);

export function RecordsPage({ typeId }: { typeId: string }) {
  const type = RECORD_TYPES.find((t) => t.id === typeId)!;
  const all = recordsOfType(typeId);
  const [view, setView] = useState<View>('todo');
  const rows = all.filter(VIEWS.find((v) => v.id === view)!.test);

  return (
    <Page
      icon={typeId === 'building' ? Construction : FileText}
      title={type.name}
      actions={
        <Button
          size="sm"
          onClick={() => toast('This sample doesn’t take new applications', { description: 'The intake form lives in GovWell.' })}
        >
          <Plus data-icon="inline-start" /> New permit
        </Button>
      }
    >
      <Tabs value={view} onValueChange={(v) => setView(v as View)}>
        <TabsList variant="line" aria-label="Saved views">
          {VIEWS.map((v) => (
            <TabsTrigger key={v.id} value={v.id}>
              {v.label}
              <Badge variant="ash" className="tabular-nums">
                {all.filter(v.test).length}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <DataTable
        key={view}
        columns={COLUMNS}
        data={rows}
        getRowId={(r) => r.id}
        rowLabel={(r) => r.number}
        pageSize={15}
        filterPlaceholder="Search"
        searchShortcut
        selectable={isOpen}
        stickyHeader
        onRowClick={(r) => go(`/records/${r.typeId}/${r.id}`)}
        emptyTitle="No records found"
        emptyDescription="Nothing in this view right now."
        bulkActions={(selected, clear) => (
          <>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                toast.success(`Reassigned ${selected.length} ${selected.length === 1 ? 'record' : 'records'} to ${ME.name}`);
                clear();
              }}
            >
              <Users data-icon="inline-start" /> Reassign to me
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                toast(`Closed ${selected.length} ${selected.length === 1 ? 'record' : 'records'}`);
                clear();
              }}
            >
              Close
            </Button>
          </>
        )}
      />
    </Page>
  );
}

// ── one record ───────────────────────────────────────────────────────────────

// the tab a record opens on follows its step, as in GovWell
const tabForStep = (step: number) => (step === 1 ? 'files' : step === 2 ? 'fees' : step === 4 ? 'inspections' : 'details');

export function RecordPage({ id }: { id: string }) {
  const found = findRecord(id);
  const [step, setStep] = useState(found?.step ?? 0);
  if (!found) return <PlaceholderPage title="Record not found" />;
  const record = found;
  const type = RECORD_TYPES.find((t) => t.id === record.typeId)!;
  const status =
    step >= WORKFLOW.length ? STATUSES.closed : step === record.step ? record.status : step >= 4 ? STATUSES.inspections : STATUSES.review;
  const unpaid = record.fees.filter((f) => !f.paid && step <= 2).length;
  const inspections = INSPECTIONS.filter((i) => i.recordId === record.id);

  return (
    <Page
      icon={record.typeId === 'building' ? Construction : FileText}
      back={{ href: `#/records/${record.typeId}`, label: type.name }}
      title={
        <>
          {record.kind} <span className="text-muted-foreground">#{record.number}</span>
        </>
      }
      subtitle={
        <span className="flex flex-wrap items-center gap-3">
          {record.address}, Alder Falls
          <StatusBadge status={status} />
        </span>
      }
      actions={
        <>
          <IconAction label="Alerts" icon={Bell} onClick={() => toast('No alerts on this record')} />
          <IconAction label="Email the applicant" icon={Mail} onClick={() => toast(`Draft to ${record.applicantEmail}`)} />
          <IconAction label="Share" icon={Share2} onClick={() => toast('Link copied')} />
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="More actions" />}>
              <MoreVertical />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => toast.success(`Assigned to ${ME.name}`)}>Assign to me</DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast('Expiration set to one year from issuance')}>Set expiration</DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.print()}>Print</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-error" onClick={() => setStep(WORKFLOW.length)}>
                Close record
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      }
    >
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-0">
        <div className="min-w-0 flex-1 lg:pr-6">
          <Tabs defaultValue={tabForStep(record.step)}>
            <TabsList variant="line" aria-label="Record">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="inspections">
                Inspections
                {inspections.length > 0 && (
                  <Badge variant="ash" className="tabular-nums">
                    {inspections.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="fees">
                Fees
                {unpaid > 0 && <Badge>{unpaid} unpaid</Badge>}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="pt-6">
              <DetailsTab record={record} status={status} />
            </TabsContent>
            <TabsContent value="files" className="pt-6">
              <FilesTab record={record} />
            </TabsContent>
            <TabsContent value="inspections" className="pt-6">
              <InspectionsTab record={record} />
            </TabsContent>
            <TabsContent value="activity" className="pt-6">
              <ActivityTab record={record} />
            </TabsContent>
            <TabsContent value="fees" className="pt-6">
              <FeesTab record={record} paid={step > 2} />
            </TabsContent>
          </Tabs>
        </div>
        <Workflow record={record} step={step} onAdvance={() => setStep((s) => s + 1)} />
      </div>
    </Page>
  );
}

function DetailsTab({ record, status }: { record: PermitRecord; status: { name: string; color: string } }) {
  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Applicant</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-hope-tint text-sm text-tint-foreground">
            {record.applicant
              .split(/\s+/)
              .slice(0, 2)
              .map((w) => w[0])
              .join('')}
          </span>
          <span className="flex flex-col">
            <span>{record.applicant}</span>
            <span className="text-sm text-muted-foreground">{record.applicantEmail}</span>
          </span>
        </CardContent>
      </Card>
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-normal">Overview</h2>
        <DescriptionList layout="inline" divided>
          {(
            [
              ['Record owner', record.assignee?.name ?? 'No owner'],
              ['Record type', record.kind],
              ['Status', <StatusBadge key="s" status={status} />],
              ['Permit #', record.number],
              ['Submittal date', record.submitted.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })],
              ['Parcel', record.parcel],
              ...(record.valuation ? [['Declared valuation', money(record.valuation)] as const] : []),
            ] as const
          ).map(([term, value]) => (
            <DescriptionItem key={term}>
              <DescriptionTerm>{term}</DescriptionTerm>
              <DescriptionDetails>{value}</DescriptionDetails>
            </DescriptionItem>
          ))}
        </DescriptionList>
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-normal">Project description</h2>
        <p className="max-w-prose">{record.description}</p>
      </section>
    </div>
  );
}

function FilesTab({ record }: { record: PermitRecord }) {
  const slug = record.address.toLowerCase().replace(/\s+/g, '-');
  const files = [
    { name: `site-plan-${slug}.pdf`, meta: '2.4 MB · PDF' },
    { name: `construction-drawings-${slug}.pdf`, meta: '11.8 MB · PDF' },
    { name: 'contractor-license.pdf', meta: '310 KB · PDF' },
  ];
  return (
    <div className="flex flex-col gap-2">
      {files.map((f) => (
        <Attachment key={f.name}>
          <AttachmentMedia>
            <FileText />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>{f.name}</AttachmentTitle>
            <AttachmentDescription>{f.meta}</AttachmentDescription>
          </AttachmentContent>
          <AttachmentTrigger aria-label={`Open ${f.name}`} onClick={() => toast(`Opening ${f.name}`)} />
        </Attachment>
      ))}
    </div>
  );
}

function InspectionsTab({ record }: { record: PermitRecord }) {
  const list = INSPECTIONS.filter((i) => i.recordId === record.id);
  if (list.length === 0)
    return (
      <Empty className="border border-dashed border-border">
        <EmptyHeader>
          <EmptyTitle>No inspections yet</EmptyTitle>
          <EmptyDescription>Inspections open once the permit is issued.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  return (
    <ul className="flex flex-col divide-y divide-border border border-border">
      {list.map((i) => (
        <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <span className="flex flex-col">
            <span>{i.title}</span>
            <span className="text-sm text-muted-foreground">
              {i.start.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} ·{' '}
              {i.inspector.name}
            </span>
          </span>
          {i.result ? (
            <Verdict kind={i.result === 'passed' ? 'pass' : 'fail'}>{i.result === 'passed' ? 'Passed' : 'Failed'}</Verdict>
          ) : (
            <Badge variant="sky">Scheduled</Badge>
          )}
        </li>
      ))}
    </ul>
  );
}

function ActivityTab({ record }: { record: PermitRecord }) {
  const [when, setWhen] = useState<'history' | 'future'>('history');
  const d = (days: number) => shortDate(new Date(record.submitted.getTime() + days * 86_400_000));
  const history = [
    { id: 'a', time: d(0), tag: 'Applicant', tone: 'info' as const, text: `${record.applicant} submitted the application` },
    { id: 'b', time: d(0), tag: 'Automation', tone: 'muted' as const, text: 'Application fee of $75 paid online' },
    ...(record.assignee
      ? [{ id: 'c', time: d(1), tag: 'Staff', tone: 'default' as const, text: `${record.assignee.name} took ownership` }]
      : []),
    ...(record.step >= 1
      ? [{ id: 'e', time: d(3), tag: 'AutoCheck', tone: 'muted' as const, text: 'AutoCheck found 2 plan review comments' }]
      : []),
    ...(record.statusKey === 'waiting'
      ? [{ id: 'f', time: d(5), tag: 'Staff', tone: 'warning' as const, text: 'Corrections requested: guard rail height on sheet A-2' }]
      : []),
  ].reverse();
  return (
    <div className="flex flex-col gap-4">
      <SegmentedControl aria-label="Activity" value={when} onValueChange={setWhen} size="sm" fitContent>
        <SegmentedControlItem value="history">History</SegmentedControlItem>
        <SegmentedControlItem value="future">Future</SegmentedControlItem>
      </SegmentedControl>
      <EventLog aria-label={`${record.number} activity`}>
        {when === 'future' ? (
          <EventLogEmpty>No scheduled emails or reminders.</EventLogEmpty>
        ) : (
          history.map((e) => (
            <EventLogItem key={e.id} time={e.time} tag={e.tag} tagVariant="ash" tone={e.tone}>
              {e.text}
            </EventLogItem>
          ))
        )}
      </EventLog>
    </div>
  );
}

function FeesTab({ record, paid }: { record: PermitRecord; paid: boolean }) {
  const total = record.fees.reduce((s, f) => s + f.amount, 0);
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fee</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {record.fees.map((f) => (
          <TableRow key={f.name}>
            <TableCell>{f.name}</TableCell>
            <TableCell>{f.paid || paid ? <Badge variant="field">Paid</Badge> : <Badge>Unpaid</Badge>}</TableCell>
            <TableCell className="text-right tabular-nums">{money(f.amount)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={2}>Total</TableCell>
          <TableCell className="text-right tabular-nums">{money(total)}</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}

// the workflow column: done steps collapse to a line, the current step is a
// card with its owner, due date and the action that moves it on, and the
// steps ahead are locked
const STEP_ACTION = ['Accept application', 'Complete review', 'Mark fees paid', 'Issue permit', 'Pass final inspection', 'Close record'];

function Workflow({ record, step, onAdvance }: { record: PermitRecord; step: number; onAdvance: () => void }) {
  return (
    <aside aria-label="Workflow" className="flex flex-col gap-3 lg:w-1/3 lg:shrink-0 lg:border-l lg:border-border lg:pl-5">
      <h2 className="text-xl font-normal">Workflow</h2>
      <ol className="flex flex-col gap-2">
        {WORKFLOW.map((name, i) =>
          i < step ? (
            <li key={name} className="flex items-center gap-3 px-1 py-1.5 text-sm">
              {/* done on Field, as the permit's workflow in govwell-cqrs */}
              <span className="grid size-5 place-items-center bg-field-tint text-tint-foreground">
                <Check className="size-3" />
              </span>
              {name}
            </li>
          ) : i === step ? (
            <li key={name}>
              <Card className="gap-4 border-foreground">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <span className="size-2.5 bg-primary" aria-hidden />
                    {name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <DescriptionList layout="inline">
                    <DescriptionItem>
                      <DescriptionTerm>Assigned to</DescriptionTerm>
                      <DescriptionDetails>{record.assignee?.name ?? STAFF[1]!.name}</DescriptionDetails>
                    </DescriptionItem>
                    <DescriptionItem>
                      <DescriptionTerm>Due date</DescriptionTerm>
                      <DescriptionDetails>{record.due ? <Deadline due={record.due} /> : '—'}</DescriptionDetails>
                    </DescriptionItem>
                  </DescriptionList>
                  {i === 1 && (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ActorBadge type="ai" name="AutoCheck" /> left 2 comments on the drawings
                    </p>
                  )}
                  <Button
                    size="sm"
                    onClick={() => {
                      onAdvance();
                      toast.success(`${name} done`, {
                        description: WORKFLOW[i + 1] ? `Next: ${WORKFLOW[i + 1]}` : 'The record is closed.',
                      });
                    }}
                  >
                    {STEP_ACTION[i]}
                  </Button>
                </CardContent>
              </Card>
            </li>
          ) : (
            <li key={name}>
              <Tooltip>
                <TooltipTrigger
                  render={<button type="button" aria-disabled aria-label={`${name}: locked`} />}
                  className="flex w-full items-center gap-3 border border-dashed border-border px-3 py-2.5 text-sm text-muted-foreground outline-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-ring"
                >
                  <Lock className="size-3.5" />
                  {name}
                </TooltipTrigger>
                <TooltipContent>The workflow has not reached this step yet.</TooltipContent>
              </Tooltip>
            </li>
          ),
        )}
      </ol>
    </aside>
  );
}

// ── Inspection calendar ──────────────────────────────────────────────────────

export function CalendarPage() {
  const events = INSPECTIONS.map((i) => {
    const rec = findRecord(i.recordId)!;
    return {
      id: i.id,
      title: i.title,
      subtitle: `${i.address} · ${rec.number}`,
      meta: i.inspector.name,
      start: i.start,
      end: new Date(i.start.getTime() + i.minutes * 60_000),
      tone: i.result === 'failed' ? ('destructive' as const) : i.result === 'passed' ? ('ok' as const) : ('info' as const),
      done: !!i.result,
      href: `#/records/${rec.typeId}/${rec.id}`,
    };
  });
  return (
    <Page title="Inspection Calendar" subtitle={`${events.length} inspections booked this week`}>
      <WeekCalendar events={events} startHour={7} endHour={17} />
    </Page>
  );
}

// ── everything the sample doesn't build ─────────────────────────────────────

export function PlaceholderPage({ title, group }: { title: string; group?: string }) {
  return (
    <Page title={group ? `${group}: ${title}` : title}>
      <Empty className="border border-dashed border-border py-16">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Construction />
          </EmptyMedia>
          <EmptyTitle>Not in this sample</EmptyTitle>
          <EmptyDescription>
            This page is part of GovWell; the sample builds the permits list, a permit, Insights and the calendar.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <a href="#/records/building" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            Go to Building Permits
          </a>
        </EmptyContent>
      </Empty>
    </Page>
  );
}
