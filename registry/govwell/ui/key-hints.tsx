import * as React from 'react';

import { Kbd } from '@/components/ui/kbd';
import { cn } from '@/lib/utils';

// The legend of a screen's shortcuts, for a footer or a toolbar: each hint is
// its keys as square GovWell keycaps and what they do, in small muted Light
// type.
//
//   <KeyHints>
//     <KeyHint keys={['A']}>approve</KeyHint>
//     <KeyHint keys={['J', 'K']}>next / previous</KeyHint>
//     <KeyHint keys={['⌘', 'K']}>search</KeyHint>
//     <KeyHint keys={['1', '9']} range>open tab</KeyHint>
//   </KeyHints>
//
// It stays on one line, for a footer; add flex-wrap for a toolbar that may wrap.

function KeyHints({ className, 'aria-label': label = 'Keyboard shortcuts', ...props }: React.ComponentProps<'ul'>) {
  return (
    <ul
      data-slot="key-hints"
      aria-label={label}
      className={cn('flex items-center gap-x-4 gap-y-1 text-sm font-light text-muted-foreground', className)}
      {...props}
    />
  );
}

function KeyHint({
  keys,
  range,
  className,
  children,
  ...props
}: React.ComponentProps<'li'> & {
  keys: string[];
  /** the keys are the ends of a run (1 to 9), drawn with a dash between */
  range?: boolean;
}) {
  return (
    <li data-slot="key-hint" className={cn('flex shrink-0 items-center gap-1.5', className)} {...props}>
      <span className="flex items-center gap-0.5">
        {range ? (
          <>
            <Kbd>{keys[0]}</Kbd>
            <span aria-label="to">–</span>
            <Kbd>{keys.at(-1)}</Kbd>
          </>
        ) : (
          keys.map((k, i) => <Kbd key={i}>{k}</Kbd>)
        )}
      </span>
      {children}
    </li>
  );
}

export { KeyHint, KeyHints };
