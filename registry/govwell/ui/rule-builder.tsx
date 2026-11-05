'use client';

import * as React from 'react';
import { PlusIcon, Trash2Icon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConditionBuilder, describeConditions, type Condition, type Conditions, type FactOption } from '@/components/ui/condition-builder';
import { DatePicker } from '@/components/ui/date-picker';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { SegmentedControl, SegmentedControlItem } from '@/components/ui/segmented-control';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

// A rule read as a sentence, on a square card in three bands: WHEN something
// happens, ONLY IF the conditions hold, THEN do these things. Each band has
// its clause on a tinted eyebrow chip (Hope, Sky, Field) in a left gutter and
// the editable parts as inline square controls beside it; the whole rule is
// read back in Light type on a muted footer. Triggers, facts and actions are
// all supplied by the caller — each action brings its own small params form,
// either as a list of fields or a render prop.

// ── The rule ────────────────────────────────────────────────────────────────
// The same shape govwell-cqrs stores (contract/src/automations.ts): a trigger
// name plus a definition of conditions and one to five actions, each a
// command name and its input.

interface RuleAction {
  /** the action's command name, e.g. 'fees.add' */
  command: string;
  input: Record<string, unknown>;
}

interface RuleDefinition {
  /** "every time" is an empty ALL group — the stored grammar wants a group */
  conditions: Conditions;
  actions: RuleAction[];
}

interface Rule {
  trigger: string;
  definition: RuleDefinition;
}

interface TriggerOption {
  /** the event name, e.g. 'records.submitted' */
  value: string;
  /** the event as the end of "When …": 'an application is submitted' */
  phrase: string;
  /** a heading in the picker: "Applications", "Fees", "Inspections" */
  group?: string;
  /** a caveat shown under the picker while this trigger is chosen */
  note?: React.ReactNode;
}

type ActionFieldType = 'string' | 'number' | 'money' | 'boolean' | 'enum' | 'date';

interface ActionField {
  key: string;
  label: string;
  /** 'money' is kept in cents and typed in dollars; 'date' as 'YYYY-MM-DD' */
  type?: ActionFieldType;
  required?: boolean;
  enumValues?: string[];
  enumLabels?: Record<string, string>;
  placeholder?: string;
  description?: string;
}

interface ActionDefinition {
  command: string;
  /** the choice in the picker: 'Charge a fee' */
  title: string;
  /** a line under it: 'An extra fee on the application' */
  hint?: string;
  group?: string;
  /** what a freshly picked action starts with */
  defaultInput?: Record<string, unknown>;
  /** the params form, as fields… */
  fields?: ActionField[];
  /** …or drawn by the caller */
  render?: (props: {
    input: Record<string, unknown>;
    onChange: (next: Record<string, unknown>) => void;
    disabled: boolean;
  }) => React.ReactNode;
  /** the action as the end of a sentence: 'charge $250 as “Plan review”' */
  describe?: (input: Record<string, unknown>) => string;
}

const MAX_ACTIONS = 5;

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const joinAnd = (parts: string[]) => (parts.length <= 1 ? (parts[0] ?? '') : `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}`);

const triggerPhrase = (trigger: string, triggers: TriggerOption[]) =>
  triggers.find((t) => t.value === trigger)?.phrase ?? trigger.replace(/[._]/g, ' ');

/** one action as the end of a sentence; an action with no words says its title */
function describeAction(action: RuleAction, actions: ActionDefinition[]): string {
  const def = actions.find((a) => a.command === action.command);
  if (!def) return `run ${action.command}`;
  return def.describe ? def.describe(action.input) : lower(def.title);
}

/** "When an application is submitted, if Valuation is at least $50,000, charge the plan review fee." */
function describeRule(
  rule: Rule,
  {
    triggers,
    actions,
    facts,
  }: { triggers: TriggerOption[]; actions: ActionDefinition[]; facts: FactOption[] | ((name: string) => string) },
): string {
  const when = describeConditions(rule.definition.conditions, facts);
  const then = joinAnd(rule.definition.actions.map((a) => describeAction(a, actions)));
  return `When ${triggerPhrase(rule.trigger, triggers)}${when === 'always' ? '' : `, if ${when}`}, ${then || '…'}.`;
}

