import { useRef, useState, type ReactNode } from 'react';
import { ClipboardCheck, CreditCard, FileText, Hammer, Megaphone, Store, TriangleAlert } from 'lucide-react';

import { ActorBadge } from '@/components/ui/actor-badge';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { ConfirmDialog, ConfirmDialogHost, confirm } from '@/components/ui/confirm-dialog';
import { Link } from '@/components/ui/link';
import { PageHeader, PageSection } from '@/components/ui/page-header';
import { QueryState, QueryTableState, type QueryLike } from '@/components/ui/query-state';
import { QuickTip } from '@/components/ui/quick-tip';
import { SpotlightCallout, SpotlightTour } from '@/components/ui/spotlight';
import { StatusBadge } from '@/components/ui/status-badge';
import { Steps } from '@/components/ui/steps';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tile } from '@/components/ui/tile';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const PERMITS = [
  { id: 'BLD-2026-0142', address: '18 Elm St', status: { name: 'In review', color: 'blue' } },
  { id: 'BLD-2026-0139', address: '4 Harbor Rd', status: { name: 'Awaiting payment', color: 'amber' } },
  { id: 'BLD-2026-0131', address: '220 Main St', status: { name: 'Issued', color: 'green' } },
];

function QueryStateDemo() {
  const [status, setStatus] = useState<string>('pending');
  const query: QueryLike =
    status === 'error'
      ? { status: 'error', error: new Error('The permit service did not respond.'), refetch: () => setStatus('pending') }
      : { status: status === 'pending' ? 'pending' : 'success' };
  const rows = status === 'empty' ? [] : PERMITS;
  return (
    <div className="grid gap-6">
      <ToggleGroup value={[status]} onValueChange={(v) => v[0] && setStatus(v[0] as string)}>
        <ToggleGroupItem value="pending">Loading</ToggleGroupItem>
        <ToggleGroupItem value="error">Failed</ToggleGroupItem>
        <ToggleGroupItem value="empty">Empty</ToggleGroupItem>
        <ToggleGroupItem value="success">Loaded</ToggleGroupItem>
      </ToggleGroup>
      <QueryState query={query} what="the inspection schedule" isEmpty={rows.length === 0} empty="No inspections scheduled this week.">
        {() => <p className="text-sm">{rows.length} inspections scheduled this week.</p>}
      </QueryState>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Permit</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <QueryTableState query={query} colSpan={3} what="the permits" isEmpty={rows.length === 0} empty="No permits match." />
          {query.status === 'success' &&
            rows.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.id}</TableCell>
                <TableCell>{p.address}</TableCell>
                <TableCell>
                  <StatusBadge status={p.status} />
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  );
}

function StatusBadgeDemo() {
  return (
    <div className="flex flex-wrap gap-3">
      <StatusBadge status={{ name: 'Submitted', color: 'blue' }} />
      <StatusBadge status={{ name: 'Awaiting payment', color: 'amber' }} />
      <StatusBadge status={{ name: 'Inspection due', color: 'yellow' }} />
      <StatusBadge status={{ name: 'Issued', color: 'green' }} />
      <StatusBadge status={{ name: 'Closed', color: 'gray' }} />
      <StatusBadge status={{ name: 'Violation', color: 'red' }} />
      <StatusBadge status={null} />
    </div>
  );
}

function ActorBadgeDemo() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <ActorBadge type="person" name="Dana Whitfield" />
      <ActorBadge type="system" />
      <ActorBadge type="automation" name="Fee reminder" />
      <ActorBadge type="ai" name="Intake assistant" />
      <ActorBadge type="person" name="Marcus Lee" iconOnly />
    </div>
  );
}

function SpotlightDemo() {
  const feesRef = useRef<HTMLDivElement>(null);
  const [callout, setCallout] = useState(false);
  const [tour, setTour] = useState(false);
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => setCallout(true)}>
          Highlight fees
        </Button>
        <Button onClick={() => setTour(true)}>Take the tour</Button>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <div id="spot-applicant" className="border border-border bg-card p-5">
          <p className="text-lg">Applicant</p>
          <p className="text-sm text-muted-foreground">Dana Whitfield · 18 Elm St</p>
        </div>
        <div ref={feesRef} className="border border-border bg-card p-5">
          <p className="text-lg">Fees</p>
          <p className="text-sm text-muted-foreground">$1,240.00 due · 2 of 3 paid</p>
        </div>
      </div>
      <Button id="spot-submit" className="w-fit">
        Submit application
      </Button>
      <SpotlightCallout target={feesRef} kind="section" label="Fees" open={callout} onOpenChange={setCallout}>
        Every fee on this permit, what has been paid and what is still due.
      </SpotlightCallout>
      <SpotlightTour
        title="Completing an application"
        open={tour}
        onOpenChange={setTour}
        steps={[
          { target: '#spot-applicant', kind: 'section', label: 'Applicant', body: 'Who applied, and where the work is.' },
          { target: feesRef, kind: 'section', label: 'Fees', body: 'Pay what is due before the permit can be issued.' },
          { target: '#spot-submit', label: 'Submit application', body: 'Send it to the building department for review.' },
        ]}
      />
    </div>
  );
}

