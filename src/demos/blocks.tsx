import { useMemo, useState, type ReactNode } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import {
  BookOpen,
  CalendarClock,
  ClipboardCheck,
  FileBarChart,
  FileStack,
  FileWarning,
  Gavel,
  Globe,
  Landmark,
  ListChecks,
  Megaphone,
  Receipt,
  ScrollText,
  Search,
  Users,
} from 'lucide-react';

import { AppShell, type NavSection } from '@/components/blocks/app-shell';
import { UserMenu } from '@/components/blocks/user-menu';
import { DataTable, dataTableColumns } from '@/components/blocks/data-table';
import { SignIn } from '@/components/blocks/sign-in';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';

// Demos for the blocks: the staff app shell, the working data table and the
// sign-in page.

// ── app shell ────────────────────────────────────────────────────────────────

/** the staff nav, grouped by kind of work; `admin` decides what setup offers */
export function staffNav({ admin, inspections }: { admin: boolean; inspections: boolean }): NavSection[] {
  return [
    {
      title: 'Casework',
      items: [
        { href: '#/', label: 'Applications', icon: FileStack, exact: true, badge: 14 },
        { href: '#/planning', label: 'Planning and zoning', icon: Landmark },
        { href: '#/cases', label: 'Code cases', icon: FileWarning, badge: 3, badgeLabel: '3 overdue' },
        { href: '#/inspections', label: 'Inspections', icon: ClipboardCheck, badge: 128, hidden: !inspections },
        { href: '#/deadlines', label: 'Due soon', icon: CalendarClock },
        { href: '#/requests', label: 'Public reports', icon: Megaphone },
        { href: '#/hearings', label: 'Hearings', icon: Gavel },
      ],
    },
    {
      title: 'Insight',
      items: [
        { href: '#/reports', label: 'Reports', icon: FileBarChart },
        { href: '#/audit', label: 'Audit', icon: ScrollText, hidden: !admin },
      ],
    },
    {
      title: 'Setup',
      items: [
        { href: '#/types', label: 'Application types', icon: ListChecks, hidden: !admin },
        { href: '#/fees', label: 'Fees', icon: Receipt, hidden: !admin },
        { href: '#/people', label: 'People', icon: Users, hidden: !admin },
      ],
    },
  ];
}

function AppShellDemo() {
  const [admin, setAdmin] = useState(true);
  return (
    <div className="h-[640px] overflow-auto border border-border">
      <AppShell
        className="min-h-full [&>aside]:h-[640px]"
        brand={{ href: '#/', caption: 'City of Ashford' }}
        sections={staffNav({ admin, inspections: true })}
        footer={[
          { href: '#/portal', label: 'Public portal', icon: Globe },
          { href: '#/api', label: 'API docs', icon: BookOpen },
        ]}
        activeHref="#/cases/CE-2026-0112"
        storageKey="govwell.demo.sidebar.collapsed"
        sidebarFooter={(collapsed) => (
          <UserMenu
            variant="sidebar"
            collapsed={collapsed}
            user={{ name: 'Dana Ruiz', email: 'dana.ruiz@ashford.gov' }}
            organizations={[{ id: 'ashford', name: 'City of Ashford', role: admin ? 'admin' : 'reviewer' }]}
            activeOrganizationId="ashford"
            onSignOut={() => {}}
          />
        )}
        renderLink={({ href, className, children, attrs, ...rest }) => (
          <a href={href} className={className} aria-current={rest['aria-current']} onClick={(e) => e.preventDefault()} {...attrs}>
            {children}
          </a>
        )}
        topBar={
          <>
            <span className="truncate">
              City of Ashford <span className="hidden text-muted-foreground sm:inline">· {admin ? 'admin' : 'reviewer'}</span>
            </span>
            <div className="ml-auto flex items-center gap-2">
              <InputGroup className="hidden h-10 w-64 lg:flex">
                <InputGroupInput placeholder="Search records…" aria-label="Search records" />
                <InputGroupAddon>
                  <Search />
                </InputGroupAddon>
              </InputGroup>
              <Button variant="outline" size="sm" onClick={() => setAdmin(!admin)}>
                View as {admin ? 'reviewer' : 'admin'}
              </Button>
            </div>
          </>
        }
      >
        <h1 className="text-3xl tracking-tight">Code cases</h1>
        <p className="mt-2 text-muted-foreground">
          Three cases need a first inspection this week. Setup appears only for admins; switch the view to see the nav change.
        </p>
      </AppShell>
    </div>
  );
}

