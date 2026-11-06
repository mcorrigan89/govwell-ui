import { useState, type ReactNode } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConditionBuilder, type Conditions, type FactOption } from '@/components/ui/condition-builder';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Textarea } from '@/components/ui/textarea';
import { RuleBuilder, type ActionDefinition, type Rule, type TriggerOption } from '@/components/ui/rule-builder';

// Demos for the condition and rule builders, keyed by registry item name.

const TRIGGERS: TriggerOption[] = [
  { value: 'records.submitted', phrase: 'an application is submitted', group: 'Applications' },
  {
    value: 'records.intake_saved',
    phrase: 'an application draft is saved',
    group: 'Applications',
    note: 'The application is still a draft here — steps, inspections and status can’t change yet.',
  },
  { value: 'records.status_changed', phrase: 'an application’s status changes', group: 'Applications' },
  { value: 'inspections.failed', phrase: 'an inspection fails', group: 'Inspections' },
  { value: 'fees.paid', phrase: 'a fee is paid', group: 'Fees' },
];

const PERMIT_FACTS: FactOption[] = [
  { name: 'intake.valuation_cents', label: 'Valuation', type: 'money', group: 'Intake form' },
  {
    name: 'record.type_name',
    label: 'Type',
    group: 'The application',
    enumValues: ['Residential', 'Commercial', 'Mixed use', 'Accessory structure'],
  },
  { name: 'intake.square_feet', label: 'Floor area (sq ft)', type: 'number', group: 'Intake form' },
  { name: 'intake.contractor_name', label: 'Contractor', group: 'Intake form' },
  { name: 'location.flood_zone', label: 'In a flood zone', type: 'boolean', group: 'Location (GIS)' },
  {
    name: 'location.zoning',
    label: 'Zoning district',
    group: 'Location (GIS)',
    enumValues: ['r1', 'r2', 'c1', 'm1'],
    enumLabels: { r1: 'R-1 Single-family', r2: 'R-2 Two-family', c1: 'C-1 Commercial', m1: 'M-1 Industrial' },
  },
  { name: 'record.submitted_on', label: 'Submitted on', type: 'date', group: 'The application' },
];

const INSPECTION_FACTS: FactOption[] = [
  {
    name: 'event.inspection_type',
    label: 'Inspection',
    enumValues: ['Footing', 'Framing', 'Electrical rough-in', 'Final'],
    group: 'This event',
  },
  { name: 'event.attempt', label: 'Attempt number', type: 'number', group: 'This event' },
];

/** event.* facts belong to their trigger; everything else is always there */
const factsFor = (trigger: string) => (trigger === 'inspections.failed' ? [...PERMIT_FACTS, ...INSPECTION_FACTS] : PERMIT_FACTS);

const money = (cents: unknown) =>
  typeof cents === 'number' ? `$${(cents / 100).toLocaleString('en-US', { maximumFractionDigits: 2 })}` : '$…';
const named = (v: unknown, fallback = '…') => (typeof v === 'string' && v.trim() ? `the ${v.trim()}` : fallback);

const ACTIONS: ActionDefinition[] = [
  {
    command: 'fees.add',
    title: 'Charge a fee',
    hint: 'An extra fee on the application',
    defaultInput: { name: '', amountCents: 5000 },
    fields: [
      { key: 'name', label: 'Fee name', required: true, placeholder: 'e.g. Plan review fee' },
      { key: 'amountCents', label: 'Amount', type: 'money', required: true },
    ],
    describe: (i) => `add ${named(i['name'], 'a fee')} (${money(i['amountCents'])})`,
  },
  {
    command: 'tasks.add',
    title: 'Add a workflow step',
    hint: 'e.g. a plan review for bigger projects',
    fields: [{ key: 'taskType', label: 'Step', type: 'enum', required: true, enumValues: ['Plan review', 'Fire review', 'Zoning review'] }],
    describe: (i) => `add a ${typeof i['taskType'] === 'string' ? i['taskType'] : '…'} step`,
  },
  {
    command: 'inspections.request',
    title: 'Require an inspection',
    hint: 'Added as open, for staff to schedule',
    fields: [
      { key: 'inspectionType', label: 'Inspection', required: true, placeholder: 'e.g. Re-inspection' },
      { key: 'dueBy', label: 'Due by', type: 'date' },
    ],
    describe: (i) =>
      `require ${typeof i['inspectionType'] === 'string' && i['inspectionType'] ? `a ${i['inspectionType']}` : 'an'} inspection`,
  },
  {
    command: 'notifications.send_email',
    title: 'Send an email',
    hint: 'To the applicant, the contractor or any address',
    defaultInput: { to: 'applicant', message: '' },
    // a params form drawn by the caller instead of a field list
    render: ({ input, onChange, disabled }) => (
      <div className="flex flex-col gap-2">
        <span className="text-sm font-normal">Message to the {String(input['to'] ?? 'applicant')}</span>
        <Textarea
          aria-label="Message"
          disabled={disabled}
          value={String(input['message'] ?? '')}
          onChange={(e) => onChange({ ...input, message: e.target.value })}
        />
      </div>
    ),
    describe: (i) => `email the ${String(i['to'] ?? 'applicant')}`,
  },
  { command: 'records.issue', title: 'Issue the permit', hint: 'Refused while fees are due or a step is open' },
];

