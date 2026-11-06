import * as React from 'react';

import { cn } from '@/lib/utils';

// An n-of-m count drawn as a row of square segments: inspections passed of
// those required, documents received of those asked for. Filled segments are
// Slate (White in dark mode), or a status colour when the count means
// something — red for what's holding a case up; the rest are Ash. The label
// and the count sit beneath in muted Light type.
//
//   <Meter label="Inspections passed" value={3} total={5} />

const FILL = {
  neutral: 'bg-secondary',
  ok: 'bg-ok',
  info: 'bg-info',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
  // the signal-tone names
  phosphor: 'bg-secondary',
  signal: 'bg-destructive',
  system: 'bg-warning',
} as const;

type MeterTone = keyof typeof FILL;

function Meter({
  label,
  value,
  total,
  tone = 'neutral',
  className,
  ...props
}: Omit<React.ComponentProps<'div'>, 'children'> & {
  label: string;
  value: number;
  total: number;
  tone?: MeterTone;
}) {
  const segments = Math.max(Math.floor(total), 1);
  const filled = Math.min(Math.max(value, 0), segments);
  return (
    <div data-slot="meter" data-tone={tone} className={cn('flex flex-col gap-2', className)} {...props}>
      <div
        role="meter"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={filled}
        aria-valuetext={`${filled} of ${total}`}
        aria-label={label}
        // many segments shrink to fit the width
        className="flex h-4 max-w-full gap-0.5"
      >
        {Array.from({ length: segments }, (_, i) => (
          <span
            key={i}
            data-slot="meter-segment"
            data-filled={i < filled ? '' : undefined}
            className={cn('h-full w-3 min-w-0.5 shrink', i < filled ? FILL[tone] : 'bg-ash-tint')}
          />
        ))}
      </div>
      <span className="text-sm text-muted-foreground">
        {label} <span className="text-foreground tabular-nums">{`${filled}/${total}`}</span>
      </span>
    </div>
  );
}

export { Meter, type MeterTone };