const isBlank = (v: unknown) => v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);

/** required fields still empty, as "Charge a fee: Amount" */
function missingRuleFields(rule: Rule, actions: ActionDefinition[]): string[] {
  return rule.definition.actions.flatMap((a) => {
    const def = actions.find((d) => d.command === a.command);
    return (def?.fields ?? []).filter((f) => f.required && isBlank(a.input[f.key])).map((f) => `${def!.title}: ${f.label}`);
  });
}

// ── The builder ─────────────────────────────────────────────────────────────

type RuleBuilderProps = Omit<React.ComponentProps<'div'>, 'defaultValue' | 'onChange'> & {
  value?: Rule;
  defaultValue?: Rule;
  onValueChange?: (rule: Rule) => void;
  triggers: TriggerOption[];
  /** the facts a condition can check; a function scopes them to the trigger (an event's own facts) */
  facts: FactOption[] | ((trigger: string) => FactOption[]);
  actions: ActionDefinition[];
  /** the stored grammar allows one to five */
  maxActions?: number;
  disabled?: boolean;
  /** the read-back sentence in the footer (on by default) */
  showSentence?: boolean;
};

function startRule(triggers: TriggerOption[], actions: ActionDefinition[]): Rule {
  const first = actions[0];
  return {
    trigger: triggers[0]?.value ?? '',
    definition: {
      conditions: { all: [] },
      actions: first ? [{ command: first.command, input: { ...first.defaultInput } }] : [],
    },
  };
}

/** keep only conditions whose facts the trigger still offers */
function scopeConditions(conditions: Conditions, valid: Set<string>): Conditions {
  const keep = (list: Condition[] | undefined) => list?.filter((c) => valid.has(c.fact));
  const all = keep(conditions.all);
  const any = keep(conditions.any);
  if (!all?.length && !any?.length) return { all: [] };
  return { ...(all?.length ? { all } : {}), ...(any?.length ? { any } : {}) };
}

