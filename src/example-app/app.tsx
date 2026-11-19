import { useEffect, useState, type ReactNode } from 'react';
import { Landmark, LogIn, MessagesSquare, Shapes } from 'lucide-react';

import { Toaster } from '@/components/ui/sonner';

import { Assistant } from './assistant';
import { ChatPage } from './chat';
import { IconMappingPage } from './icon-mapping';
import {
  CodeEnforcementIcon,
  ContactsIcon,
  InsightsIcon,
  InspectionCalendarIcon,
  LocationsIcon,
  MeetingsIcon,
  PaymentsIcon,
  recordTypeIcon,
  ReportingIcon,
  TasksIcon,
} from './icons';
import { RECORD_TYPES, recordsOfType } from './data';
import { CalendarPage, InsightsPage, PlaceholderPage, RecordPage, RecordsPage } from './pages';
import { SearchDialog } from './search';
import { Shell, type NavGroup } from './shell';

// A sample GovWell staff app built from the registry: the app's layout
// (a Slate sidebar and ground, a white content panel), a permits list, a
// permit, the overview and the inspection calendar, over made-up data for
// one town. Open it with ?example=app; pages are hash routes (#/records/building).

const NAV: NavGroup[] = [
  // the demo pages, set apart from the app's own sections by a rule
  // leaves the app for a town's public portal
  { label: 'Sample Portal', icon: Landmark, href: '?example=portal' },
  { label: 'Sample AI Chat', icon: MessagesSquare, href: '#/chat' },
  // leaves the app for the sample sign-in page
  { label: 'Sample Log In', icon: LogIn, href: '?example=login' },
  // every icon swapped in the sample, before and after
  { label: 'Icon Mapping', icon: Shapes, href: '#/icons', dividerAfter: true },
  {
    label: 'Insights',
    icon: InsightsIcon,
    items: [
      { href: '#/insights', label: 'Overview' },
      { href: '#/insights/inspections', label: 'Inspections' },
    ],
  },
  ...RECORD_TYPES.map((t): NavGroup => ({
    label: t.name,
    icon: recordTypeIcon(t.id),
    items: [
      { href: `#/records/${t.id}`, label: 'Permits', count: recordsOfType(t.id).filter((r) => r.statusKey === 'submitted').length },
      { href: `#/records/${t.id}/plan-reviews`, label: 'Plan reviews' },
      { href: `#/records/${t.id}/inspections`, label: 'Inspections' },
      { href: `#/records/${t.id}/documents`, label: 'Documents' },
    ],
  })),
  {
    label: 'Code Enforcement',
    icon: CodeEnforcementIcon,
    items: [
      { href: '#/code/cases', label: 'Cases' },
      { href: '#/code/inspections', label: 'Inspections' },
    ],
  },
  {
    label: 'Locations',
    icon: LocationsIcon,
    items: [
      { href: '#/locations/addresses', label: 'Addresses' },
      { href: '#/locations/parcels', label: 'Parcels' },
    ],
  },
  { label: 'Tasks', icon: TasksIcon, href: '#/tasks' },
  { label: 'Meetings', icon: MeetingsIcon, href: '#/meetings' },
  {
    label: 'Payments',
    icon: PaymentsIcon,
    items: [
      { href: '#/payments/transactions', label: 'Transactions' },
      { href: '#/payments/invoices', label: 'Invoices' },
      { href: '#/payments/deposits', label: 'Deposits' },
    ],
  },
  { label: 'Inspection Calendar', icon: InspectionCalendarIcon, href: '#/calendar' },
  { label: 'Reporting', icon: ReportingIcon, href: '#/reporting' },
  { label: 'Contacts', icon: ContactsIcon, href: '#/contacts' },
];

const pathFromHash = () => location.hash.replace(/^#/, '') || '/insights';

function usePath() {
  const [path, setPath] = useState(pathFromHash);
  useEffect(() => {
    const onChange = () => {
      setPath(pathFromHash());
      const main = document.getElementById('main');
      if (main) main.scrollTop = 0;
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return path;
}

function page(path: string): ReactNode {
  const parts = path.split('/').filter(Boolean);
  if (parts[0] === 'insights' && parts.length === 1) return <InsightsPage />;
  if (parts[0] === 'calendar') return <CalendarPage />;
  if (parts[0] === 'chat') return <ChatPage />;
  if (parts[0] === 'icons') return <IconMappingPage />;
  if (parts[0] === 'records' && parts[1] && RECORD_TYPES.some((t) => t.id === parts[1])) {
    if (parts.length === 2) return <RecordsPage typeId={parts[1]} />;
    if (parts.length === 3 && parts[2]!.includes('-2026-')) return <RecordPage id={parts[2]!} />;
  }
  // everything else in the nav is real in GovWell, but not in this sample
  const label = NAV.flatMap((g) =>
    g.items ? g.items.map((i) => ({ ...i, group: g.label })) : [{ href: g.href!, label: g.label, group: '' }],
  ).find((i) => i.href === `#${path}`);
  return <PlaceholderPage title={label ? label.label : 'Not in this sample'} group={label?.group} />;
}

export function ExampleApp() {
  const path = usePath();
  const [searching, setSearching] = useState(false);
  const [assistant, setAssistant] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearching((s) => !s);
      }
      if (e.key === 'Escape' && assistant && !searching) setAssistant(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [assistant, searching]);

  return (
    <>
      <Shell
        nav={NAV}
        path={path}
        onSearch={() => setSearching(true)}
        onAssistant={() => setAssistant((a) => !a)}
        assistant={assistant ? <Assistant path={path} onClose={() => setAssistant(false)} /> : null}
      >
        {page(path)}
      </Shell>
      <SearchDialog open={searching} onOpenChange={setSearching} />
      <Toaster />
    </>
  );
}
