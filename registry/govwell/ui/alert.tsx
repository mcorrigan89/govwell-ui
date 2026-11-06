import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

// A notice in the page: a square card with an Ash hairline, the icon on a
// square tile of its status colour (Hope for a plain notice, Field, amber,
// red or Sky), a Regular title and the details in Light. A status also draws
// a rail down the left edge. The tile, not a tinted icon, carries the colour,
// since Hope, Sky and Field are never text colours on white; the body text
// stays in the text colour.

const alertVariants = cva(
  'relative grid w-full gap-1 border border-border bg-card px-5 py-4 text-left text-sm text-card-foreground has-data-[slot=alert-action]:pr-24 has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-4 *:[svg]:row-span-2 *:[svg]:box-content *:[svg]:size-5 *:[svg]:p-1.5',
  {
    variants: {
      variant: {
        default: '*:[svg]:bg-primary *:[svg]:text-primary-foreground',
        ok: 'border-l-4 border-l-ok *:[svg]:bg-ok *:[svg]:text-ok-foreground',
        warning: 'border-l-4 border-l-warning *:[svg]:bg-warning *:[svg]:text-warning-foreground',
        destructive: 'border-l-4 border-l-destructive *:[svg]:bg-destructive *:[svg]:text-destructive-foreground',
        info: 'border-l-4 border-l-info *:[svg]:bg-info *:[svg]:text-info-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

function Alert({ className, variant, ...props }: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      data-variant={variant ?? 'default'}
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-title"
      className={cn('flex min-h-8 flex-wrap items-center gap-x-2 gap-y-1 text-base leading-tight font-normal tracking-tight', className)}
      {...props}
    />
  );
}

function AlertDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        'text-sm font-light text-foreground [&_a]:underline [&_a]:decoration-1 [&_a]:underline-offset-4 [&_a:hover]:decoration-2 [&_p:not(:last-child)]:mb-2',
        className,
      )}
      {...props}
    />
  );
}

function AlertAction({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="alert-action" className={cn('absolute top-3.5 right-3.5', className)} {...props} />;
}

export { Alert, AlertTitle, AlertDescription, AlertAction, alertVariants };
