import * as React from 'react';

import { cn } from '@/lib/utils';

// A key figure, as in govwell.com's metrics strip: a large Regular-weight
// number and a short caption beneath it.

function Stat({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="stat" className={cn('flex flex-col gap-2', className)} {...props} />;
}

function StatValue({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div data-slot="stat-value" className={cn('text-6xl leading-none font-normal tracking-tight tabular-nums', className)} {...props} />
  );
}

function StatLabel({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="stat-label" className={cn('max-w-56 text-muted-foreground', className)} {...props} />;
}

export { Stat, StatLabel, StatValue };
