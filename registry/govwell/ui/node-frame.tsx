import * as React from 'react';

import { cn } from '@/lib/utils';

// The "tech layer" from GovWell's expressive icons: a dotted frame with a
// solid square node at each corner, drawn around an icon, an image or a block
// of content. Decorative; the frame and nodes are hidden from assistive tech.

function NodeFrame({ className, children, ...props }: React.ComponentProps<'div'>) {
  return (
    <div data-slot="node-frame" className={cn('relative w-fit p-4', className)} {...props}>
      {/* spaced dots, as in the brand book's icons: a 1px dash every 4px */}
      <svg aria-hidden className="pointer-events-none absolute inset-0 size-full overflow-visible text-foreground/70">
        <rect
          width="100%"
          height="100%"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="1 3"
          shapeRendering="crispEdges"
        />
      </svg>
      {(['-top-1 -left-1', '-top-1 -right-1', '-bottom-1 -left-1', '-bottom-1 -right-1'] as const).map((pos) => (
        <span key={pos} aria-hidden className={cn('pointer-events-none absolute size-2 bg-foreground', pos)} />
      ))}
      <div className="relative">{children}</div>
    </div>
  );
}

export { NodeFrame };
