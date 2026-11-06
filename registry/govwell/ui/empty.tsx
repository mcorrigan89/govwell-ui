import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { NodeFrame } from '@/components/ui/node-frame';
import { cn } from '@/lib/utils';

// Nothing here yet: a dashed Ash frame around an icon on a Hope-tint tile,
// itself held in the brand's node frame (dotted lines, square corner nodes),
// then a Regular title, a line of explanation and what to do about it.

function Empty({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="empty"
      className={cn(
        'flex w-full min-w-0 flex-1 flex-col items-center justify-center gap-6 border border-dashed border-border p-10 text-center text-balance',
        className,
      )}
      {...props}
    />
  );
}

function EmptyHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="empty-header" className={cn('flex max-w-sm flex-col items-center gap-2', className)} {...props} />;
}

const emptyMediaVariants = cva('mb-3 flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0', {
  variants: {
    variant: {
      default: 'bg-transparent',
      icon: "[&_svg:not([class*='size-'])]:size-6",
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

function EmptyMedia({
  className,
  variant = 'default',
  children,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof emptyMediaVariants>) {
  return (
    <div data-slot="empty-icon" data-variant={variant} className={cn(emptyMediaVariants({ variant, className }))} {...props}>
      {variant === 'icon' ? (
        <NodeFrame className="p-2">
          <div className="flex size-12 items-center justify-center bg-hope-tint text-tint-foreground">{children}</div>
        </NodeFrame>
      ) : (
        children
      )}
    </div>
  );
}

function EmptyTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="empty-title"
      className={cn('text-2xl leading-tight font-normal tracking-tight text-foreground', className)}
      {...props}
    />
  );
}

function EmptyDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="empty-description"
      className={cn(
        'text-base/relaxed text-muted-foreground [&>a]:underline [&>a]:decoration-1 [&>a]:underline-offset-4 [&>a:hover]:text-foreground',
        className,
      )}
      {...props}
    />
  );
}

function EmptyContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="empty-content"
      className={cn('flex w-full max-w-sm min-w-0 flex-col items-center gap-3 text-sm text-balance', className)}
      {...props}
    />
  );
}

export { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle };
