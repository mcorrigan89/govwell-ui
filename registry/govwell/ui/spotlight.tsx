'use client';

import * as React from 'react';
import { Popover as PopoverPrimitive } from '@base-ui/react/popover';
import { cva } from 'class-variance-authority';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Pointing at something on the page: a Hope ring round the target and a
// callout hanging off it — the popover's square panel, below the target by
// default, above when there's no room, kept inside the viewport and following
// the target as the page scrolls or resizes (Base UI's anchored positioner
// does the measuring). A section also gets its name on a small Hope chip on
// its top edge, like an eyebrow. A tour is the same callout stepping through
// targets with Back / Next / Done and "Step 2 of 4". No glow, no sweep: the
// ring is a flat 2px Hope outline, set off from the target so it never covers it.
//
//   <SpotlightCallout target="#fees" kind="section" label="Fees" open={open} onOpenChange={setOpen}>
//     Every fee on this permit, and what has been paid.
//   </SpotlightCallout>

/** the ring, as classes, for anyone who wants to apply it statically */
const spotlightHighlightVariants = cva('relative z-10 outline-2 outline-solid outline-primary', {
  variants: {
    kind: {
      // a section stands out from its neighbours and must not clip its chip
      section: 'overflow-visible! outline-offset-4',
      control: 'outline-offset-2',
    },
    chip: {
      true: 'after:pointer-events-none after:absolute after:-top-3.5 after:left-5 after:z-[2] after:flex after:h-7 after:items-center after:bg-primary after:px-2.5 after:text-xs after:text-primary-foreground after:eyebrow-type after:content-[attr(data-spotlight-label)]',
      false: '',
    },
  },
  defaultVariants: { kind: 'control', chip: false },
});

type SpotlightKind = 'section' | 'control';

/** an element, a ref to one, or a selector (waited for, since the target may not have mounted yet) */
type SpotlightTarget = Element | React.RefObject<Element | null> | string | null | undefined;

const WIDTH = 320;

