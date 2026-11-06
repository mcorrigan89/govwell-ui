import * as React from 'react';
import { Check, X } from 'lucide-react';

import { cn } from '@/lib/utils';

// Where you are in a process — an application's stages, a wizard's pages —
// as square markers joined by hairlines. A finished step is a Slate square
// with a tick, the current step a Hope square with its number (Hope marks
// progress), a failed step a red square with a cross and a red title, and a
// step to come a Concrete-edged square with a muted number. Connectors are
// Ash, turning Slate behind a finished step. Horizontal or vertical; steps
// can be made clickable to jump back.
//
//   <Steps currentStep={1} items={[{ title: 'Apply' }, { title: 'Review' }, { title: 'Issue' }]} />

type StepStatus = 'wait' | 'process' | 'finish' | 'error';

type StepItem = {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** overrides the status worked out from `currentStep` */
  status?: StepStatus;
  /** can't be clicked even when the steps are clickable */
  disabled?: boolean;
};

/** before the current step finish, the current step is in process, after it wait; an item's own status wins */
function resolveStepStatus(index: number, currentStep: number, own?: StepStatus): StepStatus {
  if (own) return own;
  if (index < currentStep) return 'finish';
  if (index === currentStep) return 'process';
  return 'wait';
}

const MARKER: Record<StepStatus, string> = {
  finish: 'bg-secondary text-secondary-foreground',
  process: 'bg-primary text-primary-foreground',
  error: 'bg-destructive text-destructive-foreground',
  wait: 'border border-input bg-background text-muted-foreground',
};

const SPOKEN: Record<StepStatus, string> = {
  finish: 'completed',
  process: 'current',
  error: 'error',
  wait: 'not started',
};

type StepsProps = Omit<React.ComponentProps<'ol'>, 'onChange'> & {
  items: StepItem[];
  /** the step in process, from 0 */
  currentStep?: number;
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md';
  /** make steps clickable; called with the step's index */
  onStepClick?: (index: number) => void;
};

function Steps({
  items,
  currentStep = 0,
  orientation = 'horizontal',
  size = 'md',
  onStepClick,
  className,
  'aria-label': ariaLabel = 'Steps',
  ...props
}: StepsProps) {
  const horizontal = orientation === 'horizontal';
  return (
    <ol
      data-slot="steps"
      data-orientation={orientation}
      aria-label={ariaLabel}
      className={cn('m-0 flex list-none p-0', horizontal ? 'w-full flex-row items-start' : 'w-max max-w-full flex-col', className)}
      {...props}
    >
      {items.map((item, index) => {
        const status = resolveStepStatus(index, currentStep, item.status);
        const last = index === items.length - 1;
        const connector = (
          <span
            aria-hidden
            data-slot="steps-connector"
            data-complete={status === 'finish' || undefined}
            className={cn(
              status === 'finish' ? 'bg-secondary' : 'bg-border',
              horizontal ? 'mx-3 h-px min-w-6 flex-1' : 'min-h-6 w-px flex-1',
              horizontal && (size === 'sm' ? 'mt-3' : 'mt-4'),
            )}
          />
        );
        const marker = (
          <span
            aria-hidden
            data-slot="steps-marker"
            data-status={status}
            className={cn(
              'inline-flex shrink-0 items-center justify-center font-normal tabular-nums',
              size === 'sm' ? 'size-6 text-xs [&_svg]:size-3' : 'size-8 text-sm [&_svg]:size-4',
              MARKER[status],
            )}
          >
            {status === 'finish' ? <Check /> : status === 'error' ? <X /> : index + 1}
          </span>
        );
        const label = (
          <span className={cn('flex min-w-0 flex-col', size === 'sm' ? 'pt-0.5' : 'pt-1')}>
            <span
              data-slot="steps-title"
              className={cn(
                'leading-6',
                size === 'sm' ? 'text-sm' : 'text-base',
                status === 'error' ? 'text-error' : status === 'wait' ? 'text-muted-foreground' : 'text-foreground',
                status === 'process' && 'font-normal',
                // wraps rather than spilling into the next step when the row is narrow
                horizontal && 'text-pretty',
              )}
            >
              {item.title}
              <span className="sr-only"> ({SPOKEN[status]})</span>
            </span>
            {item.description && (
              <span data-slot="steps-description" className="mt-0.5 text-sm text-muted-foreground">
                {item.description}
              </span>
            )}
          </span>
        );
        const clickable = !!onStepClick;
        const body = clickable ? (
          <button
            type="button"
            disabled={item.disabled}
            aria-current={status === 'process' ? 'step' : undefined}
            onClick={() => onStepClick(index)}
            className="group/step flex min-w-0 cursor-pointer items-start gap-3 text-left outline-none hover:[&_[data-slot=steps-title]]:underline hover:[&_[data-slot=steps-title]]:decoration-1 hover:[&_[data-slot=steps-title]]:underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-40"
          >
            {marker}
            {label}
          </button>
        ) : (
          <span className="flex min-w-0 items-start gap-3">
            {marker}
            {label}
          </span>
        );

        if (!horizontal) {
          return (
            <li
              key={index}
              data-slot="steps-item"
              data-status={status}
              aria-current={!clickable && status === 'process' ? 'step' : undefined}
              className="relative flex flex-col"
            >
              {body}
              {!last && (
                // the connector runs down from the marker's centre to the next marker
                // (a column, so the connector's flex-1 grows its height, not its width)
                <span className={cn('flex min-h-6 flex-col py-1', size === 'sm' ? 'ml-3' : 'ml-4')}>{connector}</span>
              )}
            </li>
          );
        }
        return (
          <li
            key={index}
            data-slot="steps-item"
            data-status={status}
            aria-current={!clickable && status === 'process' ? 'step' : undefined}
            className={cn('flex min-w-0 items-start', last ? 'shrink-0' : 'flex-1')}
          >
            {body}
            {!last && connector}
          </li>
        );
      })}
    </ol>
  );
}

export { Steps, resolveStepStatus, type StepItem, type StepStatus };
