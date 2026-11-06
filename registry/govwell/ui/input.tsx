import * as React from 'react';
import { Input as InputPrimitive } from '@base-ui/react/input';

import { cn } from '@/lib/utils';

// A square text box, as on govwell.com: a Concrete edge that turns Slate (or
// white in dark mode) on hover and focus, with the focus ring outside it.
function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        'h-12 w-full min-w-0 rounded-none border border-input bg-background px-4 py-1 text-base font-light text-foreground transition-colors outline-none file:inline-flex file:h-8 file:border-0 file:bg-transparent file:text-sm file:font-normal file:text-foreground placeholder:text-muted-foreground hover:border-foreground focus-visible:border-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40 aria-invalid:border-error',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