/** resolve the target to an element; a selector is polled for up to `waitFor` ms */
function useSpotlightTarget(target: SpotlightTarget, enabled: boolean, waitFor: number, onMissing?: () => void) {
  // the element found for this target; a stale find (for an earlier target) is ignored
  const [found, setFound] = React.useState<{ target: SpotlightTarget; element: Element } | null>(null);
  const missing = React.useRef(onMissing);
  React.useEffect(() => {
    missing.current = onMissing;
  });
  React.useEffect(() => {
    if (!enabled || !target) return;
    const find = () => (typeof target === 'string' ? document.querySelector(target) : target instanceof Element ? target : target.current);
    const now = find();
    if (now) {
      // the target lives in the DOM (or behind a ref), so it can only be read after commit
      // oxlint-disable-next-line react/set-state-in-effect
      setFound({ target, element: now });
      return;
    }
    const started = Date.now();
    const timer = window.setInterval(() => {
      const element = find();
      if (element) {
        window.clearInterval(timer);
        setFound({ target, element });
      } else if (Date.now() - started >= waitFor) {
        window.clearInterval(timer);
        missing.current?.();
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [target, enabled, waitFor]);
  return enabled && found && found.target === target && found.element.isConnected ? found.element : null;
}

/** add the ring's classes to the target while it is spotlit, and take back only the ones we added */
function useSpotlightHighlight(element: Element | null, kind: SpotlightKind, label: string | undefined) {
  React.useEffect(() => {
    if (!element) return;
    const classes = spotlightHighlightVariants({ kind, chip: kind === 'section' && !!label })
      .split(/\s+/)
      .filter((c) => c && !element.classList.contains(c));
    element.classList.add(...classes);
    const hadLabel = element.getAttribute('data-spotlight-label');
    if (label) element.setAttribute('data-spotlight-label', label);
    element.setAttribute('data-spotlit', '');
    return () => {
      element.classList.remove(...classes);
      element.removeAttribute('data-spotlit');
      if (hadLabel === null) element.removeAttribute('data-spotlight-label');
      else element.setAttribute('data-spotlight-label', hadLabel);
    };
  }, [element, kind, label]);
}

/** bring the target into view; the callout follows it */
function useScrollIntoView(element: Element | null, enabled: boolean) {
  React.useEffect(() => {
    if (!element || !enabled || typeof element.scrollIntoView !== 'function') return;
    const reduce = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    element.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
  }, [element, enabled]);
}

/**
 * Anchor on the target — except a section taller than most of the viewport,
 * whose bottom may be off-screen: then hang the callout from its top edge,
 * inside its right corner, under the chip.
 */
function anchorFor(element: Element) {
  return {
    contextElement: element,
    getBoundingClientRect() {
      const r = element.getBoundingClientRect();
      const tall = r.height > window.innerHeight * 0.6;
      if (!tall) return r;
      const left = Math.max(r.left, r.right - WIDTH - 16);
      const top = r.top + 16;
      return { x: left, y: top, left, top, right: left + WIDTH, bottom: top + 16, width: WIDTH, height: 16 };
    },
  };
}

type SpotlightCalloutProps = {
  /** what to point at */
  target: SpotlightTarget;
  open?: boolean;
  /** called with false on Escape, the close button or the dismiss button; an outside click doesn't dismiss */
  onOpenChange?: (open: boolean) => void;
  /** a section (a card or panel: ring plus name chip) or a control (a button or field: ring only) */
  kind?: SpotlightKind;
  /** the target's name: the callout's title unless `title` is given, and a section's chip */
  label?: string;
  title?: React.ReactNode;
  /** a small label above the title, e.g. the tour's name */
  eyebrow?: React.ReactNode;
  /** "Step 2 of 4" in the corner */
  step?: { index: number; total: number };
  /** the note: what this is and why it matters */
  children?: React.ReactNode;
  /** the buttons at the foot; defaults to one "Got it" that dismisses */
  footer?: React.ReactNode;
  dismissLabel?: string;
  /** which side to prefer; it flips when there's no room */
  side?: 'bottom' | 'top';
  /** draw the ring on the target (default true) */
  highlight?: boolean;
  /** scroll the target into view when it is spotlit (default true) */
  scrollIntoView?: boolean;
  /** how long to wait for a selector target to appear (default 2000 ms) */
  waitFor?: number;
  /** the target never appeared: say so rather than pointing at nothing */
  onTargetMissing?: () => void;
  /** move focus into the callout when it opens (default true) */
  initialFocus?: PopoverPrimitive.Popup.Props['initialFocus'];
  className?: string;
};

function SpotlightCallout({
  target,
  open = true,
  onOpenChange,
  kind = 'control',
  label,
  title,
  eyebrow,
  step,
  children,
  footer,
  dismissLabel = 'Got it',
  side = 'bottom',
  highlight = true,
  scrollIntoView = true,
  waitFor = 2000,
  onTargetMissing,
  initialFocus,
  className,
}: SpotlightCalloutProps) {
  const element = useSpotlightTarget(target, open, waitFor, onTargetMissing);
  useSpotlightHighlight(open && highlight ? element : null, kind, label);
  useScrollIntoView(open ? element : null, scrollIntoView);
  const anchor = React.useMemo(() => (element ? anchorFor(element) : null), [element]);

  return (
    <PopoverPrimitive.Root
      open={open && !!element}
      onOpenChange={(next, details) => {
        // the callout is non-modal: the page stays usable around it, so a
        // click elsewhere (or focus moving away) doesn't end a tour
        if (!next && (details.reason === 'outside-press' || details.reason === 'focus-out')) return;
        onOpenChange?.(next);
      }}
    >
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner
          anchor={anchor}
          side={side}
          align="start"
          sideOffset={14}
          collisionPadding={12}
          className="isolate z-50"
        >
          <PopoverPrimitive.Popup
            data-slot="spotlight-callout"
            initialFocus={initialFocus}
            className={cn(
              'flex w-80 max-w-[calc(100vw-1.5rem)] origin-(--transform-origin) flex-col gap-2 rounded-none border border-border bg-popover p-5 text-sm text-popover-foreground shadow-lg outline-hidden duration-150 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0',
              className,
            )}
          >
            <div className="flex min-h-6 items-center gap-3">
              {eyebrow && <span className="eyebrow-type bg-hope-tint px-2 py-1 text-xs text-tint-foreground">{eyebrow}</span>}
              {step && (
                <span data-slot="spotlight-step" className="shrink-0 text-sm whitespace-nowrap text-muted-foreground tabular-nums">
                  Step {step.index + 1} of {step.total}
                </span>
              )}
              <PopoverPrimitive.Close aria-label="Close" className="-mr-2 ml-auto" render={<Button variant="ghost" size="icon-xs" />}>
                <X />
              </PopoverPrimitive.Close>
            </div>
            <PopoverPrimitive.Title className="text-lg leading-tight font-normal tracking-tight">{title ?? label}</PopoverPrimitive.Title>
            {children && <PopoverPrimitive.Description className="text-muted-foreground">{children}</PopoverPrimitive.Description>}
            <div data-slot="spotlight-footer" className="mt-3 flex items-center justify-end gap-2">
              {footer ?? (
                <Button size="sm" onClick={() => onOpenChange?.(false)}>
                  {dismissLabel}
                </Button>
              )}
            </div>
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

type SpotlightTourStep = {
  target: SpotlightTarget;
  title?: React.ReactNode;
  label?: string;
  kind?: SpotlightKind;
  /** what to say about this step */
  body?: React.ReactNode;
};

type SpotlightTourProps = Pick<
  SpotlightCalloutProps,
  'open' | 'onOpenChange' | 'side' | 'highlight' | 'scrollIntoView' | 'waitFor' | 'initialFocus' | 'className'
> & {
  steps: SpotlightTourStep[];
  /** the tour's name, shown above each step */
  title?: React.ReactNode;
  /** the current step, controlled */
  index?: number;
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  /** Done on the last step (Escape or the close button only call `onOpenChange(false)`) */
  onFinish?: () => void;
  /** a step's target never appeared */
  onTargetMissing?: (index: number) => void;
};

function SpotlightTour({
  steps,
  title,
  index: indexProp,
  defaultIndex = 0,
  onIndexChange,
  onFinish,
  onTargetMissing,
  open = true,
  onOpenChange,
  ...callout
}: SpotlightTourProps) {
  const [ownIndex, setOwnIndex] = React.useState(defaultIndex);
  const index = Math.min(Math.max(indexProp ?? ownIndex, 0), Math.max(steps.length - 1, 0));
  const go = (next: number) => {
    setOwnIndex(next);
    onIndexChange?.(next);
  };
  const step = steps[index];
  if (!step) return null;
  const last = index === steps.length - 1;
  return (
    <SpotlightCallout
      {...callout}
      open={open}
      onOpenChange={onOpenChange}
      target={step.target}
      kind={step.kind}
      label={step.label}
      title={step.title}
      eyebrow={title}
      step={{ index, total: steps.length }}
      onTargetMissing={onTargetMissing ? () => onTargetMissing(index) : undefined}
      footer={
        <>
          {index > 0 && (
            <Button size="sm" variant="ghost" onClick={() => go(index - 1)}>
              Back
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => {
              if (!last) return go(index + 1);
              onFinish?.();
              onOpenChange?.(false);
            }}
          >
            {last ? 'Done' : 'Next'}
          </Button>
        </>
      }
    >
      {step.body}
    </SpotlightCallout>
  );
}

export { SpotlightCallout, SpotlightTour, spotlightHighlightVariants, type SpotlightKind, type SpotlightTarget, type SpotlightTourStep };
