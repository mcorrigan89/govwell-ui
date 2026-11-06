'use client';

import * as React from 'react';
import { Check, Copy, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Copies a value — a record number, an invite code, an API token — on a
// GovWell Button (outline by default). For a moment after, the icon turns
// into a tick and the label reads "Copied"; if the browser refuses, a cross
// and "Couldn't copy". Either way a polite live region says so, since the
// change on the button alone isn't announced. Without `children` it's
// icon-only, named by `label`.
//
//   <CopyButton value="BLD-2026-01482" label="Copy permit number" />
//   <CopyButton value={inviteCode}>Copy code</CopyButton>

type CopyState = 'idle' | 'copied' | 'error';

/** the Clipboard API, falling back to a hidden textarea and execCommand on insecure origins */
async function writeClipboard(text: string) {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  try {
    if (!document.execCommand?.('copy')) throw new Error('Copy was refused');
  } finally {
    area.remove();
  }
}

type CopyButtonProps = Omit<React.ComponentProps<typeof Button>, 'value' | 'onError'> & {
  /** the text to copy, or a function that returns it (it may be async) */
  value: string | (() => string | Promise<string>);
  /** the accessible name when icon-only (default "Copy") */
  label?: string;
  /** shown and announced after a copy (default "Copied") */
  copiedLabel?: string;
  /** shown and announced when the copy fails (default "Couldn't copy") */
  errorLabel?: string;
  /** how long the confirmation stays, in ms (default 2000) */
  timeout?: number;
  onCopy?: (text: string) => void;
  onError?: (error: unknown) => void;
};

function CopyButton({
  value,
  label = 'Copy',
  copiedLabel = 'Copied',
  errorLabel = "Couldn't copy",
  timeout = 2000,
  onCopy,
  onError,
  onClick,
  children,
  variant = 'outline',
  size,
  className,
  ...props
}: CopyButtonProps) {
  const [state, setState] = React.useState<CopyState>('idle');
  const timer = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  React.useEffect(() => () => clearTimeout(timer.current), []);

  const iconOnly = children == null;
  const settle = (next: CopyState) => {
    setState(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState('idle'), timeout);
  };

  const copy = async () => {
    try {
      const text = typeof value === 'function' ? await value() : value;
      await writeClipboard(text);
      settle('copied');
      onCopy?.(text);
    } catch (error) {
      settle('error');
      onError?.(error);
    }
  };

  const Icon = state === 'copied' ? Check : state === 'error' ? X : Copy;
  const message = state === 'copied' ? copiedLabel : state === 'error' ? errorLabel : '';

  return (
    <>
      <Button
        data-slot="copy-button"
        data-state={state}
        type="button"
        variant={variant}
        size={size ?? (iconOnly ? 'icon' : 'default')}
        aria-label={iconOnly ? label : undefined}
        className={cn(state === 'error' && 'text-error', className)}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) void copy();
        }}
        {...props}
      >
        <Icon aria-hidden data-icon={iconOnly ? undefined : 'inline-start'} />
        {!iconOnly && (
          // both labels share one grid cell, so the button keeps its width as the label swaps
          <span className="grid">
            <span aria-hidden={state !== 'idle'} className={cn('col-start-1 row-start-1', state !== 'idle' && 'invisible')}>
              {children}
            </span>
            <span aria-hidden={state === 'idle'} className={cn('col-start-1 row-start-1', state === 'idle' && 'invisible')}>
              {state === 'error' ? errorLabel : copiedLabel}
            </span>
          </span>
        )}
      </Button>
      <span role="status" aria-live="polite" className="sr-only">
        {message}
      </span>
    </>
  );
}

export { CopyButton };
