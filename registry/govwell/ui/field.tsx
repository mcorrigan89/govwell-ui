'use client';

import { useMemo } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

// Labels, controls, help text and errors composed into accessible form fields.
// Works with any form library: set data-invalid on <Field> and aria-invalid on
// the control, and hand the library's errors to <FieldError errors={...} />.

function FieldSet({ className, ...props }: React.ComponentProps<'fieldset'>) {
  return <fieldset data-slot="field-set" className={cn('flex flex-col gap-6', className)} {...props} />;
}

function FieldLegend({ className, variant = 'legend', ...props }: React.ComponentProps<'legend'> & { variant?: 'legend' | 'label' }) {
  return (
    <legend
      data-slot="field-legend"
      data-variant={variant}
      className={cn(
        'mb-3 font-normal data-[variant=label]:text-sm data-[variant=legend]:text-2xl data-[variant=legend]:tracking-tight',
        className,
      )}
      {...props}
    />
  );
}

function FieldGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="field-group"
      className={cn('group/field-group @container/field-group flex w-full flex-col gap-6 *:data-[slot=field-group]:gap-4', className)}
      {...props}
    />
  );
}

const fieldVariants = cva('group/field flex w-full gap-2', {
  variants: {
    orientation: {
      vertical: 'flex-col *:w-full [&>.sr-only]:w-auto',
      horizontal: 'flex-row items-center gap-3 has-[>[data-slot=field-content]]:items-start *:data-[slot=field-label]:flex-auto',
      responsive:
        'flex-col *:w-full @md/field-group:flex-row @md/field-group:items-center @md/field-group:gap-3 @md/field-group:*:w-auto @md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:*:data-[slot=field-label]:flex-auto [&>.sr-only]:w-auto',
    },
  },
  defaultVariants: { orientation: 'vertical' },
});

function Field({ className, orientation = 'vertical', ...props }: React.ComponentProps<'div'> & VariantProps<typeof fieldVariants>) {
  return (
    <div
      role="group"
      data-slot="field"
      data-orientation={orientation}
      className={cn(fieldVariants({ orientation }), className)}
      {...props}
    />
  );
}

function FieldContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div data-slot="field-content" className={cn('group/field-content flex flex-1 flex-col gap-1 leading-snug', className)} {...props} />
  );
}

function FieldLabel({ className, ...props }: React.ComponentProps<typeof Label>) {
  return (
    <Label
      data-slot="field-label"
      className={cn(
        'group/field-label peer/field-label flex w-fit gap-2 leading-snug group-data-[disabled=true]/field:opacity-40',
        className,
      )}
      {...props}
    />
  );
}

function FieldTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="field-label"
      className={cn('flex w-fit items-center gap-2 text-sm font-normal group-data-[disabled=true]/field:opacity-40', className)}
      {...props}
    />
  );
}

function FieldDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="field-description"
      className={cn(
        'text-left text-sm leading-normal font-normal text-muted-foreground [[data-variant=legend]+&]:-mt-1.5',
        '[&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-foreground',
        className,
      )}
      {...props}
    />
  );
}

/** An error as form libraries report it: a message string, or an issue object with one. */
type FieldErrorItem = string | { message?: string } | null | undefined;

function FieldError({
  className,
  children,
  errors,
  ...props
}: React.ComponentProps<'div'> & {
  errors?: FieldErrorItem[];
}) {
  const content = useMemo(() => {
    if (children) return children;

    const messages = [...new Set((errors ?? []).map((e) => (typeof e === 'string' ? e : e?.message)).filter((m): m is string => !!m))];
    if (messages.length === 0) return null;
    if (messages.length === 1) return messages[0];
    return (
      <ul className="ml-4 flex list-disc flex-col gap-1">
        {messages.map((m) => (
          <li key={m}>{m}</li>
        ))}
      </ul>
    );
  }, [children, errors]);

  if (!content) return null;

  return (
    <div role="alert" data-slot="field-error" className={cn('text-sm font-normal text-error', className)} {...props}>
      {content}
    </div>
  );
}

export { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet, FieldTitle };
export type { FieldErrorItem };
