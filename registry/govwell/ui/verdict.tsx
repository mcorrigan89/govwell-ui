import type { ReactNode } from 'react';
import { Check, CheckCheck, Clock, RotateCcw, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// A decision, worn like a stamp: a solid square with the mark — a check for a
// pass, a double check for "as noted", a cross for a fail, a turn-back for
// "revise", a clock while it's open — then what was decided on the matching
// tint, in sentence case. The mark pops in when it first shows, so an
// approval lands with a little joy and a failure is unmistakable.
//
//   <Verdict kind="pass" subject="Zoning">Approved</Verdict>

const KIND = {
  pass: { mark: Check, solid: 'bg-ok text-ok-foreground', tint: 'bg-field-tint text-tint-foreground' },
  noted: {
    mark: CheckCheck,
    solid: 'bg-teal text-tint-foreground',
    tint: 'bg-teal-tint text-tint-foreground',
  },
  fail: {
    mark: X,
    solid: 'bg-destructive text-destructive-foreground',
    tint: 'bg-destructive/10 text-foreground',
  },
  revise: {
    mark: RotateCcw,
    solid: 'bg-destructive text-destructive-foreground',
    tint: 'bg-destructive/10 text-foreground',
  },
  pending: { mark: Clock, solid: 'bg-info text-info-foreground', tint: 'bg-sky-tint text-tint-foreground' },
} as const;

export type VerdictKind = keyof typeof KIND;

export function Verdict({
  kind,
  subject,
  children,
  className,
}: {
  kind: VerdictKind;
  /** whose decision: a discipline, an inspection */
  subject?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const { mark: Mark, solid, tint } = KIND[kind];
  return (
    <span data-verdict={kind} className={cn('inline-flex h-7 items-stretch text-sm whitespace-nowrap', className)}>
      <span aria-hidden className={cn('grid w-7 shrink-0 place-items-center animate-in duration-300 zoom-in-50 fade-in', solid)}>
        <Mark className="size-4" strokeWidth={2.5} />
      </span>
      <span className={cn('flex items-center gap-1.5 px-2.5', tint)}>
        {subject && <span className="font-normal">{subject}</span>}
        {subject && (
          <span aria-hidden className="opacity-40">
            ·
          </span>
        )}
        <span className={subject ? 'font-light' : 'font-normal'}>{children}</span>
      </span>
    </span>
  );
}
