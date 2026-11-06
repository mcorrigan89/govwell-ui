import * as React from 'react';

import { cn } from '@/lib/utils';

// A multi-line square text box, like <Input>: white with a Concrete edge that
// turns Slate (white in dark mode) on hover and focus, with the focus ring
// outside it. It grows with its text.
function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex field-sizing-content min-h-24 w-full rounded-none border border-input bg-background px-4 py-3 text-base font-light text-foreground transition-colors outline-none placeholder:text-muted-foreground hover:border-foreground focus-visible:border-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-40 aria-invalid:border-error',
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
