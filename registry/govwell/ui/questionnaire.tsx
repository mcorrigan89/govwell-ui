'use client';

import * as React from 'react';
import { Questionnaire as QuestionnairePrimitive } from '@shadcn/react/questionnaire';
import { CheckIcon } from 'lucide-react';

import { buttonVariants, type Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// A short run of questions, one at a time (@shadcn/react): single or multiple
// choice, a typed answer, skippable or required, with letter or number
// shortcuts. It is a real <form>: handle onSubmit and read the FormData. The
// assistant uses it to ask what it needs ("Which permit type?"). Choices are
// square cards with an Ash hairline that fill Slate-edged when picked, with a
// square checkbox or round radio dot in Slate; the typed answer is the h-12
// text box; Next and Submit are the Hope main action.

function Questionnaire({ className, ...props }: React.ComponentProps<typeof QuestionnairePrimitive.Root>) {
  return (
    <QuestionnairePrimitive.Root data-slot="questionnaire" className={cn('flex w-full min-w-0 flex-col gap-6', className)} {...props} />
  );
}

function QuestionnaireProgress({ className, ...props }: React.ComponentProps<typeof QuestionnairePrimitive.Progress>) {
  return (
    <QuestionnairePrimitive.Progress
      data-slot="questionnaire-progress"
      className={cn('eyebrow-type min-h-[1lh] w-fit min-w-[14ch] text-muted-foreground tabular-nums', className)}
      {...props}
    />
  );
}

function QuestionnaireItem({ className, ...props }: React.ComponentProps<typeof QuestionnairePrimitive.Item>) {
  return (
    <QuestionnairePrimitive.Item
      data-slot="questionnaire-item"
      className={cn('flex min-w-0 flex-col gap-5 border-0 p-0 outline-none', className)}
      {...props}
    />
  );
}

function QuestionnaireTitle({ className, ...props }: React.ComponentProps<typeof QuestionnairePrimitive.Title>) {
  return (
    <QuestionnairePrimitive.Title
      data-slot="questionnaire-title"
      className={cn(
        'text-xl font-normal tracking-tight text-pretty text-foreground [&:not(:has(~[data-slot=questionnaire-description]))]:mb-5',
        className,
      )}
      {...props}
    />
  );
}

function QuestionnaireDescription({ className, ...props }: React.ComponentProps<typeof QuestionnairePrimitive.Description>) {
  return (
    <QuestionnairePrimitive.Description
      data-slot="questionnaire-description"
      className={cn('text-sm font-light text-pretty text-muted-foreground', className)}
      {...props}
    />
  );
}

function QuestionnaireChoices({ className, ...props }: React.ComponentProps<typeof QuestionnairePrimitive.Choices>) {
  return (
    <QuestionnairePrimitive.Choices
      data-slot="questionnaire-choices"
      className={cn('group/questionnaire-choices grid min-w-0 gap-3', className)}
      {...props}
    />
  );
}

function QuestionnaireChoice({ children, className, ...props }: React.ComponentProps<typeof QuestionnairePrimitive.Choice>) {
  return (
    <QuestionnairePrimitive.Choice
      data-slot="questionnaire-choice"
      className={cn(
        'group/questionnaire-choice relative flex min-h-12 cursor-pointer items-start gap-3 rounded-none border border-border bg-card px-4 py-3.5 text-start text-base font-light transition-colors outline-none select-none hover:border-foreground hover:bg-accent has-[>input:focus-visible]:outline-2 has-[>input:focus-visible]:outline-offset-2 has-[>input:focus-visible]:outline-solid has-[>input:focus-visible]:outline-ring data-invalid:border-error data-checked:border-foreground data-checked:bg-accent',
        'data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-40',
        className,
      )}
      {...props}
    >
      <QuestionnairePrimitive.ChoiceInput
        data-slot="questionnaire-choice-input"
        className="absolute inset-0 z-10 size-full cursor-pointer opacity-0"
      />
      <span
        aria-hidden="true"
        data-slot="questionnaire-choice-indicator"
        className="pointer-events-none relative flex size-5 shrink-0 translate-y-[--spacing(0.25)] items-center justify-center rounded-none border border-input bg-background group-has-data-[slot=questionnaire-choice-description]/questionnaire-choice:translate-y-0.5 group-data-[type=radio]/questionnaire-choice:rounded-full group-data-checked/questionnaire-choice:border-secondary group-data-[type=checkbox]/questionnaire-choice:group-data-checked/questionnaire-choice:bg-secondary group-data-[type=checkbox]/questionnaire-choice:group-data-checked/questionnaire-choice:text-secondary-foreground"
      >
        <span
          data-slot="questionnaire-choice-indicator-dot"
          className="hidden size-2.5 rounded-full bg-secondary group-data-[type=checkbox]/questionnaire-choice:hidden group-data-checked/questionnaire-choice:block"
        />
        <CheckIcon
          strokeWidth={3}
          data-slot="questionnaire-choice-indicator-check"
          className="hidden size-3.5 group-data-[type=radio]/questionnaire-choice:hidden group-data-checked/questionnaire-choice:block"
        />
      </span>
      <QuestionnairePrimitive.ChoiceLabel
        data-slot="questionnaire-choice-label"
        className="flex min-w-0 flex-1 flex-col gap-1 leading-snug"
      >
        {children}
      </QuestionnairePrimitive.ChoiceLabel>
      <QuestionnairePrimitive.ChoiceShortcut
        data-slot="questionnaire-choice-shortcut"
        className="pointer-events-none ms-auto hidden h-6 min-w-6 shrink-0 items-center justify-center rounded-none border border-border bg-muted px-1.5 font-mono text-xs leading-none text-foreground group-has-data-[slot=questionnaire-choice-description]/questionnaire-choice:translate-y-0.5 group-data-[shortcut]/questionnaire-choice:inline-flex"
      />
    </QuestionnairePrimitive.Choice>
  );
}

function QuestionnaireChoiceDescription({ className, ...props }: React.ComponentProps<'span'>) {
  return <span data-slot="questionnaire-choice-description" className={cn('text-sm text-muted-foreground', className)} {...props} />;
}

function QuestionnaireInput({ className, ...props }: React.ComponentProps<typeof QuestionnairePrimitive.Input>) {
  return (
    <div data-slot="questionnaire-input-wrapper" className="group/questionnaire-input relative w-full min-w-0">
      <QuestionnairePrimitive.Input
        data-slot="questionnaire-input"
        className={cn(
          'h-12 w-full min-w-0 rounded-none border border-input bg-background px-4 text-base font-light text-foreground transition-colors outline-none hover:border-foreground focus-visible:border-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40 aria-invalid:border-error',
          'placeholder:text-muted-foreground',
          className,
        )}
        {...props}
      />
    </div>
  );
}

function QuestionnaireError({ className, ...props }: React.ComponentProps<typeof QuestionnairePrimitive.Error>) {
  return <QuestionnairePrimitive.Error data-slot="questionnaire-error" className={cn('text-sm text-error', className)} {...props} />;
}

function QuestionnaireActions({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="questionnaire-actions"
      className={cn('grid min-h-12 w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2', className)}
      {...props}
    />
  );
}

function QuestionnairePrevious({
  children,
  className,
  size = 'default',
  variant = 'outline',
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Previous> & Pick<React.ComponentProps<typeof Button>, 'size' | 'variant'>) {
  return (
    <QuestionnairePrimitive.Previous
      data-slot="questionnaire-previous"
      data-size={size}
      data-variant={variant}
      className={cn(buttonVariants({ size, variant }), 'col-start-1 row-start-1 justify-self-start', className)}
      {...props}
    >
      {children ?? 'Previous'}
    </QuestionnairePrimitive.Previous>
  );
}

function QuestionnaireSkip({
  children,
  className,
  size = 'default',
  variant = 'outline',
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Skip> & Pick<React.ComponentProps<typeof Button>, 'size' | 'variant'>) {
  return (
    <QuestionnairePrimitive.Skip
      data-slot="questionnaire-skip"
      data-size={size}
      data-variant={variant}
      className={cn(buttonVariants({ size, variant }), 'col-start-2 row-start-1 justify-self-end', className)}
      {...props}
    >
      {children ?? 'Skip'}
    </QuestionnairePrimitive.Skip>
  );
}

function QuestionnaireNext({
  children,
  className,
  size = 'default',
  variant = 'default',
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Next> & Pick<React.ComponentProps<typeof Button>, 'size' | 'variant'>) {
  return (
    <QuestionnairePrimitive.Next
      data-slot="questionnaire-next"
      data-size={size}
      data-variant={variant}
      className={cn(buttonVariants({ size, variant }), 'col-start-3 row-start-1 justify-self-end', className)}
      {...props}
    >
      {children ?? 'Next'}
    </QuestionnairePrimitive.Next>
  );
}

function QuestionnaireSubmit({
  children,
  className,
  size = 'default',
  variant = 'default',
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Submit> & Pick<React.ComponentProps<typeof Button>, 'size' | 'variant'>) {
  return (
    <QuestionnairePrimitive.Submit
      data-slot="questionnaire-submit"
      data-size={size}
      data-variant={variant}
      className={cn(buttonVariants({ size, variant }), 'col-start-3 row-start-1 justify-self-end', className)}
      {...props}
    >
      {children ?? 'Submit'}
    </QuestionnairePrimitive.Submit>
  );
}

export {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoiceDescription,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireError,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireSkip,
  QuestionnaireSubmit,
  QuestionnaireTitle,
};
