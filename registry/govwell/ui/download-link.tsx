'use client';

import * as React from 'react';
import { FileDown, RotateCw, TriangleAlert } from 'lucide-react';

import { Button, buttonVariants } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

// A file that may still be being made — the issued permit PDF, a marked-up
// review set, an export. While it's built it reads "Preparing…" in muted
// type beside the spinner; once ready it's a link with the file's name and
// size (or, as `variant="button"`, the main Hope action); if building
// failed, the reason in error red with a Retry. The state comes in by
// props — this does no fetching — and changes are announced politely.
//
//   <DownloadLink state={pdf ? 'ready' : 'preparing'} href={pdf?.url} filename="BLD-2026-01482.pdf" size={pdf?.bytes} />

type DownloadState = 'preparing' | 'ready' | 'error';

/** 2_412_000 → "2.4 MB" */
function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let n = bytes / 1024;
  let u = 0;
  while (n >= 1024 && u < units.length - 1) {
    n /= 1024;
    u++;
  }
  return `${n >= 10 ? Math.round(n) : n.toFixed(1)} ${units[u]}`;
}

type DownloadLinkProps = Omit<React.ComponentProps<'span'>, 'children'> & {
  state: DownloadState;
  href?: string;
  /** the file's name, offered as the saved name and shown when there's no label */
  filename?: string;
  /** bytes, or a ready-made string ("PDF, 12 pages") */
  size?: number | string;
  /** the link text (default: the file name, else "Download") */
  label?: React.ReactNode;
  /** while preparing (default "Preparing {filename}…") */
  preparingLabel?: React.ReactNode;
  /** when it failed (default "Couldn't prepare {filename}.") */
  errorLabel?: React.ReactNode;
  onRetry?: () => void;
  /** `link` (default): an underlined text link; `button`: the main action */
  variant?: 'link' | 'button';
  /** passed to the anchor */
  target?: string;
};

function DownloadLink({
  state,
  href,
  filename,
  size,
  label,
  preparingLabel,
  errorLabel,
  onRetry,
  variant = 'link',
  target,
  className,
  ...props
}: DownloadLinkProps) {
  const what = filename ?? 'the file';
  const sizeText = typeof size === 'number' ? formatBytes(size) : size;

  let body: React.ReactNode;
  if (state === 'preparing') {
    body =
      variant === 'button' ? (
        <Button disabled>
          <Spinner aria-hidden role="presentation" data-icon="inline-start" />
          {preparingLabel ?? 'Preparing…'}
        </Button>
      ) : (
        <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner aria-hidden role="presentation" />
          {preparingLabel ?? `Preparing ${what}…`}
        </span>
      );
  } else if (state === 'error') {
    body = (
      <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span className="inline-flex items-center gap-2 text-error">
          <TriangleAlert aria-hidden className="size-4 shrink-0" />
          {errorLabel ?? `Couldn't prepare ${what}.`}
        </span>
        {onRetry && (
          <Button variant="link" size="xs" onClick={onRetry}>
            <RotateCw data-icon="inline-start" /> Retry
          </Button>
        )}
      </span>
    );
  } else {
    const text = label ?? filename ?? 'Download';
    body =
      variant === 'button' ? (
        <a href={href} download={filename ?? true} target={target} className={buttonVariants()}>
          <FileDown data-icon="inline-start" />
          {text}
          {sizeText && <span className="text-sm opacity-80">{sizeText}</span>}
        </a>
      ) : (
        <a
          href={href}
          download={filename ?? true}
          target={target}
          className="group/download inline-flex items-center gap-2 text-base outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring"
        >
          <FileDown aria-hidden className="size-4 shrink-0" />
          <span className="underline decoration-1 underline-offset-4 group-hover/download:decoration-2">{text}</span>{' '}
          {sizeText && <span className="text-sm text-muted-foreground">({sizeText})</span>}
        </a>
      );
  }

  return (
    <span data-slot="download-link" data-state={state} aria-live="polite" className={cn('inline-flex', className)} {...props}>
      {body}
    </span>
  );
}

export { DownloadLink, formatBytes, type DownloadState };
