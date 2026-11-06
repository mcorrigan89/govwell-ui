import * as React from 'react';
import { cva } from 'class-variance-authority';

import { cn } from '@/lib/utils';

// A record's status. Statuses are org data — a name and a hue the org picked
// — so the hue is mapped onto GovWell's palette rather than painted as is:
// the label sits on a tint (Sky for working, Hope for waiting on someone,
// Field for done, Ash for closed, and two beyond the brand — amber and teal —
// so an org's orange and emerald don't read as its yellow and green) with a
// small square dot in the status colour in front of it. Red has no brand tint, so it is a hairline
// box with a red dot. No status yet reads as a dashed "Draft".
//
//   <StatusBadge status={{ name: 'In review', color: 'blue' }} />

const statusBadgeVariants = cva(
  'eyebrow-type inline-flex w-fit shrink-0 items-center gap-2 rounded-none border border-transparent px-2 py-1.5 text-xs whitespace-nowrap text-tint-foreground',
  {
    variants: {
      hue: {
        sky: 'bg-sky-tint',
        hope: 'bg-hope-tint',
        amber: 'bg-amber-tint',
        teal: 'bg-teal-tint',
        field: 'bg-field-tint',
        ash: 'bg-ash-tint',
        red: 'border-border bg-transparent text-foreground',
        draft: 'border-dashed border-input bg-transparent text-muted-foreground',
      },
    },
    defaultVariants: { hue: 'ash' },
  },
);

const DOT: Record<StatusHue, string> = {
  sky: 'bg-info',
  hope: 'bg-primary',
  amber: 'bg-warning',
  teal: 'bg-teal',
  field: 'bg-ok',
  ash: 'bg-muted-foreground',
  red: 'bg-destructive',
  draft: 'border border-muted-foreground',
};

type StatusHue = 'sky' | 'hope' | 'amber' | 'teal' | 'field' | 'ash' | 'red' | 'draft';

// the hue names orgs pick (and the colour pickers that feed them), onto ours
const HUES: Record<string, StatusHue> = {
  blue: 'sky',
  sky: 'sky',
  cyan: 'teal',
  teal: 'teal',
  info: 'sky',
  indigo: 'sky',
  purple: 'sky',
  violet: 'sky',
  yellow: 'hope',
  hope: 'hope',
  gold: 'hope',
  amber: 'amber',
  orange: 'amber',
  warning: 'amber',
  green: 'field',
  emerald: 'teal',
  lime: 'field',
  field: 'field',
  ok: 'field',
  gray: 'ash',
  grey: 'ash',
  slate: 'ash',
  neutral: 'ash',
  ash: 'ash',
  red: 'red',
  rose: 'red',
  pink: 'red',
  destructive: 'red',
};

/** the GovWell hue for an org's colour name; unknown names fall back to Ash */
function statusHue(color: string | null | undefined): Exclude<StatusHue, 'draft'> {
  const hue = color ? HUES[color.trim().toLowerCase()] : undefined;
  return hue && hue !== 'draft' ? hue : 'ash';
}

type StatusBadgeProps = Omit<React.ComponentProps<'span'>, 'children'> & {
  /** the org's status: a name and a hue; null for a record with no status yet */
  status: { name: string; color?: string | null } | null;
  /** what a missing status says */
  draftLabel?: string;
};

function StatusBadge({ status, draftLabel = 'Draft', className, ...props }: StatusBadgeProps) {
  const hue: StatusHue = status ? statusHue(status.color) : 'draft';
  return (
    <span data-slot="status-badge" data-hue={hue} className={cn(statusBadgeVariants({ hue }), className)} {...props}>
      <span data-slot="status-badge-dot" aria-hidden className={cn('size-2 shrink-0', DOT[hue])} />
      {status ? status.name : draftLabel}
    </span>
  );
}

export { StatusBadge, statusBadgeVariants, statusHue, type StatusHue };
