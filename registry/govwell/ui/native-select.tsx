import * as React from 'react';
import { ChevronDownIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

// The browser's own <select> in a square white box like <Input> — for long
// lists, phones, and forms that should work before JavaScript loads. Use
// <Select> for a styled popup.

type NativeSelectProps = Omit<React.ComponentProps<'select'>, 'size'> & {
  size?: 'sm' | 'default';
};

function NativeSelect({ className, size = 'default', ...props }: NativeSelectProps) {
  return (
    <div
      className={cn('group/native-select relative w-fit has-[select:disabled]:opacity-40', className)}
      data-slot="native-select-wrapper"
      data-size={size}
    >
      <select
        data-slot="native-select"
        data-size={size}
        className="h-12 w-full min-w-0 appearance-none rounded-none border border-input bg-background py-1 pr-11 pl-4 text-base font-light text-foreground transition-colors outline-none select-none hover:border-foreground focus-visible:border-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring disabled:pointer-events-none disabled:cursor-not-allowed aria-invalid:border-error data-[size=sm]:h-10 data-[size=sm]:pr-10 data-[size=sm]:pl-3 data-[size=sm]:text-sm"
        {...props}
      />
      <ChevronDownIcon
        className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-foreground select-none group-data-[size=sm]/native-select:right-3"
        strokeWidth={1.5}
        aria-hidden="true"
        data-slot="native-select-icon"
      />
    </div>
  );
}

function NativeSelectOption({ className, ...props }: React.ComponentProps<'option'>) {
  return <option data-slot="native-select-option" className={cn('bg-popover text-popover-foreground', className)} {...props} />;
}

function NativeSelectOptGroup({ className, ...props }: React.ComponentProps<'optgroup'>) {
  return (
    <optgroup data-slot="native-select-optgroup" className={cn('bg-popover font-normal text-popover-foreground', className)} {...props} />
  );
}

export { NativeSelect, NativeSelectOptGroup, NativeSelectOption };
