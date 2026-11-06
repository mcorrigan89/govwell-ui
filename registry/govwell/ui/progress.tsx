'use client';

import { Progress as ProgressPrimitive } from '@base-ui/react/progress';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

// A square bar for work under way: the filled part is Hope, the brand's
// colour for progress, over a Base track, or a status colour by tone.
// value={null} means the length isn't known: the whole bar pulses until it
// is. Children (a ProgressLabel, a ProgressValue) sit above it.

const indicatorVariants = cva('h-full transition-all', {
  variants: {
    tone: {
      default: 'bg-primary',
      ok: 'bg-ok',
      warning: 'bg-warning',
      destructive: 'bg-destructive',
      info: 'bg-info',
    },
  },
  defaultVariants: {
    tone: 'default',
  },
});

function Progress({ className, children, value, tone, ...props }: ProgressPrimitive.Root.Props & VariantProps<typeof indicatorVariants>) {
  return (
    <ProgressPrimitive.Root
      value={value}
      data-slot="progress"
      className={cn('flex flex-wrap items-baseline gap-x-3 gap-y-2', className)}
      {...props}
    >
      {children}
      <ProgressTrack>
        <ProgressIndicator tone={tone} />
      </ProgressTrack>
    </ProgressPrimitive.Root>
  );
}

function ProgressTrack({ className, ...props }: ProgressPrimitive.Track.Props) {
  return (
    <ProgressPrimitive.Track
      className={cn('relative flex h-2 w-full items-center overflow-hidden rounded-none bg-muted', className)}
      data-slot="progress-track"
      {...props}
    />
  );
}

function ProgressIndicator({ className, tone, ...props }: ProgressPrimitive.Indicator.Props & VariantProps<typeof indicatorVariants>) {
  return (
    <ProgressPrimitive.Indicator
      data-slot="progress-indicator"
      className={cn(
        indicatorVariants({ tone }),
        'data-indeterminate:w-full data-indeterminate:animate-pulse motion-reduce:data-indeterminate:animate-none',
        className,
      )}
      {...props}
    />
  );
}

function ProgressLabel({ className, ...props }: ProgressPrimitive.Label.Props) {
  return <ProgressPrimitive.Label className={cn('text-sm font-normal text-foreground', className)} data-slot="progress-label" {...props} />;
}

function ProgressValue({ className, ...props }: ProgressPrimitive.Value.Props) {
  return (
    <ProgressPrimitive.Value
      className={cn('ml-auto text-sm font-light text-muted-foreground tabular-nums', className)}
      data-slot="progress-value"
      {...props}
    />
  );
}

export { Progress, ProgressIndicator, ProgressLabel, ProgressTrack, ProgressValue };
