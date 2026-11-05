import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { FlagMark } from '@/components/ui/flag-mark';
import { cn } from '@/lib/utils';

// A panel laid on GovWell's base grid around one intersection, like the "Now
// on GovWell" layouts in the brand book: a block of brand colour and the copy
// above the line, the flag mark and the image below it.
//
//   <GridPanel tone="sky" eyebrow="Now on GovWell" title="Twinsburg, OH" media={<img … />} />

const blockVariants = cva('', {
  variants: {
    tone: {
      hope: 'bg-hope',
      sky: 'bg-sky',
      field: 'bg-field',
      slate: 'bg-slate',
    },
  },
  defaultVariants: { tone: 'sky' },
});

type GridPanelProps = Omit<React.ComponentProps<'section'>, 'title'> &
  VariantProps<typeof blockVariants> & {
    eyebrow?: React.ReactNode;
    title: React.ReactNode;
    /** fills the lower-right quadrant: a photo, a map, a screenshot */
    media?: React.ReactNode;
    /** sits at the intersection's lower-left; the flag mark by default */
    mark?: React.ReactNode;
  };

function GridPanel({ tone, eyebrow, title, media, mark, className, children, ...props }: GridPanelProps) {
  return (
    <section
      data-slot="grid-panel"
      className={cn('grid grid-cols-[1fr_3fr] grid-rows-[minmax(10rem,auto)_minmax(10rem,auto)] bg-muted text-foreground', className)}
      {...props}
    >
      <div aria-hidden className={blockVariants({ tone })} />
      <div className="base-grid flex flex-col justify-end gap-2 p-6">
        {eyebrow && <span className="eyebrow-type text-xs">{eyebrow}</span>}
        <h3 className="text-4xl leading-none tracking-tight">{title}</h3>
        {children}
      </div>
      <div className="base-grid flex items-center justify-center">{mark ?? <FlagMark className="h-5" />}</div>
      <div className="relative overflow-hidden bg-accent *:size-full *:object-cover">{media}</div>
    </section>
  );
}

export { GridPanel };
