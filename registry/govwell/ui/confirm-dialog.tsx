'use client';

import * as React from 'react';
import { TriangleAlert } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

// "Are you sure?" in one call, on the alert dialog's square panel over a
// Slate wash. It stays open until a choice is made (no outside-click
// dismissal), Escape cancels, and the safe choice — Cancel — has focus. A
// destructive confirm puts the warning on a red tile and makes the action
// red. While the action runs, the button shows the spinner and nothing can
// close the dialog; if it fails, the reason shows in red and it stays open.
//
// Declaratively:
//   <ConfirmDialog trigger={<Button variant="outline">Void permit</Button>} title="Void this permit?"
//     destructive confirmLabel="Void permit" onConfirm={() => voidPermit(id)} />
// Or imperatively, with one <ConfirmDialogHost /> in the app shell:
//   if (await confirm({ title: 'Discard changes?', destructive: true })) discard();

type ConfirmOptions = {
  title: React.ReactNode;
  /** a sentence or two about what happens */
  description?: React.ReactNode;
  /** what will change, as a short list (what a delete takes with it) */
  details?: React.ReactNode[];
  /** the button that goes ahead, as a verb: "Delete", "Issue permit" */
  confirmLabel?: React.ReactNode;
  cancelLabel?: React.ReactNode;
  /** it can't be undone: a red tile and a red action */
  destructive?: boolean;
};

type ConfirmDialogProps = ConfirmOptions & {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** the element that opens it */
  trigger?: React.ReactElement;
  /** the action; return a promise to keep the dialog open (and pending) until it settles */
  onConfirm: () => unknown;
  /** Cancel, Escape */
  onCancel?: () => void;
  /** force the pending state (e.g. from a mutation's isPending) */
  pending?: boolean;
  /** extra content under the description */
  children?: React.ReactNode;
  className?: string;
};

function errorText(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error) return error;
  return 'Something went wrong. Try again.';
}

function ConfirmDialog({
  title,
  description,
  details,
  confirmLabel = 'Continue',
  cancelLabel = 'Cancel',
  destructive = false,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  trigger,
  onConfirm,
  onCancel,
  pending: pendingProp,
  children,
  className,
}: ConfirmDialogProps) {
  const [ownOpen, setOwnOpen] = React.useState(defaultOpen);
  const [running, setRunning] = React.useState(false);
  const [error, setError] = React.useState<unknown>(null);
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  const open = openProp ?? ownOpen;
  const pending = pendingProp ?? running;

  const setOpen = (next: boolean) => {
    if (next) setError(null);
    setOwnOpen(next);
    onOpenChange?.(next);
  };

  const confirm = async () => {
    setError(null);
    let result: unknown;
    try {
      result = onConfirm();
    } catch (e) {
      setError(e);
      return;
    }
    if (result && typeof (result as PromiseLike<unknown>).then === 'function') {
      setRunning(true);
      try {
        await result;
      } catch (e) {
        setError(e);
        return;
      } finally {
        setRunning(false);
      }
    }
    setOpen(false);
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        // nothing closes it while the action runs
        if (!next && pending) return;
        if (!next) onCancel?.();
        setOpen(next);
      }}
    >
      {trigger && <AlertDialogTrigger render={trigger} />}
      <AlertDialogContent data-slot="confirm-dialog" initialFocus={cancelRef} className={className}>
        <AlertDialogHeader>
          {destructive && (
            <AlertDialogMedia>
              <TriangleAlert />
            </AlertDialogMedia>
          )}
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {(description || details?.length || children) && (
            <AlertDialogDescription render={<div />} className="grid gap-3">
              {description && <p>{description}</p>}
              {details && details.length > 0 && (
                <ul data-slot="confirm-dialog-details" className="max-h-48 list-disc space-y-1 overflow-y-auto pl-5 text-sm">
                  {details.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              )}
              {children}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        {error != null && (
          <p role="alert" className="text-sm text-error">
            {errorText(error)}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel ref={cancelRef} disabled={pending}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            variant={destructive ? 'destructive' : 'default'}
            aria-busy={pending || undefined}
            disabled={pending}
            className={cn(pending && 'disabled:opacity-100')}
            onClick={() => void confirm()}
          >
            {pending && <Spinner data-icon="inline-start" aria-hidden role="presentation" aria-label={undefined} />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ── one-call confirm ─────────────────────────────────────────────────────

type PendingAsk = ConfirmOptions & { resolve: (ok: boolean) => void };

let pendingAsk: PendingAsk | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((fn) => fn());

/** Ask, and wait for the answer: true to go ahead. Needs a <ConfirmDialogHost /> mounted. */
function confirm(options: ConfirmOptions): Promise<boolean> {
  // a second ask while one is open answers the first with "no"
  pendingAsk?.resolve(false);
  return new Promise((resolve) => {
    pendingAsk = { ...options, resolve };
    notify();
  });
}

function answer(ok: boolean) {
  const current = pendingAsk;
  pendingAsk = null;
  notify();
  current?.resolve(ok);
}

/** Renders the dialog that `confirm()` opens; one per app shell. */
function ConfirmDialogHost() {
  const ask = React.useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    () => pendingAsk,
    () => null,
  );
  // keep the last question on screen while the dialog animates out
  const [shown, setShown] = React.useState<PendingAsk | null>(ask);
  if (ask && ask !== shown) setShown(ask);
  if (!shown) return null;
  const { resolve: _resolve, ...options } = shown;
  return (
    <ConfirmDialog
      {...options}
      open={ask !== null}
      onOpenChange={(open) => {
        if (!open && pendingAsk) answer(false);
      }}
      onConfirm={() => answer(true)}
    />
  );
}

export { ConfirmDialog, ConfirmDialogHost, confirm, type ConfirmOptions };
