import * as React from 'react';
import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { cva, type VariantProps } from 'class-variance-authority';
import { CheckIcon, TriangleAlertIcon } from 'lucide-react';

import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

// A line in a conversation that isn't a message: a note ("Opened permit
// BP-2026-0142"), a separator between stretches of time in small muted
// eyebrow type, or — variant="activity" — what the assistant is doing: one
// square row per tool call with a status at the end. Give it a `status` and
// an empty <MarkerIcon /> shows the spinner while working, a tick when done
// and a warning when it didn't work. To show a tool call's details, render
// the row as a CollapsibleTrigger.

type MarkerStatusValue = 'working' | 'done' | 'error';

const MarkerContext = React.createContext<{ status?: MarkerStatusValue }>({});

const markerVariants = cva(
  "group/marker relative flex min-h-4 w-full items-center gap-2 text-left text-sm font-light text-muted-foreground [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [a]:text-foreground [a]:underline [a]:underline-offset-4",
  {
    variants: {
      variant: {
        default: '',
        separator:
          'eyebrow-type before:mr-1 before:h-px before:min-w-0 before:flex-1 before:bg-border after:ml-1 after:h-px after:min-w-0 after:flex-1 after:bg-border',
        border: 'border-b border-border pb-2',
        activity:
          'min-h-10 border border-border bg-background px-3 py-2 text-foreground transition-colors data-[status=error]:border-error [button]:cursor-pointer [button,a]:outline-none [button,a]:hover:bg-accent [button,a]:focus-visible:outline-2 [button,a]:focus-visible:outline-offset-2 [button,a]:focus-visible:outline-solid [button,a]:focus-visible:outline-ring',
      },
    },
  },
);

function Marker({
  className,
  variant = 'default',
  status,
  render,
  ...props
}: useRender.ComponentProps<'div'> &
  VariantProps<typeof markerVariants> & {
    /** what a tool call or job is doing; sets data-status and aria-busy */
    status?: MarkerStatusValue;
  }) {
  const element = useRender({
    defaultTagName: 'div',
    props: mergeProps<'div'>(
      {
        className: cn(markerVariants({ variant, className })),
        'aria-busy': status === 'working' ? true : undefined,
      },
      props,
    ),
    render,
    state: { slot: 'marker', variant, status },
  });
  return <MarkerContext.Provider value={{ status }}>{element}</MarkerContext.Provider>;
}

const STATUS_ICON: Record<MarkerStatusValue, React.ReactNode> = {
  working: <Spinner aria-hidden="true" role="presentation" />,
  done: <CheckIcon />,
  error: <TriangleAlertIcon className="text-error" />,
};

function MarkerIcon({ className, children, ...props }: React.ComponentProps<'span'>) {
  const { status } = React.useContext(MarkerContext);
  return (
    <span
      data-slot="marker-icon"
      aria-hidden="true"
      className={cn("flex size-4 shrink-0 items-center justify-center [&_svg:not([class*='size-'])]:size-4", className)}
      {...props}
    >
      {children ?? (status ? STATUS_ICON[status] : null)}
    </span>
  );
}

function MarkerContent({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="marker-content"
      className={cn(
        'min-w-0 wrap-break-word group-data-[variant=activity]/marker:flex-1 group-data-[variant=activity]/marker:truncate group-data-[variant=separator]/marker:flex-none group-data-[variant=separator]/marker:text-center',
        className,
      )}
      {...props}
    />
  );
}

const STATUS_LABEL: Record<MarkerStatusValue, string> = {
  working: 'Working',
  done: 'Done',
  error: 'Didn’t work',
};

/** the status in words at the end of an activity row; defaults to the marker's status */
function MarkerStatus({ className, children, ...props }: React.ComponentProps<'span'>) {
  const { status } = React.useContext(MarkerContext);
  return (
    <span
      data-slot="marker-status"
      data-status={status}
      className={cn(
        'ms-auto shrink-0 text-xs text-muted-foreground data-[status=error]:text-error data-[status=working]:animate-pulse',
        className,
      )}
      {...props}
    >
      {children ?? (status ? STATUS_LABEL[status] : null)}
    </span>
  );
}

export { Marker, MarkerContent, MarkerIcon, MarkerStatus, markerVariants };
