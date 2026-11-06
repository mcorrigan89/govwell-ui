import { useState, type ReactNode } from 'react';
import { CircleCheck, ClipboardCheck, Info, OctagonX, TriangleAlert, X } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import type { DateRange } from 'react-day-picker';
import { toast } from 'sonner';

import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { Progress, ProgressLabel, ProgressValue } from '@/components/ui/progress';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Toaster } from '@/components/ui/sonner';
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Demos for the data group: progress, scroll-area, resizable, calendar,
// date-picker, carousel, chart, sonner, alert and table.

const ACTIVITY = [
  { time: '9:02', text: 'Application BP-2026-0418 submitted' },
  { time: '9:03', text: 'Fees assessed: $1,240.00' },
  { time: '9:15', text: 'Payment received' },
  { time: '9:16', text: 'Routed to Building review' },
  { time: '10:40', text: 'Routed to Zoning review' },
  { time: '11:05', text: 'Zoning: approved with conditions' },
  { time: '13:22', text: 'Building: corrections requested' },
  { time: '13:23', text: 'Applicant notified by email' },
  { time: '15:48', text: 'Revised plans uploaded' },
  { time: '15:49', text: 'Resubmitted to Building review' },
  { time: '16:30', text: 'Fire: approved' },
  { time: '16:31', text: 'Building: approved' },
  { time: '16:32', text: 'Permit issued' },
  { time: '16:33', text: 'Inspection scheduling opened' },
];

// permits issued by month (illustrative)
const PERMITS = [
  { month: 'Jun', building: 182, trade: 124 },
  { month: 'Jul', building: 205, trade: 141 },
  { month: 'Aug', building: 196, trade: 150 },
  { month: 'Sep', building: 168, trade: 133 },
  { month: 'Oct', building: 214, trade: 162 },
  { month: 'Nov', building: 158, trade: 119 },
];

const PERMITS_CONFIG = {
  building: { label: 'Building', color: 'var(--chart-1)' },
  trade: { label: 'Trade', color: 'var(--chart-2)' },
} satisfies ChartConfig;

const SPOTLIGHTS = [
  { place: 'Town of Hillsborough', note: 'Moved every permit type online in 90 days.', tile: 'bg-hope-tint' },
  { place: 'City of Lakeview', note: 'Cut plan review turnaround from 21 days to 9.', tile: 'bg-sky-tint' },
  { place: 'Marion County', note: 'Inspectors now schedule and result from the field.', tile: 'bg-field-tint' },
  { place: 'Village of Elm Park', note: 'Residents pay fees and track status in one place.', tile: 'bg-ash-tint' },
];

const FEES = [
  { code: 'BLD-101', item: 'Building permit, new dwelling', basis: 'valuation table', amount: 1250, status: 'Paid' },
  { code: 'BLD-204', item: 'Plan review', basis: '65% of permit fee', amount: 812.5, status: 'Paid' },
  { code: 'ELE-110', item: 'Electrical, residential', basis: 'flat', amount: 150, status: 'Due' },
  { code: 'PLM-110', item: 'Plumbing, residential', basis: 'flat', amount: 125, status: 'Due' },
  { code: 'TEC-001', item: 'Technology surcharge', basis: '4% of total', amount: 93.5, status: 'Due' },
] as const;

const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

function CalendarDemo() {
  const [range, setRange] = useState<DateRange | undefined>({ from: new Date(2026, 10, 16), to: new Date(2026, 10, 19) });
  return <Calendar mode="range" selected={range} onSelect={setRange} defaultMonth={new Date(2026, 10, 1)} />;
}

function DatePickerDemo() {
  const [day, setDay] = useState<Date | undefined>();
  return (
    <div className="grid max-w-xs gap-2">
      <Label htmlFor="demo-inspection-date">Inspection date</Label>
      <DatePicker
        id="demo-inspection-date"
        value={day}
        onValueChange={setDay}
        calendar={{ defaultMonth: new Date(2026, 10, 1), disabled: { dayOfWeek: [0, 6] } }}
      />
      <p className="text-sm text-muted-foreground">{day ? `Requested for ${day.toDateString()}.` : 'Inspections run Monday to Friday.'}</p>
    </div>
  );
}

function AlertDemo() {
  return (
    <div className="flex max-w-2xl flex-col gap-3">
      <Alert variant="ok">
        <CircleCheck />
        <AlertTitle>Permit issued</AlertTitle>
        <AlertDescription>BP-2026-0418 is approved. You can now schedule inspections.</AlertDescription>
      </Alert>
      <Alert variant="warning">
        <TriangleAlert />
        <AlertTitle>Corrections requested</AlertTitle>
        <AlertDescription>Building review needs a revised site plan showing setbacks.</AlertDescription>
        <AlertAction>
          <Button size="icon-sm" variant="ghost" aria-label="Dismiss">
            <X />
          </Button>
        </AlertAction>
      </Alert>
      <Alert variant="info">
        <Info />
        <AlertTitle>In review</AlertTitle>
        <AlertDescription>
          <p>Zoning and Fire are reviewing your application. Most reviews finish within 10 business days.</p>
          <p>
            <a href="#table">See the fee schedule</a>
          </p>
        </AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <OctagonX />
        <AlertTitle>Payment failed</AlertTitle>
        <AlertDescription>The card was declined. Your application is saved; try another payment method.</AlertDescription>
      </Alert>
      <Alert>
        <ClipboardCheck />
        <AlertTitle>Draft saved</AlertTitle>
      </Alert>
    </div>
  );
}

