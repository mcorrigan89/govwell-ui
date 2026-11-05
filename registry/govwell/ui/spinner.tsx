import * as React from 'react';

import { cn } from '@/lib/utils';

// Busy, for how long unknown: the brand's "tech layer" in motion, a dotted
// ring with one solid square node travelling round it. Sized and coloured by
// className, like an icon; it takes the colour of the text around it.

function Spinner({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <svg
      data-slot="spinner"
      role="status"
      aria-label="Loading"
      viewBox="0 0 24 24"
      fill="none"
      className={cn('size-4 animate-spin [animation-duration:1.2s] motion-reduce:[animation-duration:3s]', className)}
      {...props}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" strokeDasharray="1.5 2.5" opacity={0.5} />
      <rect x="9.5" y="0.5" width="5" height="5" fill="currentColor" />
    </svg>
  );
}

export { Spinner };
