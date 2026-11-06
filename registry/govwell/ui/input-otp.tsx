'use client';

import * as React from 'react';
import { OTPField } from '@base-ui/react/otp-field';
import { MinusIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

// A one-time code, one character per square white box. `length` is required;
// render that many <InputOTPSlot>s, grouped however the code reads. Slots in a
// group share their Concrete edges; the focused one turns Slate-edged (white
// in dark mode) and ringed. `value` is a string.

// Base UI names each slot input from a <Field> label; outside one, the root's
// aria-labelledby is handed down so every slot carries the field's name
const LabelledByContext = React.createContext<string | undefined>(undefined);

function InputOTP({ className, 'aria-labelledby': labelledBy, ...props }: OTPField.Root.Props) {
  return (
    <LabelledByContext.Provider value={labelledBy}>
      <OTPField.Root
        data-slot="input-otp"
        aria-labelledby={labelledBy}
        className={cn('flex items-center gap-2 data-disabled:opacity-40', className)}
        {...props}
      />
    </LabelledByContext.Provider>
  );
}

function InputOTPGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="input-otp-group" className={cn('flex items-center', className)} {...props} />;
}

function InputOTPSlot({ className, ...props }: OTPField.Input.Props) {
  const labelledBy = React.useContext(LabelledByContext);
  return (
    <OTPField.Input
      aria-labelledby={labelledBy}
      data-slot="input-otp-slot"
      className={cn(
        'relative m-0 size-12 rounded-none border border-input bg-background p-0 text-center text-xl font-normal text-foreground tabular-nums caret-foreground transition-colors outline-none not-first:-ml-px hover:z-10 hover:border-foreground focus:z-20 focus:border-foreground focus:outline-2 focus:outline-offset-2 focus:outline-solid focus:outline-ring disabled:cursor-not-allowed aria-invalid:border-error',
        className,
      )}
      {...props}
    />
  );
}

function InputOTPSeparator({ ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="input-otp-separator"
      className="flex items-center text-muted-foreground [&_svg:not([class*='size-'])]:size-4"
      role="separator"
      {...props}
    >
      <MinusIcon strokeWidth={1.5} />
    </div>
  );
}

export { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot };
