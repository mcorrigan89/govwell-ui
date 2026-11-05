'use client';

import * as React from 'react';
import { PlusIcon, Trash2Icon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from '@/components/ui/combobox';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { SegmentedControl, SegmentedControlItem } from '@/components/ui/segmented-control';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

// The one condition-authoring UI: automations, fee rules, step gates and
// field visibility all write the same small grammar with it. Each condition
// reads across as a sentence — a fact, a comparison, a value — in square
// text-box controls, with a muted "and"/"or" in the gutter before every row
// after the first, and the whole group read back in Light type on a muted
// band underneath. Facts drive everything: the comparisons offered depend on
// the fact's type, and so does the value box (a number box, "$" for money,
// Yes/No for a flag, a dropdown or chips for a fixed list, a calendar for a
// date). The grammar is deliberately flat — one all/any group — so there are
// no nested groups to author.

// ── The grammar ─────────────────────────────────────────────────────────────
// Identical to the stored shape (govwell-cqrs contract/src/conditions.ts), so
// conditions saved there load here unchanged.

type ConditionOp = '==' | '!=' | '>' | '>=' | '<' | '<=' | 'contains' | 'in' | 'exists';

type ConditionValue = string | number | boolean | Array<string | number>;

/** one leaf comparison; 'exists' keeps `value: true` so every reader can rely on a value */
interface Condition {
  fact: string;
  op: ConditionOp;
  value: ConditionValue;
}

/** matches when ALL of `all` hold AND (if present) at least one of `any` holds */
interface Conditions {
  all?: Condition[];
  any?: Condition[];
}

const CONDITION_OPS: readonly ConditionOp[] = ['==', '!=', '>', '>=', '<', '<=', 'contains', 'in', 'exists'];

/** the stored grammar caps each group at 20 */
const MAX_CONDITIONS = 20;

type FactType = 'string' | 'number' | 'money' | 'boolean' | 'date' | 'enum';

interface FactOption {
  /** the stored fact name, e.g. 'intake.valuation_cents' or 'record.status' */
  name: string;
  label?: string;
  /** anything not listed here is treated as a string; `enumValues` makes it an enum */
  type?: FactType | (string & {});
  description?: string;
  /** a fixed list of values: offered as a dropdown, or chips for "is one of" */
  enumValues?: string[];
  /** what to SHOW for a stored value (a status's name for its id) */
  enumLabels?: Record<string, string>;
  /** a heading in the fact picker: "Application", "Intake form", "Parcel" */
  group?: string;
}

type FactKind = 'string' | 'number' | 'money' | 'boolean' | 'date' | 'enum';

/** money is stored in cents (`…_cents`, `…Cents`, or type 'money') and said in dollars */
const isMoneyFact = (name: string): boolean => /(_cents|Cents)$/.test(name);

function kindOf(fact: FactOption | undefined, name = fact?.name ?? ''): FactKind {
  if (fact?.enumValues?.length) return 'enum';
  if (fact?.type === 'boolean') return 'boolean';
  if (fact?.type === 'date') return 'date';
  if (fact?.type === 'money' || isMoneyFact(name)) return 'money';
  if (fact?.type === 'number') return 'number';
  return 'string';
}

// ── Words ───────────────────────────────────────────────────────────────────

const OP_WORDS: Record<ConditionOp, string> = {
  '==': 'is',
  '!=': 'is not',
  '>': 'is more than',
  '>=': 'is at least',
  '<': 'is less than',
  '<=': 'is at most',
  contains: 'contains',
  in: 'is one of',
  exists: 'is set',
};

const DATE_WORDS: Partial<Record<ConditionOp, string>> = {
  '==': 'is on',
  '!=': 'is not on',
  '>': 'is after',
  '>=': 'is on or after',
  '<': 'is before',
  '<=': 'is on or before',
};

const opWord = (op: ConditionOp, kind: FactKind) => (kind === 'date' ? (DATE_WORDS[op] ?? OP_WORDS[op]) : OP_WORDS[op]);

const OPS_BY_KIND: Record<FactKind, ConditionOp[]> = {
  number: ['==', '!=', '>', '>=', '<', '<=', 'exists'],
  money: ['==', '!=', '>', '>=', '<', '<=', 'exists'],
  date: ['==', '!=', '>', '>=', '<', '<=', 'exists'],
  enum: ['==', '!=', 'in', 'exists'],
  string: ['==', '!=', 'contains', 'in', 'exists'],
  // a flag collapses comparison and value into one Yes/No
  boolean: ['=='],
};

/** the comparisons a fact offers, in picker order */
function operatorsFor(fact: FactOption | undefined): ConditionOp[] {
  return OPS_BY_KIND[kindOf(fact)];
}

/** what a freshly picked fact starts with */
function defaultCondition(fact: FactOption): Condition {
  switch (kindOf(fact)) {
    case 'boolean':
      return { fact: fact.name, op: '==', value: true };
    case 'enum':
      return { fact: fact.name, op: '==', value: fact.enumValues![0]! };
    case 'money':
      return { fact: fact.name, op: '>', value: 0 };
    case 'number':
      return { fact: fact.name, op: '>=', value: 1 };
    case 'date':
      return { fact: fact.name, op: '>=', value: '' };
    default:
      return { fact: fact.name, op: '==', value: '' };
  }
}

/** switching to or from 'in' changes the value's shape; 'exists' has none */
function withOp(c: Condition, op: ConditionOp, fact: FactOption | undefined): Condition {
  const kind = kindOf(fact, c.fact);
  const blank = kind === 'enum' ? (fact?.enumValues?.[0] ?? '') : kind === 'number' || kind === 'money' ? 0 : '';
  let value: ConditionValue;
  if (op === 'exists') value = true;
  else if (op === 'in')
    value = Array.isArray(c.value)
      ? c.value
      : c.op === 'exists'
        ? []
        : [c.value].filter((x): x is string | number => x !== '' && typeof x !== 'boolean');
  else if (c.op === 'exists') value = blank;
  else if (Array.isArray(c.value)) value = c.value[0] ?? blank;
  else value = c.value;
  return { ...c, op, value };
}

const pad = (n: number) => String(n).padStart(2, '0');
/** dates are stored as plain calendar days, 'YYYY-MM-DD' */
const toIsoDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
function fromIsoDay(value: unknown): Date | undefined {
  if (typeof value !== 'string') return undefined;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : undefined;
}

/** cents as dollars; whole amounts drop the cents ("$50,000", "$12.50") */
function dollars(cents: number): string {
  const whole = cents % 100 === 0;
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2 })}`;
}

const joinOr = (parts: string[]) => (parts.length <= 1 ? (parts[0] ?? '') : `${parts.slice(0, -1).join(', ')} or ${parts.at(-1)}`);

function formatConditionValue(value: ConditionValue, fact?: FactOption, name = fact?.name ?? ''): string {
  const kind = kindOf(fact, name);
  if (Array.isArray(value)) return joinOr(value.map((v) => formatConditionValue(v, fact, name)));
  if (typeof value === 'number') return kind === 'money' ? dollars(value) : value.toLocaleString('en-US');
  if (typeof value === 'boolean') return value ? 'yes' : 'no';
  if (value === '') return '…';
  if (kind === 'enum') return fact?.enumLabels?.[value] ?? value;
  if (kind === 'date') {
    const day = fromIsoDay(value);
    if (day) return day.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
  return `“${value}”`;
}

type FactLookup = FactOption[] | ((name: string) => string);

function lookup(facts: FactLookup, name: string): { label: string; fact?: FactOption } {
  if (typeof facts === 'function') return { label: facts(name) };
  const fact = facts.find((f) => f.name === name);
  return { label: fact?.label ?? name, fact };
}

/** one condition as a sentence fragment: "Valuation is at least $50,000" */
function describeCondition(c: Condition, facts: FactLookup): string {
  const { label, fact } = lookup(facts, c.fact);
  if (c.op === 'exists') return `${label} is set`;
  if (typeof c.value === 'boolean') {
    const yes = c.op === '!=' ? !c.value : c.value;
    return `${label} — ${yes ? 'yes' : 'no'}`;
  }
  return `${label} ${opWord(c.op, kindOf(fact, c.fact))} ${formatConditionValue(c.value, fact, c.fact)}`;
}

/** a whole group as a sentence: "A and B — and C, or D"; 'always' when empty */
function describeConditions(value: Conditions | undefined, facts: FactLookup): string {
  const all = value?.all ?? [];
  const any = value?.any ?? [];
  if (all.length === 0 && any.length === 0) return 'always';
  const allText = all.map((c) => describeCondition(c, facts)).join(' and ');
  const anyText = any.map((c) => describeCondition(c, facts)).join(', or ');
  if (all.length > 0 && any.length > 0) return `${allText} — and ${anyText}`;
  return allText || anyText;
}

// ── The builder ─────────────────────────────────────────────────────────────

type ConditionBuilderProps = Omit<React.ComponentProps<'div'>, 'defaultValue' | 'onChange'> & {
  /** controlled conditions; `undefined` means none */
  value?: Conditions | undefined;
  defaultValue?: Conditions;
  /** the next conditions, or `undefined` once the last one is removed */
  onValueChange?: (next: Conditions | undefined) => void;
  facts: FactOption[];
  disabled?: boolean;
  addLabel?: string;
  /** lead-in for the read-back sentence, e.g. 'Show this field when' */
  sentencePrefix?: string;
  /** the read-back sentence under the rows (on by default) */
  showSummary?: boolean;
  /** shown when there are no conditions yet */
  emptyText?: React.ReactNode;
};

function ConditionBuilder(allProps: ConditionBuilderProps) {
  const {
    value: valueProp,
    defaultValue,
    onValueChange,
    facts,
    disabled = false,
    addLabel = 'Add condition',
    sentencePrefix = 'When',
    showSummary = true,
    emptyText = 'Always — no conditions yet.',
    className,
    ...props
  } = allProps;
  // `value={undefined}` still means controlled-and-empty
  const controlled = 'value' in allProps;
  const [internal, setInternal] = React.useState<Conditions | undefined>(defaultValue);
  const value = controlled ? valueProp : internal;

  const all = value?.all ?? [];
  const any = value?.any ?? [];
  // agent-authored conditions can carry both groups; people author one at a time
  const both = all.length > 0 && any.length > 0;
  const mode: 'all' | 'any' = any.length > 0 && all.length === 0 ? 'any' : 'all';
  const rows = mode === 'all' ? all : any;

  const emit = (nextAll: Condition[], nextAny: Condition[]) => {
    const next: Conditions = {};
    if (nextAll.length > 0) next.all = nextAll;
    if (nextAny.length > 0) next.any = nextAny;
    const out = nextAll.length === 0 && nextAny.length === 0 ? undefined : next;
    setInternal(out);
    onValueChange?.(out);
  };
  const setAll = (next: Condition[]) => emit(next, any);
  const setAny = (next: Condition[]) => emit(all, next);
  const setRows = mode === 'all' ? setAll : setAny;

  const first = facts[0];
  const canAdd = !disabled && first !== undefined && (both ? all : rows).length < MAX_CONDITIONS;

  const renderRows = (list: Condition[], setList: (next: Condition[]) => void, joiner: 'and' | 'or', offset = 0) =>
    list.map((c, i) => (
      <ConditionRow
        key={i}
        index={i + offset}
        joiner={i > 0 ? joiner : undefined}
        condition={c}
        facts={facts}
        disabled={disabled}
        onChange={(next) => setList(list.map((x, j) => (j === i ? next : x)))}
        onRemove={() => setList(list.filter((_, j) => j !== i))}
      />
    ));

  return (
    <div data-slot="condition-builder" className={cn('@container flex flex-col gap-3', className)} {...props}>
      {both ? (
        <>
          <p className="text-sm text-muted-foreground">All of these</p>
          {renderRows(all, setAll, 'and')}
          <p className="text-sm text-muted-foreground">And at least one of these</p>
          {renderRows(any, setAny, 'or', all.length)}
        </>
      ) : rows.length === 0 ? (
        <p data-slot="condition-builder-empty" className="text-base font-light text-muted-foreground">
          {emptyText}
        </p>
      ) : (
        <>
          {rows.length > 1 && (
            <SegmentedControl
              aria-label="How the conditions combine"
              size="sm"
              fitContent
              value={mode}
              disabled={disabled}
              onValueChange={(next) => (next === 'all' ? emit(rows, []) : emit([], rows))}
            >
              <SegmentedControlItem value="all">All must hold</SegmentedControlItem>
              <SegmentedControlItem value="any">Any may hold</SegmentedControlItem>
            </SegmentedControl>
          )}
          {renderRows(rows, setRows, mode === 'all' ? 'and' : 'or')}
        </>
      )}

      {canAdd && (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="w-fit"
          onClick={() => (both ? setAll : setRows)([...(both ? all : rows), defaultCondition(first)])}
        >
          <PlusIcon data-icon="inline-start" />
          {addLabel}
        </Button>
      )}

      {showSummary && (all.length > 0 || any.length > 0) && (
        <p
          data-slot="condition-builder-summary"
          aria-live="polite"
          className="bg-muted px-4 py-3 text-base font-light text-muted-foreground"
        >
          {sentencePrefix} <span className="text-foreground">{describeConditions(value, facts)}</span>
        </p>
      )}
    </div>
  );
}

function groupFacts(facts: FactOption[]): [string, FactOption[]][] {
  const groups = new Map<string, FactOption[]>();
  for (const f of facts) {
    const key = f.group ?? '';
    groups.set(key, [...(groups.get(key) ?? []), f]);
  }
  return [...groups];
}

function ConditionRow({
  index,
  joiner,
  condition: c,
  facts,
  disabled,
  onChange,
  onRemove,
}: {
  index: number;
  joiner: 'and' | 'or' | undefined;
  condition: Condition;
  facts: FactOption[];
  disabled: boolean;
  onChange: (next: Condition) => void;
  onRemove: () => void;
}) {
  const fact = facts.find((f) => f.name === c.fact);
  const kind = kindOf(fact, c.fact);
  const isBoolean = c.op !== 'exists' && (kind === 'boolean' || typeof c.value === 'boolean');
  const groups = groupFacts(facts);
  const ops = operatorsFor(fact);

  return (
    <div
      data-slot="condition-row"
      role="group"
      aria-label={`Condition ${index + 1}`}
      className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-x-2"
    >
      <span data-slot="condition-row-joiner" className="flex h-12 items-center text-base font-light text-muted-foreground">
        {joiner}
      </span>
      {/* the same grid on every row, so rows line up. Wide: fact, comparison, value and
          remove on one line. Medium: the fact (and remove) above, comparison and value
          beside each other below. Narrow: one control per line. */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 @md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto] @2xl:grid-cols-[minmax(12rem,9fr)_minmax(10rem,7fr)_minmax(0,17fr)_auto]">
        <Select
          value={c.fact}
          disabled={disabled}
          onValueChange={(v) => {
            const next = facts.find((f) => f.name === v);
            if (next && next.name !== c.fact) onChange(defaultCondition(next));
          }}
        >
          <SelectTrigger aria-label="What to check" className={cn('w-full', PLACE.fact)}>
            <SelectValue>{fact?.label ?? c.fact}</SelectValue>
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            {groups.map(([group, list]) => (
              <SelectGroup key={group}>
                {groups.length > 1 && group && <SelectLabel>{group}</SelectLabel>}
                {list.map((f) => (
                  <SelectItem key={f.name} value={f.name}>
                    {f.label ?? f.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>

        {isBoolean ? (
          // comparison and value collapse into one choice: "Flood zone — yes"
          <SegmentedControl
            aria-label="Yes or no"
            fitContent
            className={PLACE.both}
            disabled={disabled}
            value={(c.op === '!=' ? !c.value : c.value) ? 'yes' : 'no'}
            onValueChange={(v) => onChange({ ...c, op: '==', value: v === 'yes' })}
          >
            <SegmentedControlItem value="yes">Yes</SegmentedControlItem>
            <SegmentedControlItem value="no">No</SegmentedControlItem>
          </SegmentedControl>
        ) : (
          <>
            <Select value={c.op} disabled={disabled} onValueChange={(v) => v && onChange(withOp(c, v as ConditionOp, fact))}>
              <SelectTrigger aria-label="Comparison" className={cn('w-full', PLACE.op)}>
                <SelectValue>{opWord(c.op, kind)}</SelectValue>
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                {(ops.includes(c.op) ? ops : [...ops, c.op]).map((op) => (
                  <SelectItem key={op} value={op}>
                    {opWord(op, kind)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {c.op !== 'exists' ? (
              <ValueInput condition={c} fact={fact} kind={kind} disabled={disabled} onChange={onChange} />
            ) : (
              // "is set" has no value; keep its column so the remove button stays in line
              <span aria-hidden className="hidden @2xl:block" />
            )}
          </>
        )}

        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label="Remove condition"
          title="Remove condition"
          className={PLACE.remove}
          disabled={disabled}
          onClick={onRemove}
        >
          <Trash2Icon />
        </Button>
      </div>
    </div>
  );
}

// where each part of a condition row sits in its grid, at each container width
const PLACE = {
  fact: 'col-start-1 row-start-1 @md:col-span-2 @2xl:col-span-1',
  remove: 'col-start-2 row-start-1 @md:col-start-3 @2xl:col-start-4',
  op: 'col-start-1 @md:row-start-2 @2xl:col-start-2 @2xl:row-start-1',
  value: 'col-start-1 @md:col-start-2 @md:row-start-2 @2xl:col-start-3 @2xl:row-start-1',
  both: 'col-start-1 @md:col-span-2 @md:row-start-2 @2xl:col-start-2 @2xl:row-start-1',
};
const valueBox = cn('w-full min-w-0', PLACE.value);

function ValueInput({
  condition: c,
  fact,
  kind,
  disabled,
  onChange,
}: {
  condition: Condition;
  fact: FactOption | undefined;
  kind: FactKind;
  disabled: boolean;
  onChange: (next: Condition) => void;
}) {
  if (c.op === 'in') {
    if (kind === 'enum' && fact?.enumValues) return <EnumListInput condition={c} fact={fact} disabled={disabled} onChange={onChange} />;
    return <ListInput condition={c} numeric={kind === 'number' || kind === 'money'} disabled={disabled} onChange={onChange} />;
  }
  if (kind === 'enum' && fact?.enumValues) {
    const shown = typeof c.value === 'string' ? c.value : '';
    return (
      <Select value={shown} disabled={disabled} onValueChange={(v) => typeof v === 'string' && onChange({ ...c, value: v })}>
        <SelectTrigger aria-label="Value" className={valueBox}>
          <SelectValue>{fact.enumLabels?.[shown] ?? shown}</SelectValue>
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          {fact.enumValues.map((v) => (
            <SelectItem key={v} value={v}>
              {fact.enumLabels?.[v] ?? v}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
  if (kind === 'money')
    // kept in cents, typed in dollars
    return (
      <NumberInput
        aria-label="Amount in dollars"
        className={valueBox}
        prefix="$"
        hideSteppers
        min={0}
        format={{ maximumFractionDigits: 2 }}
        disabled={disabled}
        value={typeof c.value === 'number' ? c.value / 100 : null}
        onValueChange={(n) => onChange({ ...c, value: Math.round((n ?? 0) * 100) })}
      />
    );
  if (kind === 'number')
    return (
      <NumberInput
        aria-label="Value"
        className={valueBox}
        hideSteppers
        disabled={disabled}
        value={typeof c.value === 'number' ? c.value : null}
        onValueChange={(n) => onChange({ ...c, value: n ?? 0 })}
      />
    );
  if (kind === 'date')
    return (
      <DatePicker
        aria-label="Date"
        className={valueBox}
        disabled={disabled}
        value={fromIsoDay(c.value)}
        onValueChange={(d) => onChange({ ...c, value: d ? toIsoDay(d) : '' })}
      />
    );
  return (
    <Input
      aria-label="Value"
      className={valueBox}
      disabled={disabled}
      value={typeof c.value === 'string' || typeof c.value === 'number' ? String(c.value) : ''}
      // the fact's type drives the value's type — no "looks numeric" guessing
      onChange={(e) => onChange({ ...c, value: e.target.value })}
    />
  );
}

/** "is one of" a fixed list: Slate chips, filtered as you type */
function EnumListInput({
  condition: c,
  fact,
  disabled,
  onChange,
}: {
  condition: Condition;
  fact: FactOption;
  disabled: boolean;
  onChange: (next: Condition) => void;
}) {
  const anchor = useComboboxAnchor();
  const label = (v: string) => fact.enumLabels?.[v] ?? v;
  const picked = Array.isArray(c.value) ? c.value.map(String) : [];
  return (
    <Combobox
      multiple
      autoHighlight
      items={fact.enumValues ?? []}
      itemToStringLabel={label}
      value={picked}
      disabled={disabled}
      onValueChange={(next: string[]) => onChange({ ...c, value: next })}
    >
      <ComboboxChips ref={anchor} className={valueBox}>
        <ComboboxValue>
          {(values: string[]) => (
            <>
              {values.map((v) => (
                <ComboboxChip key={v}>{label(v)}</ComboboxChip>
              ))}
              <ComboboxChipsInput aria-label="Values" placeholder={values.length ? '' : 'Choose values'} />
            </>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>No value by that name.</ComboboxEmpty>
        <ComboboxList>
          {(item: string) => (
            <ComboboxItem key={item} value={item}>
              {label(item)}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

/** "is one of" free values: typed comma-separated, kept when the box is left or Enter is pressed */
function ListInput({
  condition: c,
  numeric,
  disabled,
  onChange,
}: {
  condition: Condition;
  numeric: boolean;
  disabled: boolean;
  onChange: (next: Condition) => void;
}) {
  const joined = Array.isArray(c.value) ? c.value.join(', ') : String(c.value);
  const [draft, setDraft] = React.useState(joined);
  // a new stored value (another row's removal, a reset) replaces the draft
  const [seen, setSeen] = React.useState(joined);
  if (seen !== joined) {
    setSeen(joined);
    setDraft(joined);
  }

  const commit = () => {
    const parts = draft
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    const typed = numeric ? parts.map(Number).filter((n) => !Number.isNaN(n)) : parts;
    onChange({ ...c, value: typed });
  };

  return (
    <Input
      aria-label="Values"
      className={valueBox}
      placeholder="value, value, …"
      disabled={disabled}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          commit();
        }
      }}
    />
  );
}

export {
  CONDITION_OPS,
  ConditionBuilder,
  MAX_CONDITIONS,
  defaultCondition,
  describeCondition,
  describeConditions,
  formatConditionValue,
  isMoneyFact,
  operatorsFor,
};
export type { Condition, ConditionBuilderProps, ConditionOp, ConditionValue, Conditions, FactOption, FactType };