function TableDemo() {
  const total = FEES.reduce((sum, f) => sum + f.amount, 0);
  return (
    <div className="max-w-3xl border border-border">
      <Table>
        <TableCaption>Fees assessed for BP-2026-0418.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Fee</TableHead>
            <TableHead>Basis</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {FEES.map((f) => (
            <TableRow key={f.code}>
              <TableCell className="text-muted-foreground">{f.code}</TableCell>
              <TableCell className="font-normal">{f.item}</TableCell>
              <TableCell>{f.basis}</TableCell>
              <TableCell>
                <Badge variant={f.status === 'Paid' ? 'field' : 'ash'}>{f.status}</Badge>
              </TableCell>
              <TableCell className="text-right">{money(f.amount)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={4}>Total</TableCell>
            <TableCell className="text-right">{money(total)}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}

export const DATA_DEMOS: Record<string, () => ReactNode> = {
  progress: () => (
    <div className="grid max-w-sm gap-6">
      <Progress value={60}>
        <ProgressLabel>Application, step 3 of 5</ProgressLabel>
        <ProgressValue />
      </Progress>
      <Progress value={100} tone="ok">
        <ProgressLabel>Reviews complete</ProgressLabel>
        <ProgressValue />
      </Progress>
      <Progress value={35} tone="warning">
        <ProgressLabel>Corrections, 7 of 20 resolved</ProgressLabel>
        <ProgressValue />
      </Progress>
      <Progress value={null}>
        <ProgressLabel>Uploading plans</ProgressLabel>
      </Progress>
    </div>
  ),
  'scroll-area': () => (
    <ScrollArea className="h-56 max-w-sm border border-border bg-card">
      <ol className="p-4 text-sm">
        {ACTIVITY.map((a) => (
          <li key={a.time + a.text} className="flex items-baseline gap-4 py-1.5">
            <span className="w-12 shrink-0 text-muted-foreground tabular-nums">{a.time}</span>
            <span>{a.text}</span>
          </li>
        ))}
      </ol>
    </ScrollArea>
  ),
  resizable: () => (
    <ResizablePanelGroup orientation="horizontal" className="min-h-64 max-w-2xl border border-border bg-card">
      <ResizablePanel defaultSize="32%" minSize="20%">
        <div className="flex h-full flex-col gap-3 p-4 text-sm">
          <span className="eyebrow-type text-muted-foreground">Queue</span>
          {['BP-2026-0418', 'BP-2026-0421', 'EL-2026-0133', 'PL-2026-0090'].map((id, i) => (
            <span key={id} className={i === 0 ? 'font-normal' : 'text-muted-foreground'}>
              {id}
            </span>
          ))}
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize="68%">
        <ResizablePanelGroup orientation="vertical">
          <ResizablePanel defaultSize="60%" minSize="30%">
            <div className="flex h-full items-center justify-center text-sm">Site plan, sheet A-101</div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize="40%" minSize="20%">
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Reviewer comments (3)</div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  ),
  calendar: () => <CalendarDemo />,
  'date-picker': () => <DatePickerDemo />,
  carousel: () => (
    <div className="px-12">
      <Carousel className="max-w-lg" opts={{ align: 'start' }}>
        <CarouselContent>
          {SPOTLIGHTS.map((s) => (
            <CarouselItem key={s.place} className="basis-2/3">
              <div className={`flex aspect-video flex-col justify-end gap-2 p-5 text-tint-foreground ${s.tile}`}>
                <span className="eyebrow-type">Community spotlight</span>
                <span className="text-xl leading-tight font-normal tracking-tight">{s.place}</span>
                <span className="text-sm">{s.note}</span>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  ),
  chart: () => (
    <ChartContainer config={PERMITS_CONFIG} className="max-w-xl">
      <BarChart data={PERMITS} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} width={36} />
        <ChartTooltip content={<ChartTooltipContent indicator="dot" labelFormatter={(v) => `${v} 2026 · permits issued`} />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="building" fill="var(--color-building)" />
        <Bar dataKey="trade" fill="var(--color-trade)" />
      </BarChart>
    </ChartContainer>
  ),
  sonner: () => (
    <div className="flex flex-wrap gap-2">
      <Toaster />
      <Button variant="outline" onClick={() => toast('Draft saved', { description: 'BP-2026-0418, residential addition' })}>
        Default
      </Button>
      <Button variant="outline" onClick={() => toast.success('Permit issued', { description: 'BP-2026-0418 is ready to download.' })}>
        Success
      </Button>
      <Button
        variant="outline"
        onClick={() => toast.warning('Corrections requested', { description: 'Building review needs a revised site plan.' })}
      >
        Warning
      </Button>
      <Button
        variant="outline"
        onClick={() => toast.error('Payment failed', { description: 'The card was declined. Try another method.' })}
      >
        Error
      </Button>
      <Button variant="outline" onClick={() => toast.info('In review', { description: 'Zoning and Fire are reviewing your application.' })}>
        Info
      </Button>
    </div>
  ),
  alert: AlertDemo,
  table: TableDemo,
};
