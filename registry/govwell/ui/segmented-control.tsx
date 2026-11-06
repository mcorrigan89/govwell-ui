'use client';

import * as React from 'react';
import { Toggle as TogglePrimitive } from '@base-ui/react/toggle';
import { ToggleGroup as ToggleGroupPrimitive } from '@base-ui/react/toggle-group';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

// One of a few mutually exclusive options — a view, a period, a mode — as a
// quiet Base strip with the chosen segment a Slate block (white in dark
// mode). Exactly one is always chosen: pressing the chosen one again does
// nothing. Arrow keys move between segments. `highlighted` on a segment makes
// it Hope when chosen, for the one option that marks the main path. Spans its
// container by default; `fitContent` sizes the strip to its labels.

const segmentedControlVariants = cva(
  'group/segmented-control inline-flex items-stretch gap-0.5 rounded-none border border-border bg-muted p-0.5',
  {
    variants: {
      size: {
        sm: 'h-10',
        default: 'h-12',
        lg: 'h-14',
      },
    },
    defaultVariants: { size: 'default' },
  },
);

const segmentedControlItemVariants = cva(
  "inline-flex min-w-0 items-center justify-center gap-2 rounded-none font-light whitespace-nowrap text-muted-foreground transition-colors outline-none select-none hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-40 data-pressed:bg-secondary data-pressed:text-secondary-foreground data-[highlighted]:data-pressed:bg-primary data-[highlighted]:data-pressed:text-primary-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      size: {
        sm: 'px-3 text-sm',
        default: 'px-4 text-base',
        lg: "px-5 text-lg [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: { size: 'default' },
  },
);

const SegmentedControlContext = React.createContext<VariantProps<typeof segmentedControlItemVariants> & { fitContent?: boolean }>({});

function SegmentedControl<TValue extends string>({
  className,
  value,
  defaultValue,
  onValueChange,
  size,
  fitContent = false,
  children,
  ...props
}: Omit<ToggleGroupPrimitive.Props, 'value' | 'defaultValue' | 'onValueChange' | 'multiple'> &
  VariantProps<typeof segmentedControlVariants> & {
    value?: TValue;
    defaultValue?: TValue;
    onValueChange?: (value: TValue) => void;
    /** size the strip to its labels instead of spanning the container */
    fitContent?: boolean;
  }) {
  const [uncontrolled, setUncontrolled] = React.useState<TValue | undefined>(defaultValue);
  const current = value !== undefined ? value : uncontrolled;

  return (
    <ToggleGroupPrimitive
      data-slot="segmented-control"
      data-size={size ?? 'default'}
      value={current === undefined ? [] : [current]}
      onValueChange={(next) => {
        // never empty: pressing the chosen segment keeps it chosen
        const picked = next[0] as TValue | undefined;
        if (picked === undefined || picked === current) return;
        setUncontrolled(picked);
        onValueChange?.(picked);
      }}
      className={cn(segmentedControlVariants({ size }), fitContent ? 'w-fit' : 'flex w-full', className)}
      {...props}
    >
      <SegmentedControlContext.Provider value={{ size, fitContent }}>{children}</SegmentedControlContext.Provider>
    </ToggleGroupPrimitive>
  );
}

function SegmentedControlItem({
  className,
  highlighted,
  ...props
}: TogglePrimitive.Props & {
  value: string;
  /** Hope instead of Slate when chosen */
  highlighted?: boolean;
}) {
  const { size, fitContent } = React.useContext(SegmentedControlContext);
  return (
    <TogglePrimitive
      data-slot="segmented-control-item"
      data-highlighted={highlighted || undefined}
      className={cn(segmentedControlItemVariants({ size }), fitContent ? 'flex-none' : 'flex-1', className)}
      {...props}
    />
  );
}

export { SegmentedControl, SegmentedControlItem };