function ConfirmDialogDemo() {
  const [answer, setAnswer] = useState<string>('');
  return (
    <div className="flex flex-wrap items-center gap-3">
      <ConfirmDialog
        trigger={<Button variant="outline">Void permit</Button>}
        title="Void BLD-2026-0142?"
        description="The permit stops being valid at once and the applicant is told."
        details={['2 scheduled inspections are cancelled', '$1,240.00 in unpaid fees is written off']}
        confirmLabel="Void permit"
        destructive
        onConfirm={() => new Promise((resolve) => setTimeout(resolve, 1200))}
      />
      <Button
        variant="secondary"
        onClick={async () =>
          setAnswer((await confirm({ title: 'Issue this licence?', confirmLabel: 'Issue licence' })) ? 'Issued' : 'Not issued')
        }
      >
        Issue licence
      </Button>
      {answer && <span className="text-sm text-muted-foreground">{answer}</span>}
      <ConfirmDialogHost />
    </div>
  );
}

function PageHeaderDemo() {
  const [q, setQ] = useState('');
  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Permits"
        title="Building permits"
        count={128}
        subtitle="Every building permit applied for in the last 12 months."
        search={q}
        onSearchChange={setQ}
        searchPlaceholder="Search permits"
        actions={<Button>New permit</Button>}
      />
      <PageSection
        title="Inspections"
        description="What's scheduled on this permit."
        actions={
          <Button size="sm" variant="outline">
            Request inspection
          </Button>
        }
      >
        <p className="text-sm">Framing inspection · Tue 12 Nov, 9:00</p>
      </PageSection>
    </div>
  );
}

function BannerDemo() {
  return (
    <div className="grid gap-4">
      <Banner
        icon={<Megaphone />}
        title="Online renewals for business licences open on 1 December."
        action={
          <Button size="sm" variant="secondary">
            Learn more
          </Button>
        }
        dismissible
      />
      <Banner
        tone="warning"
        icon={<TriangleAlert />}
        title="Not ready to approve"
        collapsible
        items={['Plan review: structural has not signed off', 'Fee: $240.00 still due']}
        action={
          <Button size="sm" variant="secondary">
            Review
          </Button>
        }
      />
      <Banner tone="ok" title="Ready to approve" description="Every check is settled and every request closed." />
    </div>
  );
}

function StepsDemo() {
  const [current, setCurrent] = useState(2);
  const items = [
    { title: 'Apply', description: 'Submitted 3 Oct' },
    { title: 'Plan review', description: 'Approved 14 Oct' },
    { title: 'Pay fees', description: '$1,240.00 due' },
    { title: 'Inspections' },
    { title: 'Issue' },
  ];
  return (
    <div className="grid gap-10">
      <Steps items={items} currentStep={current} onStepClick={(i) => i < current && setCurrent(i)} aria-label="Permit progress" />
      <Steps
        orientation="vertical"
        size="sm"
        currentStep={2}
        items={[
          { title: 'Footing inspection', description: 'Passed' },
          { title: 'Framing inspection', description: 'Failed: missing hold-downs', status: 'error' },
          { title: 'Re-inspection', description: 'Requested for Fri' },
          { title: 'Final inspection' },
        ]}
      />
    </div>
  );
}

function TileDemo() {
  const [selected, setSelected] = useState('building');
  const types = [
    {
      id: 'building',
      icon: <Hammer />,
      title: 'Building permit',
      description: 'New builds, additions and alterations',
      tone: 'hope' as const,
    },
    {
      id: 'business',
      icon: <Store />,
      title: 'Business licence',
      description: 'Open or renew a business in the city',
      tone: 'sky' as const,
    },
    {
      id: 'inspection',
      icon: <ClipboardCheck />,
      title: 'Request an inspection',
      description: 'Book a time for an open permit',
      tone: 'field' as const,
    },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {types.map((t) => (
        <Tile
          key={t.id}
          icon={t.icon}
          tone={t.tone}
          title={t.title}
          description={t.description}
          selected={selected === t.id}
          onClick={() => setSelected(t.id)}
        />
      ))}
      <Tile href="#fees" icon={<CreditCard />} tone="ash" title="Pay a fee" description="Card or bank transfer" />
      <Tile icon={<FileText />} tone="ash" title="Code enforcement" description="Not available in this city" disabled />
    </div>
  );
}

function QuickTipDemo() {
  return (
    <div className="grid gap-4 text-sm">
      <p className="flex items-center gap-1">
        Valuation <QuickTip content="The cost of the work, including labour and materials, used to work out the permit fee." />
      </p>
      <p className="flex items-center gap-1">
        Parcel number <QuickTip trigger="hover" content="On the property tax bill" />
      </p>
    </div>
  );
}

function LinkDemo() {
  return (
    <div className="grid gap-3 text-base">
      <p>
        Read the <Link href="#guide">residential permit guide</Link> before you apply.
      </p>
      <p>
        Fees are set by the{' '}
        <Link href="https://www.govwell.com" external>
          city council
        </Link>
        .
      </p>
      <p>
        {/* oxlint-disable-next-line jsx-a11y/control-has-associated-label -- the Link's children name it */}
        <Link variant="muted" size="sm" render={<button type="button" />}>
          Resend confirmation email
        </Link>
      </p>
      <p>
        <Link href="#archive" disabled>
          Archived permits
        </Link>
      </p>
    </div>
  );
}

export const FEEDBACK_DEMOS: Record<string, () => ReactNode> = {
  'query-state': QueryStateDemo,
  'status-badge': StatusBadgeDemo,
  'actor-badge': ActorBadgeDemo,
  spotlight: SpotlightDemo,
  'confirm-dialog': ConfirmDialogDemo,
  'page-header': PageHeaderDemo,
  banner: BannerDemo,
  steps: StepsDemo,
  tile: TileDemo,
  'quick-tip': QuickTipDemo,
  link: LinkDemo,
};
