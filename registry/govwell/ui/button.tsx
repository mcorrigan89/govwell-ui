import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

// Square buttons in GT Standard Light. The main action is a black block with
// white type (white with black type in dark mode, so it still shows on the
// black ground) that turns Hope with black type on hover; the second is a
// Slate block (white in dark mode). Secondary, outline and ghost share that
// Hope hover. Sizes follow the site's 50px controls.
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-none border border-transparent text-base font-light whitespace-nowrap transition-colors outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-error [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-secondary text-secondary-foreground hover:bg-hope hover:text-slate aria-expanded:bg-hope aria-expanded:text-slate',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-hope hover:text-slate aria-expanded:bg-hope aria-expanded:text-slate',
        outline:
          'border-foreground bg-transparent text-foreground hover:border-hope hover:bg-hope hover:text-slate aria-expanded:border-hope aria-expanded:bg-hope aria-expanded:text-slate',
        ghost: 'text-foreground hover:bg-hope hover:text-slate aria-expanded:bg-hope aria-expanded:text-slate',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        // no underline at rest; a 1px rule draws in from the left on hover
        // (and on keyboard focus), instantly under reduced motion
        link: 'bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-[position:0_100%] bg-no-repeat text-foreground transition-[background-size] duration-200 ease-out hover:bg-[length:100%_1px] focus-visible:bg-[length:100%_1px] motion-reduce:transition-none',
      },
      size: {
        default: 'h-12 gap-2 px-6 has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5',
        xs: "h-8 gap-1.5 px-3 text-sm has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-3.5",
        sm: 'h-10 gap-2 px-4 text-sm has-data-[icon=inline-end]:pr-3.5 has-data-[icon=inline-start]:pl-3.5',
        lg: 'h-14 gap-2.5 px-8 text-lg has-data-[icon=inline-end]:pr-7 has-data-[icon=inline-start]:pl-7 [&_svg:not([class*="size-"])]:size-5',
        icon: 'size-12',
        'icon-xs': "size-8 [&_svg:not([class*='size-'])]:size-3.5",
        'icon-sm': 'size-10',
        'icon-lg': 'size-14 [&_svg:not([class*="size-"])]:size-5',
      },
    },
    // a link has no padding, icon or not, so its underline ends with the text
    compoundVariants: [{ variant: 'link', className: 'h-auto px-0 has-data-[icon=inline-end]:pr-0 has-data-[icon=inline-start]:pl-0' }],
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return <ButtonPrimitive data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