// ── data table ───────────────────────────────────────────────────────────────

export type Permit = {
  number: string;
  address: string;
  type: string;
  status: 'In review' | 'Issued' | 'Corrections' | 'Submitted';
  fees: number;
  submitted: string;
  reviewer: string;
};

export const PERMITS: Permit[] = [
  {
    number: 'BP-2026-0418',
    address: '12 Elm Street',
    type: 'Residential addition',
    status: 'In review',
    fees: 1240,
    submitted: '2026-10-02',
    reviewer: 'D. Okafor',
  },
  {
    number: 'BP-2026-0419',
    address: '88 Mill Road',
    type: 'Deck',
    status: 'Issued',
    fees: 310,
    submitted: '2026-10-03',
    reviewer: 'R. Chen',
  },
  {
    number: 'BP-2026-0423',
    address: '4 Harbor Lane',
    type: 'Commercial tenant fit-out',
    status: 'Corrections',
    fees: 4820,
    submitted: '2026-10-06',
    reviewer: 'D. Okafor',
  },
  {
    number: 'BP-2026-0427',
    address: '230 Oak Avenue',
    type: 'Roof replacement',
    status: 'Issued',
    fees: 185,
    submitted: '2026-10-07',
    reviewer: 'M. Alvarez',
  },
  {
    number: 'BP-2026-0431',
    address: '17 Birch Court',
    type: 'Accessory dwelling unit',
    status: 'Submitted',
    fees: 2650,
    submitted: '2026-10-09',
    reviewer: 'Unassigned',
  },
  {
    number: 'BP-2026-0436',
    address: '5 Station Square',
    type: 'Sign',
    status: 'In review',
    fees: 95,
    submitted: '2026-10-12',
    reviewer: 'R. Chen',
  },
  {
    number: 'BP-2026-0440',
    address: '61 Ridge Drive',
    type: 'Pool',
    status: 'Corrections',
    fees: 720,
    submitted: '2026-10-14',
    reviewer: 'M. Alvarez',
  },
  {
    number: 'BP-2026-0444',
    address: '9 Cedar Way',
    type: 'Solar panels',
    status: 'Issued',
    fees: 150,
    submitted: '2026-10-16',
    reviewer: 'R. Chen',
  },
  {
    number: 'BP-2026-0447',
    address: '140 Main Street',
    type: 'Demolition',
    status: 'Submitted',
    fees: 900,
    submitted: '2026-10-20',
    reviewer: 'Unassigned',
  },
  {
    number: 'BP-2026-0452',
    address: '33 Willow Bend',
    type: 'Fence',
    status: 'In review',
    fees: 60,
    submitted: '2026-10-22',
    reviewer: 'D. Okafor',
  },
];

// statuses are org data (a name and a hue), shown as status badges: a tint
// with a square dot, so every status has the same weight in a long table
const STATUS_HUE = { 'In review': 'blue', Issued: 'green', Corrections: 'amber', Submitted: 'gray' } as const;
const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

const col = dataTableColumns<Permit>();
const PERMIT_COLUMNS = col.columns([
  col.accessor('number', { header: 'Permit', cell: (c) => <span className="font-normal">{c.getValue()}</span> }),
  col.accessor('address', { header: 'Address' }),
  col.accessor('type', { header: 'Type' }),
  col.accessor('status', {
    header: 'Status',
    cell: (c) => <StatusBadge status={{ name: c.getValue(), color: STATUS_HUE[c.getValue()] }} />,
  }),
  col.accessor('fees', { header: 'Fees', cell: (c) => money(c.getValue()) }),
  col.accessor('submitted', { header: 'Submitted', sortFn: 'text' }),
  col.accessor('reviewer', { header: 'Reviewer' }),
]);