function FeeRuleDemo() {
  const [rule, setRule] = useState<Rule>({
    trigger: 'records.submitted',
    definition: {
      conditions: {
        all: [
          { fact: 'intake.valuation_cents', op: '>=', value: 5_000_000 },
          { fact: 'record.type_name', op: '==', value: 'Commercial' },
        ],
      },
      actions: [{ command: 'fees.add', input: { name: 'plan-review fee', amountCents: 45_000 } }],
    },
  });
  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <RuleBuilder value={rule} onValueChange={setRule} triggers={TRIGGERS} facts={factsFor} actions={ACTIONS} />
      <pre className="overflow-x-auto bg-muted p-4 font-mono text-xs">{JSON.stringify(rule, null, 2)}</pre>
    </div>
  );
}

function AutomationDemo() {
  return (
    <div className="max-w-3xl">
      <RuleBuilder
        triggers={TRIGGERS}
        facts={factsFor}
        actions={ACTIONS}
        defaultValue={{
          trigger: 'inspections.failed',
          definition: {
            conditions: { all: [{ fact: 'event.attempt', op: '>=', value: 2 }] },
            actions: [
              { command: 'inspections.request', input: { inspectionType: 'Re-inspection' } },
              { command: 'notifications.send_email', input: { to: 'contractor', message: 'Your second re-inspection is booked.' } },
            ],
          },
        }}
      />
    </div>
  );
}

const FIELD_FACTS: FactOption[] = [
  {
    name: 'intake.work_type',
    label: 'Type of work',
    enumValues: ['new', 'addition', 'alteration', 'demolition'],
    enumLabels: { new: 'New construction', addition: 'Addition', alteration: 'Alteration', demolition: 'Demolition' },
  },
  { name: 'intake.has_contractor', label: 'Has a licensed contractor', type: 'boolean' },
  { name: 'intake.stories', label: 'Number of stories', type: 'number' },
  { name: 'intake.owner_email', label: 'Owner email' },
];

function FieldVisibilityDemo() {
  const [conditions, setConditions] = useState<Conditions | undefined>({
    any: [
      { fact: 'intake.work_type', op: 'in', value: ['new', 'addition'] },
      { fact: 'intake.stories', op: '>', value: 2 },
    ],
  });
  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <Eyebrow tone="sky">Field visibility</Eyebrow>
        <CardTitle>Structural engineer’s stamp</CardTitle>
        <CardDescription>Ask for the stamp only on the applications that need one.</CardDescription>
      </CardHeader>
      <CardContent>
        <ConditionBuilder
          value={conditions}
          onValueChange={setConditions}
          facts={FIELD_FACTS}
          sentencePrefix="Show this field when"
          emptyText="Always shown — no conditions yet."
        />
      </CardContent>
    </Card>
  );
}

export const RULES_DEMOS: Record<string, () => ReactNode> = {
  'condition-builder': FieldVisibilityDemo,
  'rule-builder': () => (
    <div className="flex flex-col gap-10">
      <FeeRuleDemo />
      <AutomationDemo />
    </div>
  ),
};