function RuleBuilder({
  value: valueProp,
  defaultValue,
  onValueChange,
  triggers,
  facts,
  actions: actionDefs,
  maxActions = MAX_ACTIONS,
  disabled = false,
  showSentence = true,
  className,
  ...props
}: RuleBuilderProps) {
  const [internal, setInternal] = React.useState<Rule>(() => defaultValue ?? startRule(triggers, actionDefs));
  const rule = valueProp ?? internal;
  const factsFor = (trigger: string) => (typeof facts === 'function' ? facts(trigger) : facts);
  const scopedFacts = factsFor(rule.trigger);

  const emit = (next: Rule) => {
    setInternal(next);
    onValueChange?.(next);
  };
  const setDefinition = (patch: Partial<RuleDefinition>) => emit({ ...rule, definition: { ...rule.definition, ...patch } });

  const setTrigger = (trigger: string) => {
    // an event's own facts can't be checked on another event
    const valid = new Set(factsFor(trigger).map((f) => f.name));
    emit({ trigger, definition: { ...rule.definition, conditions: scopeConditions(rule.definition.conditions, valid) } });
  };

  const ruleActions = rule.definition.actions;
  const setActions = (next: RuleAction[]) => setDefinition({ actions: next });
  const chosenTrigger = triggers.find((t) => t.value === rule.trigger);
  const triggerGroups = groupBy(triggers);
  const missing = missingRuleFields(rule, actionDefs);
  const conditions = rule.definition.conditions;
  const hasConditions = (conditions.all?.length ?? 0) + (conditions.any?.length ?? 0) > 0;

  return (
    <Card data-slot="rule-builder" className={cn('gap-0 py-0', className)} {...props}>
      <RuleBand label="When" tone="hope">
        <Select value={rule.trigger} disabled={disabled} onValueChange={(v) => typeof v === 'string' && setTrigger(v)}>
          <SelectTrigger aria-label="When" className="w-full max-w-md">
            <SelectValue>{capital(triggerPhrase(rule.trigger, triggers))}</SelectValue>
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            {triggerGroups.map(([group, list]) => (
              <SelectGroup key={group}>
                {triggerGroups.length > 1 && group && <SelectLabel>{group}</SelectLabel>}
                {list.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {capital(t.phrase)}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
        {chosenTrigger?.note && <p className="text-sm font-light text-muted-foreground">{chosenTrigger.note}</p>}
      </RuleBand>

      <RuleBand label="Only if" tone="sky">
        <ConditionBuilder
          value={hasConditions ? conditions : undefined}
          onValueChange={(next) => setDefinition({ conditions: next ?? { all: [] } })}
          facts={scopedFacts}
          disabled={disabled}
          addLabel="Add a condition"
          showSummary={false}
          emptyText="Every time — no conditions yet."
        />
      </RuleBand>

      <RuleBand label="Then" tone="field">
        {ruleActions.map((a, i) => (
          <ActionEditor
            key={i}
            index={i}
            action={a}
            definitions={actionDefs}
            disabled={disabled}
            onChange={(next) => setActions(ruleActions.map((x, j) => (j === i ? next : x)))}
            onRemove={ruleActions.length > 1 ? () => setActions(ruleActions.filter((_, j) => j !== i)) : undefined}
          />
        ))}
        {!disabled && ruleActions.length < maxActions && actionDefs[0] && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="w-fit"
            onClick={() => setActions([...ruleActions, { command: actionDefs[0]!.command, input: { ...actionDefs[0]!.defaultInput } }])}
          >
            <PlusIcon data-icon="inline-start" />
            And also…
          </Button>
        )}
        {missing.length > 0 && (
          <p data-slot="rule-builder-missing" className="text-sm font-light text-muted-foreground">
            Still needed: {missing.join(', ')}
          </p>
        )}
      </RuleBand>

      {showSentence && (
        <p
          data-slot="rule-builder-sentence"
          aria-live="polite"
          className="border-t border-border bg-muted px-6 py-4 text-base font-light text-foreground"
        >
          {describeRule(rule, { triggers, actions: actionDefs, facts: scopedFacts })}
        </p>
      )}
    </Card>
  );
}

function groupBy<T extends { group?: string }>(items: T[]): [string, T[]][] {
  const groups = new Map<string, T[]>();
  for (const item of items) groups.set(item.group ?? '', [...(groups.get(item.group ?? '') ?? []), item]);
  return [...groups];
}

/** one clause of the sentence: its eyebrow in a gutter, its controls beside it */
function RuleBand({ label, tone, children }: { label: string; tone: 'hope' | 'sky' | 'field'; children: React.ReactNode }) {
  return (
    <section
      data-slot="rule-band"
      aria-label={label}
      className="grid gap-3 border-t border-border px-6 py-5 first:border-t-0 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-6"
    >
      <Eyebrow tone={tone} className="sm:mt-2.5">
        {label}
      </Eyebrow>
      <div className="flex min-w-0 flex-col gap-3">{children}</div>
    </section>
  );
}

function ActionEditor({
  index,
  action,
  definitions,
  disabled,
  onChange,
  onRemove,
}: {
  index: number;
  action: RuleAction;
  definitions: ActionDefinition[];
  disabled: boolean;
  onChange: (next: RuleAction) => void;
  onRemove: (() => void) | undefined;
}) {
  const def = definitions.find((d) => d.command === action.command);
  const groups = groupBy(definitions);
  const setInput = (input: Record<string, unknown>) => onChange({ ...action, input });

  return (
    <div data-slot="rule-action" role="group" aria-label={`Action ${index + 1}`} className="flex flex-col gap-3 border border-border p-4">
      <div className="flex items-center gap-2">
        <Select
          value={action.command}
          disabled={disabled}
          onValueChange={(v) => {
            // a different action means different params — start clean
            const next = definitions.find((d) => d.command === v);
            if (next && next.command !== action.command) onChange({ command: next.command, input: { ...next.defaultInput } });
          }}
        >
          <SelectTrigger aria-label="Action" className="min-w-0 flex-1">
            <SelectValue>{def?.title ?? action.command}</SelectValue>
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            {groups.map(([group, list]) => (
              <SelectGroup key={group}>
                {groups.length > 1 && group && <SelectLabel>{group}</SelectLabel>}
                {list.map((d) => (
                  <SelectItem key={d.command} value={d.command}>
                    {d.title}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
        {onRemove && !disabled && (
          <Button type="button" size="icon" variant="ghost" aria-label="Remove this action" title="Remove this action" onClick={onRemove}>
            <Trash2Icon />
          </Button>
        )}
      </div>
      {def?.hint && <p className="text-sm font-light text-muted-foreground">{def.hint}</p>}
      {def?.render
        ? def.render({ input: action.input, onChange: setInput, disabled })
        : def?.fields?.map((field) => (
            <div key={field.key} data-slot="rule-action-field" className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="w-36 shrink-0 text-sm font-normal">
                {field.label}
                {field.required && (
                  <span aria-hidden className="text-error">
                    {' '}
                    *
                  </span>
                )}
              </span>
              <ActionFieldInput
                field={field}
                value={action.input[field.key]}
                disabled={disabled}
                onChange={(v) => setInput({ ...action.input, [field.key]: v })}
              />
            </div>
          ))}
    </div>
  );
}

const pad = (n: number) => String(n).padStart(2, '0');

/** one param, by its type: money in dollars, a flag as Yes/No, a list as a dropdown */
function ActionFieldInput({
  field,
  value,
  disabled,
  onChange,
}: {
  field: ActionField;
  value: unknown;
  disabled: boolean;
  onChange: (next: unknown) => void;
}) {
  const common = { 'aria-label': field.label, 'aria-required': field.required || undefined, disabled };
  const box = 'min-w-0 flex-1 basis-56';
  switch (field.type) {
    case 'money':
      return (
        <NumberInput
          {...common}
          className={box}
          prefix="$"
          hideSteppers
          min={0}
          format={{ maximumFractionDigits: 2 }}
          placeholder={field.placeholder}
          value={typeof value === 'number' ? value / 100 : null}
          onValueChange={(n) => onChange(n === null ? undefined : Math.max(0, Math.round(n * 100)))}
        />
      );
    case 'number':
      return (
        <NumberInput
          {...common}
          className={box}
          placeholder={field.placeholder}
          value={typeof value === 'number' ? value : null}
          onValueChange={(n) => onChange(n ?? undefined)}
        />
      );
    case 'boolean':
      return (
        <SegmentedControl
          {...common}
          fitContent
          value={value === true ? 'yes' : value === false ? 'no' : undefined}
          onValueChange={(v) => onChange(v === 'yes')}
        >
          <SegmentedControlItem value="yes">Yes</SegmentedControlItem>
          <SegmentedControlItem value="no">No</SegmentedControlItem>
        </SegmentedControl>
      );
    case 'enum': {
      const shown = typeof value === 'string' ? value : '';
      return (
        <Select value={shown || null} disabled={disabled} onValueChange={(v) => typeof v === 'string' && onChange(v)}>
          <SelectTrigger aria-label={field.label} className={box}>
            <SelectValue placeholder={field.placeholder ?? 'Choose…'}>
              {shown ? (field.enumLabels?.[shown] ?? shown) : undefined}
            </SelectValue>
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            {(field.enumValues ?? []).map((v) => (
              <SelectItem key={v} value={v}>
                {field.enumLabels?.[v] ?? v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    case 'date': {
      const m = typeof value === 'string' ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(value) : null;
      return (
        <DatePicker
          {...common}
          className={box}
          value={m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : undefined}
          onValueChange={(d) => onChange(d ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` : undefined)}
        />
      );
    }
    default:
      return (
        <Input
          {...common}
          className={box}
          placeholder={field.placeholder}
          value={typeof value === 'string' || typeof value === 'number' ? String(value) : ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}

export { MAX_ACTIONS, RuleBuilder, describeAction, describeRule, missingRuleFields };
export type { ActionDefinition, ActionField, ActionFieldType, Rule, RuleAction, RuleBuilderProps, RuleDefinition, TriggerOption };
