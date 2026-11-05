import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

// The eyebrow label, GovWell's signpost: a short uppercase label on a brand
// tint, with an icon on a matching square tile tucked under its lower-left
// corner, so the two squares meet like the flag mark's. Without an icon it
// is just the chip.
//
//   <Eyebrow icon={<QuoteIcon />}>Testimonial</Eyebrow>

const eyebrowVariants = cva('', {
  variants: {
    tone: {
      hope: 'bg-hope-tint',
      sky: 'bg-sky-tint',
      field: 'bg-field-tint',
      ash: 'bg-ash-tint',
    },
  },
  defaultVariants: { tone: 'hope' },
});

type EyebrowProps = React.ComponentProps<'div'> &
  VariantProps<typeof eyebrowVariants> & {
    /** shown on the square tile under the label's lower-left corner */
    icon?: React.ReactNode;
  };

function Eyebrow({ tone, icon, className, children, ...props }: EyebrowProps) {
  const tint = eyebrowVariants({ tone });
  return (
    <div
      data-slot="eyebrow"
      data-tone={tone ?? 'hope'}
      className={cn(
        'inline-grid w-fit text-tint-foreground',
        icon ? 'grid-cols-[1.75rem_auto] grid-rows-[1.75rem_1.75rem]' : '',
        className,
      )}
      {...props}
    >
      <span className={cn('eyebrow-type flex h-7 items-center px-2.5', tint, icon && 'col-start-2 row-start-1')}>{children}</span>
      {icon && (
        <span
          aria-hidden
          className={cn("col-start-1 row-start-2 flex size-7 items-center justify-center [&_svg:not([class*='size-'])]:size-3.5", tint)}
        >
          {icon}
        </span>
      )}
    </div>
  );
}

export { Eyebrow, eyebrowVariants };