/** the permits table: five to a page, selectable, with bulk actions and rows that open */
export function PermitsTable({ data = PERMITS, loading = false }: { data?: Permit[]; loading?: boolean }) {
  const [assigned, setAssigned] = useState<string | null>(null);
  return (
    <div className="space-y-2">
      <DataTable
        columns={PERMIT_COLUMNS}
        data={data}
        getRowId={(p) => p.number}
        pageSize={5}
        filterPlaceholder="Filter permits"
        searchShortcut
        selectable={(p) => p.status !== 'Issued'}
        stickyFirstColumn
        columnMenus
        loading={loading}
        emptyTitle="No permits yet"
        emptyDescription="Applications appear here once they're submitted."
        renderExpanded={(p) => (
          <dl className="grid gap-x-8 gap-y-2 sm:grid-cols-[auto_1fr]">
            <dt className="text-muted-foreground">Reviewer</dt>
            <dd>{p.reviewer}</dd>
            <dt className="text-muted-foreground">Fees assessed</dt>
            <dd>{money(p.fees)}</dd>
          </dl>
        )}
        bulkActions={(rows, clear) => (
          <>
            <Button
              size="sm"
              onClick={() => {
                setAssigned(`Assigned ${rows.length} to D. Okafor`);
                clear();
              }}
            >
              Assign reviewer
            </Button>
            <Button size="sm" variant="ghost">
              Export
            </Button>
          </>
        )}
      />
      {assigned && <p className="text-sm text-muted-foreground">{assigned}</p>}
    </div>
  );
}

export type Stop = { id: string; address: string; kind: string };

export const ROUTE: Stop[] = [
  { id: 'INS-5521', address: '12 Elm Street', kind: 'Framing' },
  { id: 'INS-5524', address: '4 Harbor Lane', kind: 'Electrical rough-in' },
  { id: 'INS-5530', address: '61 Ridge Drive', kind: 'Pool barrier' },
  { id: 'INS-5533', address: '230 Oak Avenue', kind: 'Final' },
];

const stop = dataTableColumns<Stop>();
const ROUTE_COLUMNS = stop.columns([
  stop.accessor('id', { header: 'Inspection', enableSorting: false }),
  stop.accessor('address', { header: 'Address', enableSorting: false }),
  stop.accessor('kind', { header: 'Kind', enableSorting: false, enableHiding: false }),
]);

/** today's inspection route, in the order the inspector will drive it */
export function RouteTable() {
  const [route, setRoute] = useState(ROUTE);
  return (
    <DataTable
      columns={ROUTE_COLUMNS}
      data={route}
      getRowId={(s) => s.id}
      rowLabel={(s) => `${s.id}, ${s.address}`}
      filter={false}
      pageSize={false}
      onReorder={({ from, to }) => setRoute((r) => arrayMove(r, from, to))}
    />
  );
}

function DataTableDemo() {
  const [loading, setLoading] = useState(false);
  const empty = useMemo<Permit[]>(() => [], []);
  return (
    <div className="space-y-12">
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xl">Permits in review</h3>
          <Button size="sm" variant="outline" onClick={() => setLoading(!loading)}>
            {loading ? 'Stop loading' : 'Show loading'}
          </Button>
        </div>
        <PermitsTable loading={loading} />
      </section>
      <section className="space-y-3">
        <h3 className="text-xl">Today’s route: drag to reorder</h3>
        <RouteTable />
      </section>
      <section className="space-y-3">
        <h3 className="text-xl">Empty</h3>
        <DataTable
          columns={PERMIT_COLUMNS}
          data={empty}
          filter={false}
          emptyTitle="No permits yet"
          emptyDescription="Applications appear here once residents submit them."
          emptyAction={<Button size="sm">New permit</Button>}
        />
      </section>
      <section className="space-y-3">
        <h3 className="text-xl">A pinned header, scrolling inside</h3>
        <DataTable columns={PERMIT_COLUMNS} data={PERMITS} pageSize={false} maxHeight={320} stickyFirstColumn filter={false} />
      </section>
    </div>
  );
}

// ── sign in ──────────────────────────────────────────────────────────────────

function SignInDemo() {
  return (
    <div className="h-[760px] overflow-auto border border-border">
      <SignIn
        organization="City of Ashford · staff sign-in"
        description="Use your city email address."
        forgotHref="#/forgot"
        onPassword={async (_email, password) => {
          await new Promise((r) => setTimeout(r, 600));
          if (password !== 'permit') throw new Error('That email and password don’t match. Try again, or email yourself a link.');
        }}
        onEmailLink={async (email) => {
          await new Promise((r) => setTimeout(r, 600));
          return `We sent a sign-in link to ${email}. It works for 15 minutes.`;
        }}
        footer={<>Need an account? Ask your permitting administrator.</>}
      />
    </div>
  );
}

export const BLOCKS_DEMOS: Record<string, () => ReactNode> = {
  'app-shell': () => <AppShellDemo />,
  'data-table': () => <DataTableDemo />,
  'sign-in': () => <SignInDemo />,
};
