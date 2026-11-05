'use client';

import * as React from 'react';
import { DayPicker, getDefaultClassNames, type DayButton, type Locale } from 'react-day-picker';
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// A month grid (react-day-picker) on a square card with an Ash hairline:
// square day cells in Light figures, today underlined in Hope, the chosen day
// a Slate block (white in dark mode), and the days of a range on Base between
// their Slate ends. Takes every DayPicker prop — mode="single", "multiple" or
// "range", selected, onSelect, disabled days, and so on. Inside a card or
// popover it drops its own frame.

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = 'label',
  buttonVariant = 'ghost',
  locale,
  formatters,
  labels,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>['variant'];
}) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        'group/calendar border border-border bg-card p-4 text-card-foreground [--cell-size:--spacing(10)] in-data-[slot=card-content]:border-0 in-data-[slot=card-content]:bg-transparent in-data-[slot=popover-content]:border-0 in-data-[slot=popover-content]:bg-transparent',
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className,
      )}
      captionLayout={captionLayout}
      locale={locale}
      labels={{
        // the day's own number as a word ("November 1, 2026", not "1st"), so the
        // name holds the visible text (WCAG 2.5.3, label in name)
        labelDayButton: (date, modifiers) =>
          `${modifiers.today ? 'Today, ' : ''}${date.toLocaleDateString(locale?.code ?? 'en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}${modifiers.selected ? ', selected' : ''}`,
        ...labels,
      }}
      formatters={{
        formatMonthDropdown: (date) => date.toLocaleString(locale?.code, { month: 'short' }),
        ...formatters,
      }}
      classNames={{
        root: cn('w-fit', defaultClassNames.root),
        months: cn('relative flex flex-col gap-6 md:flex-row', defaultClassNames.months),
        month: cn('flex w-full flex-col gap-4', defaultClassNames.month),
        nav: cn('absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1', defaultClassNames.nav),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          'size-(--cell-size) p-0 select-none aria-disabled:opacity-40',
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          'size-(--cell-size) p-0 select-none aria-disabled:opacity-40',
          defaultClassNames.button_next,
        ),
        month_caption: cn('flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)', defaultClassNames.month_caption),
        dropdowns: cn('flex h-(--cell-size) w-full items-center justify-center gap-1.5 text-sm font-normal', defaultClassNames.dropdowns),
        dropdown_root: cn(
          'relative border border-input bg-background text-foreground transition-colors hover:border-foreground has-focus-visible:border-foreground has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-solid has-focus-visible:outline-ring',
          defaultClassNames.dropdown_root,
        ),
        dropdown: cn('absolute inset-0 bg-popover opacity-0', defaultClassNames.dropdown),
        caption_label: cn(
          'font-normal tracking-tight text-foreground select-none',
          captionLayout === 'label'
            ? 'text-lg'
            : 'flex h-8 items-center gap-1 pr-1 pl-2 text-sm [&>svg]:size-3.5 [&>svg]:text-muted-foreground',
          defaultClassNames.caption_label,
        ),
        month_grid: cn('w-full border-collapse', defaultClassNames.month_grid),
        weekdays: cn('flex', defaultClassNames.weekdays),
        weekday: cn('flex-1 pb-1 text-xs font-normal text-muted-foreground select-none', defaultClassNames.weekday),
        week: cn('mt-0.5 flex w-full', defaultClassNames.week),
        week_number_header: cn('w-(--cell-size) select-none', defaultClassNames.week_number_header),
        week_number: cn('text-xs text-muted-foreground tabular-nums select-none', defaultClassNames.week_number),
        day: cn('group/day relative aspect-square h-full w-full p-0 text-center select-none', defaultClassNames.day),
        range_start: cn('relative isolate z-0 bg-accent', defaultClassNames.range_start),
        range_middle: cn('bg-accent', defaultClassNames.range_middle),
        range_end: cn('relative isolate z-0 bg-accent', defaultClassNames.range_end),
        today: cn(
          '[&>button]:font-normal [&>button]:underline [&>button]:decoration-primary [&>button]:decoration-3 [&>button]:underline-offset-6',
          defaultClassNames.today,
        ),
        outside: cn('text-muted-foreground aria-selected:text-muted-foreground', defaultClassNames.outside),
        disabled: cn('text-muted-foreground opacity-40', defaultClassNames.disabled),
        hidden: cn('invisible', defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => <div data-slot="calendar" ref={rootRef} className={cn(className)} {...props} />,
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === 'left') return <ChevronLeftIcon className={cn('size-4', className)} {...props} />;
          if (orientation === 'right') return <ChevronRightIcon className={cn('size-4', className)} {...props} />;
          return <ChevronDownIcon className={cn('size-4', className)} {...props} />;
        },
        DayButton: ({ ...props }) => <CalendarDayButton locale={locale} {...props} />,
        WeekNumber: ({ children, ...props }) => (
          <td {...props}>
            <div className="flex size-(--cell-size) items-center justify-center text-center">{children}</div>
          </td>
        ),
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  locale,
  ...props
}: React.ComponentProps<typeof DayButton> & { locale?: Partial<Locale> }) {
  const defaultClassNames = getDefaultClassNames();

  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString(locale?.code)}
      data-selected-single={modifiers.selected && !modifiers.range_start && !modifiers.range_end && !modifiers.range_middle}
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        'relative isolate z-10 flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 border-0 text-sm leading-none font-light text-foreground tabular-nums group-data-[outside=true]/day:not-data-[selected-single=true]:text-muted-foreground group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-20 group-data-[focused=true]/day:outline-2 group-data-[focused=true]/day:outline-offset-2 group-data-[focused=true]/day:outline-solid group-data-[focused=true]/day:outline-ring data-[range-end=true]:bg-secondary data-[range-end=true]:text-secondary-foreground data-[range-end=true]:hover:bg-secondary/85 data-[range-middle=true]:bg-transparent data-[range-middle=true]:text-accent-foreground data-[range-middle=true]:hover:bg-border data-[range-start=true]:bg-secondary data-[range-start=true]:text-secondary-foreground data-[range-start=true]:hover:bg-secondary/85 data-[selected-single=true]:bg-secondary data-[selected-single=true]:font-normal data-[selected-single=true]:text-secondary-foreground data-[selected-single=true]:hover:bg-secondary/85 [&>span]:text-xs [&>span]:opacity-70',
        defaultClassNames.day,
        className,
      )}
      {...props}
    />
  );
}

export { Calendar, CalendarDayButton };
