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
// `variant="underline"` drops the strip: the options sit as plain text links,
// evenly spaced. The chosen one is Medium and underlined; the others draw a
// lighter underline in from the left on hover. Each rule is as thick as its
// weight's strokes. Choosing swaps instantly, as for any selection that moves
// between siblings: only the hover draws.

const segmentedControlVariants = cva('group/segmented-control inline-flex items-stretch rounded-none', {
  variants: {
    variant: {
      segmented: 'gap-0.5 border border-border bg-muted p-0.5',
      underline: 'gap-6',
    },
    size: {
      sm: 'h-10',
      default: 'h-12',
      lg: 'h-14',
    },
  },
  defaultVariants: { variant: 'segmented', size: 'default' },
});

const segmentedControlItemVariants = cva(
  "inline-flex min-w-0 items-center justify-center gap-2 rounded-none font-light whitespace-nowrap text-muted-foreground outline-none select-none hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        segmented:
          'data-pressed:bg-secondary data-pressed:text-secondary-foreground data-[highlighted]:data-pressed:bg-primary data-[highlighted]:data-pressed:text-primary-foreground',
        // --rule is the underline's size, drawn on the label below (0.08em is
        // GT Standard Light's stroke, 0.11em Medium's, so it matches the type
        // at any size). A hover draws it in and out over --rule-time; choosing
        // is instant both ways: the chosen item, and the one it replaced
        // (data-deselected, until the pointer next comes back to it)
        underline:
          '[--rule-time:200ms] [--rule:0%_0.08em] hover:[--rule:100%_0.08em] data-deselected:[--rule-time:0ms] data-pressed:font-medium data-pressed:text-foreground data-pressed:[--rule-time:0ms] data-pressed:[--rule:100%_0.11em] data-pressed:hover:[--rule:100%_0.11em] motion-reduce:[--rule-time:0ms]',
      },
      size: {
        sm: 'px-3 text-sm',
        default: 'px-4 text-base',
        lg: "px-5 text-lg [&_svg:not([class*='size-'])]:size-5",
      },
    },
    // underline items have no side padding: the gap alone spaces them
    compoundVariants: [{ variant: 'underline', className: 'px-0' }],
    defaultVariants: { variant: 'segmented', size: 'default' },
  },
);

const SegmentedControlContext = React.createContext<
  VariantProps<typeof segmentedControlItemVariants> & {
    fitContent?: boolean;
    /** the value chosen before the current one, until the pointer returns to it */
    deselected?: string;
    clearDeselected?: () => void;
  }
>({});

function SegmentedControl<TValue extends string>({
  className,
  value,
  defaultValue,
  onValueChange,
  variant,
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
  // remember what was chosen before, so its underline clears without animating
  const [seen, setSeen] = React.useState<{ current?: string; deselected?: string }>({ current });
  if (seen.current !== current) setSeen({ current, deselected: seen.current });
  const clearDeselected = React.useCallback(() => setSeen((s) => ({ current: s.current })), []);

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
      className={cn(segmentedControlVariants({ variant, size }), fitContent ? 'w-fit' : 'flex w-full', className)}
      {...props}
    >
      <SegmentedControlContext.Provider value={{ variant, size, fitContent, deselected: seen.deselected, clearDeselected }}>
        {children}
      </SegmentedControlContext.Provider>
    </ToggleGroupPrimitive>
  );
}

function SegmentedControlItem({
  className,
  highlighted,
  children,
  onPointerEnter,
  ...props
}: TogglePrimitive.Props & {
  value: string;
  /** Hope instead of Slate when chosen */
  highlighted?: boolean;
}) {
  const { variant, size, fitContent, deselected, clearDeselected } = React.useContext(SegmentedControlContext);
  const wasChosen = variant === 'underline' && deselected !== undefined && deselected === props.value;
  return (
    <TogglePrimitive
      data-slot="segmented-control-item"
      data-highlighted={highlighted || undefined}
      data-deselected={wasChosen || undefined}
      className={cn(segmentedControlItemVariants({ variant, size }), fitContent ? 'flex-none' : 'flex-1', className)}
      {...props}
      onPointerEnter={(e) => {
        if (wasChosen) clearDeselected?.();
        onPointerEnter?.(e);
      }}
    >
      {variant === 'underline' ? (
        // the chosen item is Medium, wider than Light: an invisible Medium copy
        // holds each item at that width, so choosing doesn't shift the row
        <span className="inline-grid">
          <span aria-hidden className="invisible col-start-1 row-start-1 inline-flex items-center gap-2 font-medium">
            {children}
          </span>
          <span className="col-start-1 row-start-1 inline-flex items-center justify-center gap-2 justify-self-center bg-[linear-gradient(currentColor,currentColor)] bg-(size:--rule) bg-[position:0_100%] bg-no-repeat pb-1.5 transition-[background-size] duration-(--rule-time) ease-out">
            {children}
          </span>
        </span>
      ) : (
        children
      )}
    </TogglePrimitive>
  );
}

export { SegmentedControl, SegmentedControlItem };
