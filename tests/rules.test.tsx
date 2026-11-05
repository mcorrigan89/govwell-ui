import { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  ConditionBuilder,
  describeCondition,
  describeConditions,
  operatorsFor,
  type Condition,
  type Conditions,
  type FactOption,
} from '@/components/ui/condition-builder';
import {
  RuleBuilder,
  describeRule,
  missingRuleFields,
  type ActionDefinition,
  type Rule,
  type TriggerOption,
} from '@/components/ui/rule-builder';

// jsdom lacks a few things Base UI's popups reach for
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
if (typeof Element !== 'undefined') Element.prototype.scrollIntoView ??= function () {};

const FACTS: FactOption[] = [
  { name: 'intake.valuation_cents', label: 'Valuation', type: 'money', group: 'Intake form' },
  { name: 'record.type_name', label: 'Type', group: 'The application', enumValues: ['Residential', 'Commercial'] },
  { name: 'intake.stories', label: 'Stories', type: 'number', group: 'Intake form' },
  { name: 'intake.contractor', label: 'Contractor', group: 'Intake form' },
  { name: 'location.flood_zone', label: 'In a flood zone', type: 'boolean', group: 'Location' },
  { name: 'record.submitted_on', label: 'Submitted on', type: 'date', group: 'The application' },
  {
    name: 'location.zoning',
    label: 'Zoning',
    group: 'Location',
    enumValues: ['r1', 'c1'],
    enumLabels: { r1: 'R-1 Single-family', c1: 'C-1 Commercial' },
  },
];

function Harness({ initial, onChange }: { initial?: Conditions; onChange?: (c: Conditions | undefined) => void }) {
  const [value, setValue] = useState<Conditions | undefined>(initial);
  return (
    <ConditionBuilder
      value={value}
      onValueChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
      facts={FACTS}
    />
  );
}

const row = (n: number) => screen.getByRole('group', { name: `Condition ${n}` });

async function pick(trigger: HTMLElement, option: string) {
  await userEvent.click(trigger);
  await userEvent.click(await screen.findByRole('option', { name: option }));
}

async function optionsOf(trigger: HTMLElement) {
  await userEvent.click(trigger);
  const names = (await screen.findAllByRole('option')).map((o) => o.textContent);
  await userEvent.keyboard('{Escape}');
  return names;
}

