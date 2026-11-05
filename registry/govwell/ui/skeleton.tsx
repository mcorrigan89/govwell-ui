import * as React from 'react';

import { cn } from '@/lib/utils';

// Where content will be once it loads: a flat, square grey block (the
// foreground at 10%, so it reads in both modes) that slowly pulses. Size it
// to the thing it stands in for.

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn('animate-pulse rounded-none bg-foreground/10 motion-reduce:animate-none', className)}
      {...props}
    />
  );
}

export { Skeleton };
