// Made-up data for the example app: one fictional town's permits,
// inspections and staff. Built from a fixed seed so every load (and every
// test) sees the same records, dated relative to today so deadlines stay live.

export const TOWN = { name: 'Town of Alder Falls', state: 'VT' };

export type Staff = { id: string; name: string; role: string };
export const STAFF: Staff[] = [
  { id: 'mr', name: 'Maya Reyes', role: 'Building official' },
  { id: 'jo', name: 'Jonah Okafor', role: 'Permit technician' },
  { id: 'pl', name: 'Priya Lal', role: 'Plans examiner' },
  { id: 'dw', name: 'Dan Whitcomb', role: 'Inspector' },
  { id: 'ek', name: 'Erin Kowalski', role: 'Zoning administrator' },
];
export const ME = STAFF[0]!;

export type Status = { name: string; color: string };
export const STATUSES = {
  submitted: { name: 'Submitted', color: 'blue' },
  review: { name: 'In review', color: 'blue' },
  waiting: { name: 'Waiting on applicant', color: 'yellow' },
  inspections: { name: 'Inspections', color: 'purple' },
  issued: { name: 'Issued', color: 'green' },
  closed: { name: 'Closed', color: 'gray' },
  denied: { name: 'Denied', color: 'red' },
} satisfies Record<string, Status>;
export type StatusKey = keyof typeof STATUSES;

// the workflow every building permit runs through; a record is at one step
export const WORKFLOW = ['Intake', 'Plan review', 'Fees', 'Issuance', 'Inspections', 'Closeout'] as const;
const STEP_OF: Record<StatusKey, number> = {
  submitted: 0,
  review: 1,
  waiting: 1,
  inspections: 4,
  issued: 3,
  closed: 6,
  denied: 1,
};

export type RecordType = { id: string; name: string; prefix: string };
export const RECORD_TYPES: RecordType[] = [
  { id: 'building', name: 'Building Permits', prefix: 'BLD' },
  { id: 'zoning', name: 'Zoning Permits', prefix: 'ZON' },
];

export type PermitRecord = {
  id: string;
  number: string;
  typeId: string;
  kind: string;
  status: Status;
  statusKey: StatusKey;
  step: number;
  address: string;
  parcel: string;
  applicant: string;
  applicantEmail: string;
  assignee: Staff | null;
  submitted: Date;
  due: Date | null;
  valuation: number;
  fees: { name: string; amount: number; paid: boolean }[];
  description: string;
};

export type Inspection = {
  id: string;
  recordId: string;
  title: string;
  address: string;
  start: Date;
  minutes: number;
  inspector: Staff;
  result?: 'passed' | 'failed';
};

// a small deterministic generator (mulberry32)
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STREETS = [
  'Alder St',
  'Mill Rd',
  'Church St',
  'Pine Hill Rd',
  'Maple Ave',
  'River Rd',
  'School St',
  'Orchard Ln',
  'Depot St',
  'North Ave',
];
const PEOPLE = [
  'Hannah Brooks',
  'Luis Ortega',
  'Greenleaf Builders LLC',
  'Sam Patel',
  'Champlain Solar Co.',
  'Ruth Abernathy',
  'Kevin Tran',
  'Northline Electric',
  'Olivia Grant',
  'Tom & Ana Meyer',
  'Birch Valley Homes',
  'Marcus Hale',
];
const BUILDING_KINDS = [
  'Residential addition',
  'New single-family home',
  'Deck',
  'Solar PV',
  'Kitchen remodel',
  'Accessory dwelling unit',
  'Roof replacement',
  'Garage',
];
const ZONING_KINDS = ['Setback variance', 'Home occupation', 'Fence', 'Sign permit', 'Change of use'];
const STATUS_MIX: StatusKey[] = [
  'submitted',
  'review',
  'review',
  'waiting',
  'inspections',
  'inspections',
  'issued',
  'closed',
  'closed',
  'denied',
];

const DAY = 86_400_000;
export const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

