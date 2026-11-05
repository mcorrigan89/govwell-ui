import * as React from 'react';
import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// A row in a list — a permit, a case record, a department: media on the
// left, a Regular title and a line of description, actions on the right.
// Render it as a link with `render={<a href=… />}` and it takes a soft grey
// hover. variant="outline" puts it in a square panel with an Ash hairline;
// variant="muted" on the grey surface.

function ItemGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    // no role="list": items are often links or buttons, which can't be list
    // items. For a real list, pass role="list" and give each Item role="listitem".
    <div
      data-slot="item-group"
      className={cn('group/item-group flex w-full flex-col gap-4 has-data-[size=sm]:gap-2.5 has-data-[size=xs]:gap-2', className)}
      {...props}
    />
  );
}

// a drawn rule, hidden from assistive tech, so it can sit in an item group
// that's been given role="list" (a list may only hold list items)
function ItemSeparator({ className, ...props }: React.ComponentProps<'div'>) {
  return <div aria-hidden data-slot="item-separator" className={cn('my-2 h-px w-full shrink-0 bg-border', className)} {...props} />;
}

const itemVariants = cva(
  'group/item flex w-full flex-wrap items-center rounded-none border text-sm transition-colors duration-100 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring [a]:transition-colors [a]:hover:bg-accent [a]:hover:text-accent-foreground',
  {
    variants: {
      variant: {
        default: 'border-transparent',
        outline: 'border-border bg-card text-card-foreground',
        muted: 'border-transparent bg-muted',
      },
      size: {
        default: 'gap-4 px-5 py-4',
        sm: 'gap-3 px-4 py-3',
        xs: 'gap-2 px-2.5 py-2 in-data-[slot=dropdown-menu-content]:p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Item({
  className,
  variant = 'default',
  size = 'default',
  render,
  ...props
}: useRender.ComponentProps<'div'> & VariantProps<typeof itemVariants>) {
  return useRender({
    defaultTagName: 'div',
    props: mergeProps<'div'>(
      {
        className: cn(itemVariants({ variant, size, className })),
      },
      props,
    ),
    render,
    state: {
      slot: 'item',
      variant,
      size,
    },
  });
}

const itemMediaVariants = cva(
  'flex shrink-0 items-center justify-center gap-2 group-has-data-[slot=item-description]/item:translate-y-0.5 group-has-data-[slot=item-description]/item:self-start [&_svg]:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        icon: "size-10 bg-hope-tint text-tint-foreground group-data-[size=sm]/item:size-8 group-data-[size=xs]/item:size-6 [&_svg:not([class*='size-'])]:size-5 group-data-[size=xs]/item:[&_svg:not([class*='size-'])]:size-3.5",
        image:
          'size-10 overflow-hidden rounded-none border border-border group-data-[size=sm]/item:size-8 group-data-[size=xs]/item:size-6 [&_img]:size-full [&_img]:object-cover',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function ItemMedia({ className, variant = 'default', ...props }: React.ComponentProps<'div'> & VariantProps<typeof itemMediaVariants>) {
  return <div data-slot="item-media" data-variant={variant} className={cn(itemMediaVariants({ variant, className }))} {...props} />;
}

function ItemContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="item-content"
      className={cn('flex flex-1 flex-col gap-1 group-data-[size=xs]/item:gap-0 [&+[data-slot=item-content]]:flex-none', className)}
      {...props}
    />
  );
}

function ItemTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="item-title"
      className={cn(
        'line-clamp-1 flex w-fit items-center gap-2 text-base leading-snug font-normal underline-offset-4 group-data-[size=xs]/item:text-sm',
        className,
      )}
      {...props}
    />
  );
}

function ItemDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="item-description"
      className={cn(
        'line-clamp-2 text-left text-sm leading-normal font-light text-muted-foreground group-data-[size=xs]/item:text-xs [&>a]:underline [&>a]:decoration-1 [&>a]:underline-offset-4 [&>a:hover]:text-foreground',
        className,
      )}
      {...props}
    />
  );
}

function ItemActions({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="item-actions" className={cn('flex items-center gap-2', className)} {...props} />;
}

function ItemHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="item-header" className={cn('flex basis-full items-center justify-between gap-2', className)} {...props} />;
}

function ItemFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="item-footer" className={cn('flex basis-full items-center justify-between gap-2', className)} {...props} />;
}

export { Item, ItemMedia, ItemContent, ItemActions, ItemGroup, ItemSeparator, ItemTitle, ItemDescription, ItemHeader, ItemFooter };
