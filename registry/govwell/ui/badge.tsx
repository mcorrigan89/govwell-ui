import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

// A small square label in the eyebrow's type: uppercase with 4% tracking, on
// a tint from the tag families (Gold Standard, Blueprint, Groundwork,
// Greenlight, Ribbon Cutting) with black type, or a strong fill for a status;
// tracked a little wider than an eyebrow (5%, not 4%).
// Tags look the same in light and dark mode.
const badgeVariants = cva(
  "eyebrow-type tracking-[0.05em] inline-flex w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-none border border-transparent px-2.5 py-1.5 text-xs whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring [&>svg]:pointer-events-none [&>svg:not([class*='size-'])]:size-3",
  {
    variants: {
      variant: {
        // Gold Standard's full gold (Hope): a tag that leads, like a case study
        gold: 'bg-gold-400 text-tag-foreground',
        // tints: each family's 100, or its 200 for a second shade
        default: 'bg-gold-100 text-tag-foreground',
        sky: 'bg-blueprint-100 text-tag-foreground',
        field: 'bg-greenlight-100 text-tag-foreground',
        amber: 'bg-gold-200 text-tag-foreground',
        // as on an emerald status (Certified): Greenlight's strong 300
        teal: 'bg-greenlight-300 text-tag-foreground',
        ash: 'bg-groundwork-100 text-tag-foreground',
        red: 'bg-ribbon-100 text-tag-foreground',
        outline: 'border-border text-foreground',
        solid: 'bg-secondary text-secondary-foreground',
        // strong fills: each family's 300
        ok: 'bg-greenlight-300 text-tag-foreground',
        // waiting on someone: Gold Standard's light tint, like every waiting tag
        warning: 'bg-gold-100 text-tag-foreground',
        destructive: 'bg-ribbon-300 text-tag-foreground-inverse',
        info: 'bg-blueprint-300 text-tag-foreground',
        // Groundwork's strong 300, white type: withdrawn, set aside
        groundwork: 'bg-groundwork-300 text-tag-foreground-inverse',
        // the darkest Groundwork, white type: a figure that should stand out (a population)
        brown: 'bg-groundwork-400 text-tag-foreground-inverse',
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