describe('ConditionBuilder', () => {
  it('adds a condition, then changes the comparisons and value box with the fact', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    expect(screen.getByText('Always — no conditions yet.')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Add condition' }));
    // the first fact is money: number comparisons and a $ box
    expect(onChange).toHaveBeenLastCalledWith({ all: [{ fact: 'intake.valuation_cents', op: '>', value: 0 }] });
    const r = within(row(1));
    expect(r.getByRole('combobox', { name: 'What to check' })).toHaveTextContent('Valuation');
    expect(await optionsOf(r.getByRole('combobox', { name: 'Comparison' }))).toEqual([
      'is',
      'is not',
      'is more than',
      'is at least',
      'is less than',
      'is at most',
      'is set',
    ]);
    expect(r.getByRole('textbox', { name: 'Amount in dollars' })).toBeInTheDocument();

    // an enum fact: is / is not / is one of / is set, and a dropdown of its values
    await pick(r.getByRole('combobox', { name: 'What to check' }), 'Type');
    expect(onChange).toHaveBeenLastCalledWith({ all: [{ fact: 'record.type_name', op: '==', value: 'Residential' }] });
    expect(await optionsOf(within(row(1)).getByRole('combobox', { name: 'Comparison' }))).toEqual(['is', 'is not', 'is one of', 'is set']);
    await pick(within(row(1)).getByRole('combobox', { name: 'Value' }), 'Commercial');
    expect(onChange).toHaveBeenLastCalledWith({ all: [{ fact: 'record.type_name', op: '==', value: 'Commercial' }] });

    // a text fact: a plain text box
    await pick(within(row(1)).getByRole('combobox', { name: 'What to check' }), 'Contractor');
    await userEvent.type(within(row(1)).getByRole('textbox', { name: 'Value' }), 'Acme');
    expect(onChange).toHaveBeenLastCalledWith({ all: [{ fact: 'intake.contractor', op: '==', value: 'Acme' }] });

    // a flag: comparison and value collapse into Yes / No
    await pick(within(row(1)).getByRole('combobox', { name: 'What to check' }), 'In a flood zone');
    expect(within(row(1)).queryByRole('combobox', { name: 'Comparison' })).not.toBeInTheDocument();
    await userEvent.click(within(row(1)).getByRole('button', { name: 'No' }));
    expect(onChange).toHaveBeenLastCalledWith({ all: [{ fact: 'location.flood_zone', op: '==', value: false }] });

    // a date: a calendar picker
    await pick(within(row(1)).getByRole('combobox', { name: 'What to check' }), 'Submitted on');
    expect(within(row(1)).getByRole('button', { name: /^Date: / })).toHaveTextContent('Pick a date');
    expect(await optionsOf(within(row(1)).getByRole('combobox', { name: 'Comparison' }))).toContain('is on or after');
  });

  it('types money in dollars and stores cents; numbers as numbers', async () => {
    const onChange = vi.fn();
    render(
      <Harness
        initial={{
          all: [
            { fact: 'intake.valuation_cents', op: '>=', value: 0 },
            { fact: 'intake.stories', op: '>', value: 1 },
          ],
        }}
        onChange={onChange}
      />,
    );
    const amount = within(row(1)).getByRole('textbox', { name: 'Amount in dollars' });
    await userEvent.clear(amount);
    await userEvent.type(amount, '50000');
    await userEvent.tab();
    expect(onChange.mock.lastCall?.[0].all[0]).toEqual({ fact: 'intake.valuation_cents', op: '>=', value: 5_000_000 });

    const stories = within(row(2)).getByRole('textbox', { name: 'Value' });
    await userEvent.clear(stories);
    await userEvent.type(stories, '3');
    await userEvent.tab();
    expect(onChange.mock.lastCall?.[0].all[1]).toEqual({ fact: 'intake.stories', op: '>', value: 3 });
  });

  it('switches to "is one of" with a list value and back', async () => {
    const onChange = vi.fn();
    render(<Harness initial={{ all: [{ fact: 'intake.contractor', op: '==', value: 'Acme' }] }} onChange={onChange} />);
    await pick(within(row(1)).getByRole('combobox', { name: 'Comparison' }), 'is one of');
    expect(onChange).toHaveBeenLastCalledWith({ all: [{ fact: 'intake.contractor', op: 'in', value: ['Acme'] }] });
    const list = within(row(1)).getByRole('textbox', { name: 'Values' });
    await userEvent.clear(list);
    await userEvent.type(list, 'Acme, Birch Builders{Enter}');
    expect(onChange).toHaveBeenLastCalledWith({ all: [{ fact: 'intake.contractor', op: 'in', value: ['Acme', 'Birch Builders'] }] });

    await pick(within(row(1)).getByRole('combobox', { name: 'Comparison' }), 'is set');
    expect(onChange).toHaveBeenLastCalledWith({ all: [{ fact: 'intake.contractor', op: 'exists', value: true }] });
    expect(within(row(1)).queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('picks several values of a fixed list as chips', async () => {
    const onChange = vi.fn();
    render(<Harness initial={{ all: [{ fact: 'location.zoning', op: 'in', value: ['r1'] }] }} onChange={onChange} />);
    expect(within(row(1)).getByText('R-1 Single-family')).toBeInTheDocument();
    await userEvent.click(within(row(1)).getByRole('combobox', { name: 'Values' }));
    await userEvent.click(await screen.findByRole('option', { name: 'C-1 Commercial' }));
    expect(onChange).toHaveBeenLastCalledWith({ all: [{ fact: 'location.zoning', op: 'in', value: ['r1', 'c1'] }] });
  });

  it('switches all/any and joins the rows with "and"/"or"', async () => {
    const onChange = vi.fn();
    const two: Condition[] = [
      { fact: 'record.type_name', op: '==', value: 'Commercial' },
      { fact: 'intake.stories', op: '>', value: 2 },
    ];
    render(<Harness initial={{ all: two }} onChange={onChange} />);
    expect(row(2)).toHaveTextContent(/^and/);
    expect(screen.getByText(/Type is Commercial and Stories is more than 2/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Any may hold' }));
    expect(onChange).toHaveBeenLastCalledWith({ any: two });
    expect(row(2)).toHaveTextContent(/^or/);
    expect(screen.getByText(/Type is Commercial, or Stories is more than 2/)).toBeInTheDocument();
  });

  it('removes conditions, and reports undefined once the last is gone', async () => {
    const onChange = vi.fn();
    render(
      <Harness
        initial={{
          all: [
            { fact: 'record.type_name', op: '==', value: 'Commercial' },
            { fact: 'intake.stories', op: '>', value: 2 },
          ],
        }}
        onChange={onChange}
      />,
    );
    await userEvent.click(within(row(1)).getByRole('button', { name: 'Remove condition' }));
    expect(onChange).toHaveBeenLastCalledWith({ all: [{ fact: 'intake.stories', op: '>', value: 2 }] });
    expect(screen.queryByRole('group', { name: 'Condition 2' })).not.toBeInTheDocument();
    await userEvent.click(within(row(1)).getByRole('button', { name: 'Remove condition' }));
    expect(onChange).toHaveBeenLastCalledWith(undefined);
    expect(screen.getByText('Always — no conditions yet.')).toBeInTheDocument();
  });

  it('shows both groups of an agent-authored condition, and nothing to edit when disabled', () => {
    render(
      <ConditionBuilder
        disabled
        facts={FACTS}
        value={{
          all: [{ fact: 'record.type_name', op: '==', value: 'Commercial' }],
          any: [
            { fact: 'location.flood_zone', op: '==', value: true },
            { fact: 'intake.stories', op: '>', value: 2 },
          ],
        }}
      />,
    );
    expect(screen.getByText('All of these')).toBeInTheDocument();
    expect(screen.getByText('And at least one of these')).toBeInTheDocument();
    expect(screen.getAllByRole('group', { name: /^Condition \d$/ })).toHaveLength(3);
    expect(screen.queryByRole('button', { name: 'Add condition' })).not.toBeInTheDocument();
    expect(screen.getByText('Type is Commercial — and In a flood zone — yes, or Stories is more than 2')).toBeInTheDocument();
  });

  it('offers comparisons by fact type', () => {
    expect(operatorsFor(FACTS[0])).toEqual(['==', '!=', '>', '>=', '<', '<=', 'exists']);
    expect(operatorsFor(FACTS[1])).toEqual(['==', '!=', 'in', 'exists']);
    expect(operatorsFor(FACTS[3])).toEqual(['==', '!=', 'contains', 'in', 'exists']);
    expect(operatorsFor(undefined)).toEqual(['==', '!=', 'contains', 'in', 'exists']);
  });
});

describe('describeCondition', () => {
  const d = (c: Condition) => describeCondition(c, FACTS);
  it('says every comparison', () => {
    expect(d({ fact: 'intake.contractor', op: '==', value: 'Acme' })).toBe('Contractor is “Acme”');
    expect(d({ fact: 'intake.contractor', op: '!=', value: 'Acme' })).toBe('Contractor is not “Acme”');
    expect(d({ fact: 'intake.stories', op: '>', value: 2 })).toBe('Stories is more than 2');
    expect(d({ fact: 'intake.valuation_cents', op: '>=', value: 5_000_000 })).toBe('Valuation is at least $50,000');
    expect(d({ fact: 'intake.valuation_cents', op: '<', value: 1250 })).toBe('Valuation is less than $12.50');
    expect(d({ fact: 'intake.stories', op: '<=', value: 1200 })).toBe('Stories is at most 1,200');
    expect(d({ fact: 'intake.contractor', op: 'contains', value: 'Roof' })).toBe('Contractor contains “Roof”');
    expect(d({ fact: 'location.zoning', op: 'in', value: ['r1', 'c1'] })).toBe('Zoning is one of R-1 Single-family or C-1 Commercial');
    expect(d({ fact: 'intake.contractor', op: 'in', value: ['A', 'B', 'C'] })).toBe('Contractor is one of “A”, “B” or “C”');
    expect(d({ fact: 'intake.contractor', op: 'exists', value: true })).toBe('Contractor is set');
    expect(d({ fact: 'location.flood_zone', op: '==', value: true })).toBe('In a flood zone — yes');
    expect(d({ fact: 'location.flood_zone', op: '!=', value: true })).toBe('In a flood zone — no');
    expect(d({ fact: 'record.type_name', op: '==', value: 'Residential' })).toBe('Type is Residential');
    expect(d({ fact: 'record.submitted_on', op: '>', value: '2027-01-05' })).toBe('Submitted on is after Jan 5, 2027');
    expect(d({ fact: 'record.submitted_on', op: '<=', value: '' })).toBe('Submitted on is on or before …');
  });

  it('takes a label function, and falls back to the fact name', () => {
    expect(describeCondition({ fact: 'fee.amount_cents', op: '>', value: 10000 }, (n) => n.toUpperCase())).toBe(
      'FEE.AMOUNT_CENTS is more than $100',
    );
    expect(describeCondition({ fact: 'unknown.fact', op: '==', value: 'x' }, FACTS)).toBe('unknown.fact is “x”');
  });
});

describe('describeConditions', () => {
  it('joins all with "and", any with "or", both with a dash, and none as always', () => {
    const a: Condition = { fact: 'intake.valuation_cents', op: '>=', value: 5_000_000 };
    const b: Condition = { fact: 'record.type_name', op: '==', value: 'Residential' };
    expect(describeConditions({ all: [a, b] }, FACTS)).toBe('Valuation is at least $50,000 and Type is Residential');
    expect(describeConditions({ any: [a, b] }, FACTS)).toBe('Valuation is at least $50,000, or Type is Residential');
    expect(describeConditions({ all: [a], any: [b] }, FACTS)).toBe('Valuation is at least $50,000 — and Type is Residential');
    expect(describeConditions(undefined, FACTS)).toBe('always');
    expect(describeConditions({ all: [] }, FACTS)).toBe('always');
  });
});

// ── RuleBuilder ─────────────────────────────────────────────────────────────

const TRIGGERS: TriggerOption[] = [
  { value: 'records.submitted', phrase: 'an application is submitted', group: 'Applications' },
  { value: 'inspections.failed', phrase: 'an inspection fails', group: 'Inspections', note: 'Runs once per failed inspection.' },
];

const INSPECTION_FACT: FactOption = { name: 'event.attempt', label: 'Attempt', type: 'number' };
const factsFor = (trigger: string) => (trigger === 'inspections.failed' ? [...FACTS, INSPECTION_FACT] : FACTS);

const ACTIONS: ActionDefinition[] = [
  {
    command: 'tasks.add',
    title: 'Add a workflow step',
    hint: 'e.g. a plan review for bigger projects',
    fields: [{ key: 'taskType', label: 'Step', type: 'enum', required: true, enumValues: ['Plan review', 'Fire review'] }],
    describe: (i) => `add a ${typeof i['taskType'] === 'string' ? i['taskType'] : '…'} step`,
  },
  {
    command: 'fees.add',
    title: 'Charge a fee',
    defaultInput: { name: '' },
    fields: [
      { key: 'name', label: 'Fee name', required: true },
      { key: 'amountCents', label: 'Amount', type: 'money', required: true },
    ],
    describe: (i) => `add the ${String(i['name'] || '…')}`,
  },
  {
    command: 'notifications.send_email',
    title: 'Send an email',
    defaultInput: { message: '' },
    render: ({ input, onChange }) => (
      <input
        aria-label="Message"
        value={String(input['message'] ?? '')}
        onChange={(e) => onChange({ ...input, message: e.target.value })}
      />
    ),
  },
];

function RuleHarness({ onChange, initial }: { onChange: (r: Rule) => void; initial?: Rule }) {
  const [rule, setRule] = useState<Rule | undefined>(initial);
  return (
    <RuleBuilder
      value={rule}
      onValueChange={(next) => {
        setRule(next);
        onChange(next);
      }}
      triggers={TRIGGERS}
      facts={factsFor}
      actions={ACTIONS}
    />
  );
}

describe('RuleBuilder', () => {
  it('builds a fee rule end to end and reads it back as a sentence', async () => {
    const onChange = vi.fn();
    const { container } = render(<RuleHarness onChange={onChange} />);
    const when = within(screen.getByRole('region', { name: 'When' }));
    const onlyIf = within(screen.getByRole('region', { name: 'Only if' }));
    const then = within(screen.getByRole('region', { name: 'Then' }));
    expect(when.getByRole('combobox', { name: 'When' })).toHaveTextContent('An application is submitted');
    expect(onlyIf.getByText('Every time — no conditions yet.')).toBeInTheDocument();
    expect(container.querySelector('[data-slot=rule-builder-sentence]')).toHaveTextContent(
      'When an application is submitted, add a … step.',
    );
    expect(screen.getByText('Still needed: Add a workflow step: Step')).toBeInTheDocument();

    // ONLY IF valuation ≥ $50,000 and type is Commercial
    await userEvent.click(onlyIf.getByRole('button', { name: 'Add a condition' }));
    await pick(within(row(1)).getByRole('combobox', { name: 'Comparison' }), 'is at least');
    const amount = within(row(1)).getByRole('textbox', { name: 'Amount in dollars' });
    await userEvent.clear(amount);
    await userEvent.type(amount, '50000');
    await userEvent.tab();
    await userEvent.click(onlyIf.getByRole('button', { name: 'Add a condition' }));
    await pick(within(row(2)).getByRole('combobox', { name: 'What to check' }), 'Type');
    await pick(within(row(2)).getByRole('combobox', { name: 'Value' }), 'Commercial');

    // THEN charge the plan-review fee
    const action = within(then.getByRole('group', { name: 'Action 1' }));
    await pick(action.getByRole('combobox', { name: 'Action' }), 'Charge a fee');
    await userEvent.type(action.getByRole('textbox', { name: 'Fee name' }), 'plan-review fee');
    await userEvent.type(action.getByRole('textbox', { name: 'Amount' }), '450');
    await userEvent.tab();

    expect(onChange).toHaveBeenLastCalledWith({
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
    expect(container.querySelector('[data-slot=rule-builder-sentence]')).toHaveTextContent(
      'When an application is submitted, if Valuation is at least $50,000 and Type is Commercial, add the plan-review fee.',
    );
    expect(container.querySelector('[data-slot=rule-builder-missing]')).not.toBeInTheDocument();
  });

  it('adds and removes actions, with a caller-drawn params form', async () => {
    const onChange = vi.fn();
    render(<RuleHarness onChange={onChange} />);
    const then = within(screen.getByRole('region', { name: 'Then' }));
    // the only action can't be removed
    expect(then.queryByRole('button', { name: 'Remove this action' })).not.toBeInTheDocument();
    await userEvent.click(then.getByRole('button', { name: 'And also…' }));
    const second = within(then.getByRole('group', { name: 'Action 2' }));
    await pick(second.getByRole('combobox', { name: 'Action' }), 'Send an email');
    await userEvent.type(second.getByRole('textbox', { name: 'Message' }), 'Hi');
    expect(onChange.mock.lastCall?.[0].definition.actions).toEqual([
      { command: 'tasks.add', input: {} },
      { command: 'notifications.send_email', input: { message: 'Hi' } },
    ]);
    expect(screen.getByText(/add a … step and send an email\.$/)).toBeInTheDocument();

    await userEvent.click(within(then.getByRole('group', { name: 'Action 1' })).getByRole('button', { name: 'Remove this action' }));
    expect(onChange.mock.lastCall?.[0].definition.actions).toEqual([{ command: 'notifications.send_email', input: { message: 'Hi' } }]);
  });

  it('drops conditions on facts the new trigger does not offer, and shows its note', async () => {
    const onChange = vi.fn();
    render(
      <RuleHarness
        onChange={onChange}
        initial={{
          trigger: 'inspections.failed',
          definition: {
            conditions: {
              all: [
                { fact: 'event.attempt', op: '>=', value: 2 },
                { fact: 'record.type_name', op: '==', value: 'Commercial' },
              ],
            },
            actions: [{ command: 'tasks.add', input: { taskType: 'Fire review' } }],
          },
        }}
      />,
    );
    expect(screen.getByText('Runs once per failed inspection.')).toBeInTheDocument();
    await pick(screen.getByRole('combobox', { name: 'When' }), 'An application is submitted');
    expect(onChange.mock.lastCall?.[0]).toEqual({
      trigger: 'records.submitted',
      definition: {
        conditions: { all: [{ fact: 'record.type_name', op: '==', value: 'Commercial' }] },
        actions: [{ command: 'tasks.add', input: { taskType: 'Fire review' } }],
      },
    });
    expect(screen.queryByText('Runs once per failed inspection.')).not.toBeInTheDocument();
  });

  it('keeps "every time" as an empty all group, and describes and checks rules without rendering', () => {
    const rule: Rule = {
      trigger: 'inspections.failed',
      definition: {
        conditions: { all: [] },
        actions: [
          { command: 'fees.add', input: { name: '' } },
          { command: 'records.issue', input: {} },
        ],
      },
    };
    expect(describeRule(rule, { triggers: TRIGGERS, actions: ACTIONS, facts: FACTS })).toBe(
      'When an inspection fails, add the … and run records.issue.',
    );
    expect(missingRuleFields(rule, ACTIONS)).toEqual(['Charge a fee: Fee name', 'Charge a fee: Amount']);
  });
});
