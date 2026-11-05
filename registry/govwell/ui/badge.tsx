import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

// A small square label in the eyebrow's type: uppercase with 4% tracking, on
// one of the brand tints, or solid for a status.
const badgeVariants = cva(
  "eyebrow-type inline-flex w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-none border border-transparent px-2 py-1.5 text-xs whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring [&>svg]:pointer-events-none [&>svg:not([class*='size-'])]:size-3",
  {
    variants: {
      variant: {
        default: 'bg-hope-tint text-tint-foreground',
        sky: 'bg-sky-tint text-tint-foreground',
        field: 'bg-field-tint text-tint-foreground',
        // the two status extensions, for tags that need more than the brand tints
        amber: 'bg-amber-tint text-tint-foreground',
        teal: 'bg-teal-tint text-tint-foreground',
        ash: 'bg-ash-tint text-tint-foreground',
        outline: 'border-border text-foreground',
        solid: 'bg-secondary text-secondary-foreground',
        ok: 'bg-ok text-ok-foreground',
        warning: 'bg-warning text-warning-foreground',
        destructive: 'bg-destructive text-destructive-foreground',
        info: 'bg-info text-info-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

function Badge({
  className,
  variant = 'default',
  render,
  ...props
}: useRender.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: 'span',
    props: mergeProps<'span'>({ className: cn(badgeVariants({ variant }), className) }, props),
    render,
    state: { slot: 'badge', variant },
  });
}

export { Badge, badgeVariants };
