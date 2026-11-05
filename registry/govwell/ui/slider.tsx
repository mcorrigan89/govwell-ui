'use client';

import { Slider as SliderPrimitive } from '@base-ui/react/slider';

import { cn } from '@/lib/utils';

// A thin Ash track with the chosen range drawn in Slate (white in dark mode)
// and square white thumbs with a Slate edge. Pass a number for one thumb or
// an array for a range.
//
// The control is the input inside each thumb, so the aria-* props here are
// passed down to the thumbs. Name it with aria-label, or point aria-labelledby
// at a visible label (a <label htmlFor> can't reach it); give a range's thumbs
// their own names with getAriaLabel. aria-invalid marks the thumbs.

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  getAriaLabel,
  ...props
}: SliderPrimitive.Root.Props & {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean | 'true' | 'false';
  getAriaLabel?: (index: number) => string;
}) {
  const values = Array.isArray(value) ? value : Array.isArray(defaultValue) ? defaultValue : [min];

  return (
    <SliderPrimitive.Root
      className={cn('data-horizontal:w-full data-vertical:h-full', className)}
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      thumbAlignment="edge"
      {...props}
    >
      <SliderPrimitive.Control className="relative flex w-full touch-none items-center select-none data-disabled:opacity-40 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col">
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="relative grow overflow-hidden rounded-none bg-border select-none data-horizontal:h-1 data-horizontal:w-full data-vertical:h-full data-vertical:w-1"
        >
          <SliderPrimitive.Indicator
            data-slot="slider-range"
            className="bg-secondary select-none data-horizontal:h-full data-vertical:w-full"
          />
        </SliderPrimitive.Track>
        {values.map((_, index) => (
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            key={index}
            index={values.length > 1 ? index : undefined}
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
            aria-describedby={ariaDescribedBy}
            aria-invalid={ariaInvalid}
            getAriaLabel={getAriaLabel}
            className="block size-5 shrink-0 rounded-none border border-secondary bg-background transition-colors select-none hover:bg-accent has-focus-visible:outline-2 has-focus-visible:outline-solid has-focus-visible:outline-offset-2 has-focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-error"
          />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}

export { Slider };
