import * as React from 'react';
import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

// The body of a message, as a square block in Light type. The default — your
// own messages — is a Slate block (white in dark mode); the assistant's
// answers are `ghost`, plain text on the page with no fill, or `muted`.
// `tinted` is a soft Hope highlight, `outline` an Ash-edged card, and
// `destructive` a message that didn't send. BubbleContent can be a button or
// link (render) for suggested questions and quick replies.

function BubbleGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="bubble-group" className={cn('flex min-w-0 flex-col gap-1.5', className)} {...props} />;
}

const bubbleVariants = cva(
  'group/bubble relative flex w-fit max-w-[80%] min-w-0 flex-col gap-1 group-data-[align=end]/message:self-end data-[align=end]:self-end data-[variant=ghost]:max-w-full',
  {
    variants: {
      variant: {
        default:
          '*:data-[slot=bubble-content]:bg-secondary *:data-[slot=bubble-content]:text-secondary-foreground [&>[data-slot=bubble-content]:is(button,a):hover]:bg-secondary/85',
        muted:
          '*:data-[slot=bubble-content]:bg-muted *:data-[slot=bubble-content]:text-foreground [&>[data-slot=bubble-content]:is(button,a):hover]:bg-accent',
        tinted:
          '*:data-[slot=bubble-content]:bg-hope-tint *:data-[slot=bubble-content]:text-tint-foreground [&>[data-slot=bubble-content]:is(button,a):hover]:bg-primary',
        outline:
          '*:data-[slot=bubble-content]:border-border *:data-[slot=bubble-content]:bg-card *:data-[slot=bubble-content]:text-card-foreground [&>[data-slot=bubble-content]:is(button,a):hover]:border-foreground [&>[data-slot=bubble-content]:is(button,a):hover]:bg-accent',
        ghost:
          '*:data-[slot=bubble-content]:bg-transparent *:data-[slot=bubble-content]:p-0 *:data-[slot=bubble-content]:text-foreground [&>[data-slot=bubble-content]:is(button,a):hover]:underline',
        destructive:
          '*:data-[slot=bubble-content]:border-error *:data-[slot=bubble-content]:bg-background *:data-[slot=bubble-content]:text-foreground [&>[data-slot=bubble-content]:is(button,a):hover]:bg-accent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function Bubble({
  variant = 'default',
  align = 'start',
  className,
  ...props
}: React.ComponentProps<'div'> &
  VariantProps<typeof bubbleVariants> & {
    align?: 'start' | 'end';
  }) {
  return (
    <div data-slot="bubble" data-variant={variant} data-align={align} className={cn(bubbleVariants({ variant }), className)} {...props} />
  );
}

// A box that wraps text stays as wide as the space it was given, leaving a gap
// after the longest line wider than the padding. CSS can't shrink it to the
// text, so measure the lines and set the width to the longest one; again
// whenever the space or the text changes.
function useFitToText(ref: React.RefObject<HTMLElement | null>) {
  React.useLayoutEffect(() => {
    const el = ref.current;
    const room = el?.parentElement?.parentElement;
    if (!el || !room || typeof ResizeObserver === 'undefined') return;
    const fit = () => {
      el.style.width = '';
      const range = document.createRange();
      // no layout to measure (jsdom): leave the box as it is
      if (typeof range.getClientRects !== 'function') return;
      range.selectNodeContents(el);
      const lines = [...range.getClientRects()];
      // one line already fits (w-fit); anything but text is left alone
      if (lines.length < 2 || el.querySelector('img, video, svg, table, pre')) return;
      const text = Math.max(...lines.map((r) => r.right)) - Math.min(...lines.map((r) => r.left));
      const style = getComputedStyle(el);
      const frame = ['paddingLeft', 'paddingRight', 'borderLeftWidth', 'borderRightWidth'].reduce(
        (sum, side) => sum + parseFloat(style[side as 'paddingLeft']),
        0,
      );
      el.style.width = `${Math.ceil(text + frame)}px`;
    };
    fit();
    // refit when the room changes width, or the text changes (a streamed answer)
    const resized = new ResizeObserver(fit);
    resized.observe(room);
    const edited = new MutationObserver(fit);
    edited.observe(el, { childList: true, characterData: true, subtree: true });
    return () => {
      resized.disconnect();
      edited.disconnect();
    };
  }, [ref]);
}

function BubbleContent({ className, render, ...props }: useRender.ComponentProps<'div'>) {
  const ref = React.useRef<HTMLDivElement>(null);
  useFitToText(ref);
  return useRender({
    ref,
    defaultTagName: 'div',
    props: mergeProps<'div'>(
      {
        className: cn(
          'w-fit max-w-full min-w-0 overflow-hidden rounded-none border border-transparent px-4 py-2.5 text-sm leading-relaxed font-light wrap-break-word group-data-[align=end]/bubble:self-end [button]:cursor-pointer [button]:text-left [button,a]:transition-colors [button,a]:outline-none [button,a]:focus-visible:outline-2 [button,a]:focus-visible:outline-offset-2 [button,a]:focus-visible:outline-solid [button,a]:focus-visible:outline-ring',
          className,
        ),
      },
      props,
    ),
    render,
    state: { slot: 'bubble-content' },
  });
}

const bubbleReactionsVariants = cva(
  'absolute z-10 flex w-fit shrink-0 items-center justify-center gap-1 rounded-none border border-border bg-popover px-1.5 py-0.5 text-xs text-popover-foreground ring-2 ring-background has-[button]:p-0',
  {
    variants: {
      side: {
        top: 'top-0 -translate-y-3/4',
        bottom: 'bottom-0 translate-y-3/4',
      },
      align: {
        start: 'left-3',
        end: 'right-3',
      },
    },
    defaultVariants: {
      side: 'bottom',
      align: 'end',
    },
  },
);

function BubbleReactions({
  side = 'bottom',
  align = 'end',
  className,
  ...props
}: React.ComponentProps<'div'> & {
  align?: 'start' | 'end';
  side?: 'top' | 'bottom';
}) {
  return (
    <div
      data-slot="bubble-reactions"
      data-align={align}
      data-side={side}
      className={cn(bubbleReactionsVariants({ side, align }), className)}
      {...props}
    />
  );
}

export { Bubble, BubbleContent, BubbleGroup, BubbleReactions, bubbleVariants };