function build() {
  const r = rng(20_260_315);
  const pick = <T>(xs: readonly T[]) => xs[Math.floor(r() * xs.length)]!;
  const today = startOfToday().getTime();
  const records: PermitRecord[] = [];
  for (const type of RECORD_TYPES) {
    const count = type.id === 'building' ? 46 : 14;
    for (let i = 0; i < count; i++) {
      const statusKey = pick(STATUS_MIX);
      const kind = pick(type.id === 'building' ? BUILDING_KINDS : ZONING_KINDS);
      const submitted = new Date(today - Math.floor(r() * 120 + 1) * DAY);
      const open = statusKey !== 'closed' && statusKey !== 'denied';
      const valuation = type.id === 'building' ? Math.round((r() * 180_000 + 4_000) / 100) * 100 : 0;
      const applicant = pick(PEOPLE);
      const number = `${type.prefix}-2026-${String(count * 3 + 100 - i * 3).padStart(4, '0')}`;
      records.push({
        id: number.toLowerCase(),
        number,
        typeId: type.id,
        kind,
        status: STATUSES[statusKey],
        statusKey,
        step: STEP_OF[statusKey],
        address: `${Math.floor(r() * 400 + 10)} ${pick(STREETS)}`,
        parcel: `${String(Math.floor(r() * 90 + 10))}-${String(Math.floor(r() * 900 + 100))}-${String(Math.floor(r() * 90 + 10))}`,
        applicant,
        applicantEmail: `${applicant
          .toLowerCase()
          .replace(/[^a-z]+/g, '.')
          .replace(/^\.|\.$/g, '')}@example.com`,
        assignee: statusKey === 'submitted' && r() < 0.6 ? null : pick(STAFF),
        submitted,
        // open records carry a review clock: some overdue, most a week or two out
        due: open ? new Date(today + Math.floor(r() * 24 - 4) * DAY) : null,
        valuation,
        fees:
          type.id === 'building'
            ? [
                { name: 'Application fee', amount: 75, paid: true },
                { name: 'Building permit fee', amount: Math.max(150, Math.round(valuation * 0.0065)), paid: STEP_OF[statusKey] > 2 },
                { name: 'Plan review fee', amount: Math.max(100, Math.round(valuation * 0.0025)), paid: STEP_OF[statusKey] > 2 },
              ]
            : [{ name: 'Zoning application fee', amount: 125, paid: statusKey !== 'submitted' }],
        description:
          type.id === 'building'
            ? `${kind} at the address above. Work per the stamped drawings in Documents; licensed contractor on file.`
            : `${kind} request. Abutters notified; hearing not required unless an objection is filed.`,
      });
    }
  }
  // numbered in the order they came in, then listed newest first
  for (const type of RECORD_TYPES) {
    records
      .filter((x) => x.typeId === type.id)
      .sort((a, b) => a.submitted.getTime() - b.submitted.getTime())
      .forEach((x, i) => {
        x.number = `${type.prefix}-2026-${String(i + 101).padStart(4, '0')}`;
        x.id = x.number.toLowerCase();
      });
  }
  records.sort((a, b) => b.submitted.getTime() - a.submitted.getTime());

  // this week's inspections, on records that are in the inspections step
  const inspectable = records.filter((x) => x.statusKey === 'inspections' || x.statusKey === 'issued');
  const inspectors = STAFF.filter((s) => s.role === 'Inspector' || s.role === 'Building official');
  const monday = new Date(today);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const inspections: Inspection[] = [];
  const titles = ['Footing', 'Framing', 'Rough electrical', 'Insulation', 'Final'];
  inspectable.forEach((rec, i) => {
    const day = i % 5;
    const hour = 8 + ((i * 3) % 8);
    const start = new Date(monday.getTime() + day * DAY);
    start.setHours(hour, i % 2 ? 30 : 0);
    const past = start.getTime() < Date.now();
    inspections.push({
      id: `insp-${i}`,
      recordId: rec.id,
      title: `${pick(titles)} inspection`,
      address: rec.address,
      start,
      minutes: 60,
      inspector: inspectors[i % inspectors.length]!,
      result: past ? (r() < 0.8 ? 'passed' : 'failed') : undefined,
    });
  });
  return { records, inspections };
}

export const { records: RECORDS, inspections: INSPECTIONS } = build();

export const recordsOfType = (typeId: string) => RECORDS.filter((r) => r.typeId === typeId);
export const findRecord = (id: string) => RECORDS.find((r) => r.id === id);
export const isOpen = (r: PermitRecord) => r.statusKey !== 'closed' && r.statusKey !== 'denied';

export const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
export const shortDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

// permits issued per month, for the overview chart (the last six months)
export function issuedByMonth() {
  const r = rng(7);
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return {
      month: d.toLocaleDateString('en-US', { month: 'short' }),
      building: Math.round(18 + r() * 22 + i * 2),
      zoning: Math.round(4 + r() * 8),
    };
  });
}
