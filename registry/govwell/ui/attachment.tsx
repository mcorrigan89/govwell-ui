import * as React from 'react';
import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { cva, type VariantProps } from 'class-variance-authority';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// A file or image in a message or the composer — a site plan, a permit PDF,
// an inspection photo: a square card with an Ash hairline holding media, a
// name, a line about it (size, progress, what went wrong) and actions.
// `state` drives the look: idle is a dashed Concrete edge (not yet sent),
// uploading and processing pulse, error turns the edge and the line red.
// AttachmentTrigger makes the whole card clickable.

const attachmentVariants = cva(
  'group/attachment relative flex w-fit max-w-full min-w-0 shrink-0 flex-wrap rounded-none border border-border bg-card font-light text-card-foreground transition-colors has-[>a,>button]:hover:border-foreground has-[>a,>button]:hover:bg-accent has-[>[data-slot=attachment-trigger]:focus-visible]:outline-2 has-[>[data-slot=attachment-trigger]:focus-visible]:outline-offset-2 has-[>[data-slot=attachment-trigger]:focus-visible]:outline-solid has-[>[data-slot=attachment-trigger]:focus-visible]:outline-ring data-[state=error]:border-error data-[state=idle]:border-dashed data-[state=idle]:border-input',
  {
    variants: {
      size: {
        default:
          'gap-3 text-sm has-data-[slot=attachment-content]:px-3 has-data-[slot=attachment-content]:py-2.5 has-data-[slot=attachment-media]:p-2.5',
        sm: 'gap-2.5 text-sm has-data-[slot=attachment-content]:px-2.5 has-data-[slot=attachment-content]:py-2 has-data-[slot=attachment-media]:p-2',
        xs: 'gap-2 text-xs has-data-[slot=attachment-content]:px-2 has-data-[slot=attachment-content]:py-1.5 has-data-[slot=attachment-media]:p-1.5',
      },
      orientation: {
        horizontal: 'min-w-48 items-center',
        vertical: 'w-28 flex-col has-data-[slot=attachment-content]:w-36',
      },
    },
  },
);

type AttachmentState = 'idle' | 'uploading' | 'processing' | 'error' | 'done';

function Attachment({
  className,
  state = 'done',
  size = 'default',
  orientation = 'horizontal',
  ...props
}: React.ComponentProps<'div'> &
  VariantProps<typeof attachmentVariants> & {
    state?: AttachmentState;
  }) {
  return (
    <div
      data-slot="attachment"
      data-state={state}
      data-size={size}
      data-orientation={orientation}
      aria-busy={state === 'uploading' || state === 'processing' ? true : undefined}
      className={cn(attachmentVariants({ size, orientation }), className)}
      {...props}
    />
  );
}

// the file-type tile: Ash tint with Slate type, red when it failed
const attachmentMediaVariants = cva(
  "relative flex aspect-square w-10 shrink-0 items-center justify-center overflow-hidden rounded-none bg-ash-tint text-tint-foreground group-data-[orientation=vertical]/attachment:w-full group-data-[size=sm]/attachment:w-9 group-data-[size=xs]/attachment:w-7 group-data-[state=error]/attachment:bg-destructive group-data-[state=error]/attachment:text-destructive-foreground group-data-[orientation=vertical]/attachment:*:data-[slot=spinner]:size-6! [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 group-data-[orientation=vertical]/attachment:[&_svg:not([class*='size-'])]:size-6 group-data-[size=xs]/attachment:[&_svg:not([class*='size-'])]:size-3.5",
  {
    variants: {
      variant: {
        icon: '',
        image:
          'opacity-60 group-data-[state=done]/attachment:opacity-100 group-data-[state=idle]/attachment:opacity-100 *:[img]:aspect-square *:[img]:w-full *:[img]:object-cover',
      },
    },
    defaultVariants: {
      variant: 'icon',
    },
  },
);

function AttachmentMedia({
  className,
  variant = 'icon',
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof attachmentMediaVariants>) {
  return (
    <div data-slot="attachment-media" data-variant={variant} className={cn(attachmentMediaVariants({ variant }), className)} {...props} />
  );
}

function AttachmentContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="attachment-content"
      className={cn('max-w-full min-w-0 flex-1 leading-tight group-data-[orientation=vertical]/attachment:px-1', className)}
      {...props}
    />
  );
}

function AttachmentTitle({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="attachment-title"
      className={cn(
        'block max-w-full min-w-0 truncate font-normal text-foreground group-data-[state=processing]/attachment:animate-pulse group-data-[state=uploading]/attachment:animate-pulse',
        className,
      )}
      {...props}
    />
  );
}

function AttachmentDescription({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="attachment-description"
      className={cn(
        'mt-1 block max-w-full min-w-0 truncate text-xs text-muted-foreground tabular-nums group-data-[state=error]/attachment:text-error',
        className,
      )}
      {...props}
    />
  );
}

function AttachmentActions({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="attachment-actions"
      className={cn(
        'relative z-20 flex shrink-0 items-center group-data-[orientation=vertical]/attachment:absolute group-data-[orientation=vertical]/attachment:top-3 group-data-[orientation=vertical]/attachment:right-3 group-data-[orientation=vertical]/attachment:gap-1',
        className,
      )}
      {...props}
    />
  );
}

function AttachmentAction({ className, variant, size = 'icon-xs', ...props }: React.ComponentProps<typeof Button>) {
  return <Button data-slot="attachment-action" variant={variant ?? 'ghost'} size={size} className={cn(className)} {...props} />;
}

function AttachmentTrigger({ className, render, type, ...props }: useRender.ComponentProps<'button'>) {
  return useRender({
    defaultTagName: 'button',
    props: mergeProps<'button'>(
      {
        type: render ? type : (type ?? 'button'),
        className: cn('absolute inset-0 z-10 cursor-pointer outline-none', className),
      },
      props,
    ),
    render,
    state: {
      slot: 'attachment-trigger',
    },
  });
}

function AttachmentGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="attachment-group"
      className={cn(
        'flex min-w-0 snap-x snap-mandatory scroll-px-1 gap-3 overflow-x-auto overscroll-x-contain p-1 [scrollbar-width:thin] *:data-[slot=attachment]:flex-none *:data-[slot=attachment]:snap-start',
        className,
      )}
      {...props}
    />
  );
}

export {
  Attachment,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentContent,
  AttachmentTitle,
  AttachmentDescription,
  AttachmentActions,
  AttachmentAction,
  AttachmentTrigger,
};
