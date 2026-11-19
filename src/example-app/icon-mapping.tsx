import type { ComponentType } from 'react';
import {
  ArrowUp,
  BarChart3,
  Briefcase,
  CalendarDays,
  CircleDollarSign,
  CircleHelp,
  ClipboardList,
  Construction,
  FileText,
  Hourglass,
  ListChecks,
  MapPin,
  Send,
  Settings,
  Shapes,
  ShieldAlert,
  Sparkles,
  Users,
} from 'lucide-react';

import {
  AssistantIcon,
  BuildingPermitsIcon,
  CodeEnforcementIcon,
  ContactsIcon,
  HelpIcon,
  HourglassIcon,
  InsightsIcon,
  InspectionCalendarIcon,
  LocationsIcon,
  MeetingsIcon,
  PaymentsIcon,
  ReportingIcon,
  SendIcon,
  SettingsIcon,
  TasksIcon,
  ZoningPermitsIcon,
} from './icons';
import { Page } from './pages';

// Every icon swapped in the sample app: the Lucide outline it had before, and
// the solid Streamline Ultimate icon that replaced it.

type Icon = ComponentType<{ className?: string }>;
type Swap = { where: string; before: Icon; beforeName: string; after: Icon; afterName: string };

const SWAPS: Swap[] = [
  { where: 'Ask the assistant', before: Sparkles, beforeName: 'Sparkles', after: AssistantIcon, afterName: 'Stars' },
  { where: 'Insights', before: BarChart3, beforeName: 'Bar Chart 3', after: InsightsIcon, afterName: 'Elastic Compute Cloudwatch 1' },
  {
    where: 'Building Permits',
    before: Construction,
    beforeName: 'Construction',
    after: BuildingPermitsIcon,
    afterName: 'Construction Sign',
  },
  { where: 'Zoning Permits', before: FileText, beforeName: 'File Text', after: ZoningPermitsIcon, afterName: 'VLC Logo' },
  { where: 'Code Enforcement', before: ShieldAlert, beforeName: 'Shield Alert', after: CodeEnforcementIcon, afterName: 'Shield with star' },
  { where: 'Locations', before: MapPin, beforeName: 'Map Pin', after: LocationsIcon, afterName: 'Pin' },
  { where: 'Tasks', before: ListChecks, beforeName: 'List Checks', after: TasksIcon, afterName: 'Tasks' },
  { where: 'Meetings', before: Briefcase, beforeName: 'Briefcase', after: MeetingsIcon, afterName: 'Bag Handle' },
  {
    where: 'Payments',
    before: CircleDollarSign,
    beforeName: 'Circle Dollar Sign',
    after: PaymentsIcon,
    afterName: 'Currency Dollar Circle',
  },
  { where: 'Inspection Calendar', before: CalendarDays, beforeName: 'Calendar Days', after: InspectionCalendarIcon, afterName: 'Calendar' },
  { where: 'Reporting', before: ClipboardList, beforeName: 'Clipboard List', after: ReportingIcon, afterName: 'Common File Text' },
  { where: 'Contacts', before: Users, beforeName: 'Users', after: ContactsIcon, afterName: 'Contacts' },
  { where: 'Get help', before: CircleHelp, beforeName: 'Circle Help', after: HelpIcon, afterName: 'Dice Question' },
  { where: 'Settings', before: Settings, beforeName: 'Settings', after: SettingsIcon, afterName: 'Settings' },
  { where: 'Assistant send button', before: Send, beforeName: 'Send', after: SendIcon, afterName: 'Send Email 3' },
  { where: 'AI Chat and Portal send buttons', before: ArrowUp, beforeName: 'Arrow Up', after: SendIcon, afterName: 'Send Email 3' },
  { where: 'Ideas: waiting on applicants', before: Hourglass, beforeName: 'Hourglass', after: HourglassIcon, afterName: 'Hourglass' },
  { where: 'Ideas: zoning setbacks', before: MapPin, beforeName: 'Map Pin', after: LocationsIcon, afterName: 'Pin' },
];

function Cell({ icon: Icon, name }: { icon: Icon; name: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="size-6 shrink-0" />
      <span className="text-sm text-muted-foreground">{name}</span>
    </div>
  );
}

export function IconMappingPage() {
  return (
    <Page
      icon={Shapes}
      title="Icon Mapping"
      subtitle="Each icon replaced in the sample app: the Lucide outline before, the Streamline icon after."
    >
      <table className="w-full max-w-4xl text-left">
        <thead>
          <tr className="border-b border-border text-sm">
            <th scope="col" className="py-3 pr-6 font-bold">
              Where
            </th>
            <th scope="col" className="py-3 pr-6 font-bold">
              Before
            </th>
            <th scope="col" className="py-3 font-bold">
              After
            </th>
          </tr>
        </thead>
        <tbody>
          {SWAPS.map((s) => (
            <tr key={s.where} className="border-b border-border">
              <th scope="row" className="py-3 pr-6 font-light">
                {s.where}
              </th>
              <td className="py-3 pr-6">
                <Cell icon={s.before} name={s.beforeName} />
              </td>
              <td className="py-3">
                <Cell icon={s.after} name={s.afterName} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Page>
  );
}
