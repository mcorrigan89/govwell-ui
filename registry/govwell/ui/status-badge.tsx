import * as React from 'react';
import { cva } from 'class-variance-authority';

import { cn } from '@/lib/utils';

// A record's status. Statuses are org data — a name and a hue the org picked
// — so the hue is mapped onto GovWell's palette rather than painted as is:
// the label sits on a tint from the tag families, text only: Blueprint's strong
// 300 for working (as on an "In review" badge), Gold Standard for waiting on someone, Greenlight for done (an org's
// green on the tint, its emerald or cyan on the strong 300), the darkest Groundwork (white type)
// for closed, Ribbon Cutting's strong red (white type) for a problem, and Gold's second shade for an org's orange so
// it doesn't read as its yellow. No status yet reads as a dashed
// "Draft".
//
//   <StatusBadge status={{ name: 'In review', color: 'blue' }} />

const statusBadgeVariants = cva(
  'eyebrow-type tracking-[0.05em] inline-flex w-fit shrink-0 items-center gap-2 rounded-none border border-transparent px-2.5 py-1.5 text-xs whitespace-nowrap text-tag-foreground',
  {
    variants: {
      hue: {
        // the tag families: Blueprint in progress, Gold Standard waiting,
        // Greenlight done, Groundwork neutral, Ribbon Cutting a problem
        // in progress: Blueprint's strong 300, as on an "In review" badge
        sky: 'bg-blueprint-300',
        // an early step (an org's light blue): Blueprint's 100
        'pale-sky': 'bg-blueprint-100',
        // due soon (an org's yellow): Ribbon Cutting's lightest red, as on "Fees due"
        hope: 'bg-ribbon-100',
        // waiting to be paid (an org's orange): Gold Standard's lightest
        amber: 'bg-gold-100',
        // done: an org's green on Greenlight's tint, its emerald or cyan on the
        // strong 300 (Field)
        teal: 'bg-greenlight-300',
        field: 'bg-greenlight-100',
        // closed (an org's gray): the darkest Groundwork, white type
        ash: 'bg-groundwork-400 text-tag-foreground-inverse',
        // a problem (an org's red): Ribbon Cutting's strong 300, white type, as on
        // an "Expired" tone badge
        red: 'bg-ribbon-300 text-tag-foreground-inverse',
        draft: 'border-dashed border-input bg-transparent text-muted-foreground',
      },
    },
    defaultVariants: { hue: 'ash' },
  },
);

type StatusHue = 'sky' | 'pale-sky' | 'hope' | 'amber' | 'teal' | 'field' | 'ash' | 'red' | 'draft';

// the hue names orgs pick (and the colour pickers that feed them), onto ours
const HUES: Record<string, StatusHue> = {
  blue: 'sky',
  sky: 'sky',
  'light blue': 'pale-sky',
  lightblue: 'pale-sky',
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
      {status ? status.name : draftLabel}
    </span>
  );
}

export { StatusBadge, statusBadgeVariants, statusHue, type StatusHue };
