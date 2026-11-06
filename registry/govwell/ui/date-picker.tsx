'use client';

import * as React from 'react';
import { CalendarIcon } from 'lucide-react';

import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// One date, picked from a calendar in a square popover. The trigger looks
// like a text input: a Concrete edge that turns to the text colour on hover,
// focus and while the calendar is open. Controlled like any input — `value`
// and `onValueChange` — so it drops into a form library's field; the trigger
// takes id, aria-invalid and onBlur for the label and errors.

const defaultFormat = (date: Date) => date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

function DatePicker({
  value,
  onValueChange,
  placeholder = 'Pick a date',
  format = defaultFormat,
  disabled,
  className,
  calendar,
  'aria-label': ariaLabel,
  ...props
}: Omit<React.ComponentProps<'button'>, 'value' | 'defaultValue' | 'onChange'> & {
  value?: Date | undefined;
  onValueChange?: (date: Date | undefined) => void;
  placeholder?: string;
  format?: (date: Date) => string;
  /** extra props for the calendar: disabled days, month range, locale… */
  calendar?: Omit<React.ComponentProps<typeof Calendar>, 'mode' | 'selected' | 'onSelect'>;
}) {
  const [open, setOpen] = React.useState(false);
  const shown = value ? format(value) : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        data-slot="date-picker"
        data-placeholder={value ? undefined : ''}
        disabled={disabled}
        className={cn(
          "flex h-12 w-64 items-center justify-between gap-2 rounded-none border border-input bg-background px-4 text-base font-light whitespace-nowrap text-foreground transition-colors outline-none hover:border-foreground focus-visible:border-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-40 aria-invalid:border-error data-placeholder:text-muted-foreground data-popup-open:border-foreground [&_svg:not([class*='size-'])]:size-4",
          className,
        )}
        {...props}
        // an aria-label names the field; the name keeps what's shown after it (WCAG 2.5.3)
        aria-label={ariaLabel ? `${ariaLabel}: ${shown}` : undefined}
      >
        <span className="truncate">{shown}</span>
        <CalendarIcon className="shrink-0 text-foreground" />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          {...calendar}
          mode="single"
          selected={value}
          defaultMonth={value ?? calendar?.defaultMonth}
          onSelect={(date) => {
            onValueChange?.(date);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

export { DatePicker };
