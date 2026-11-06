'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { ChevronDown, X } from 'lucide-react';

import { cn } from '@/lib/utils';

// A full-width strip across the top of a page or a record, like
// govwell.com's announcement bar: a solid Hope band with Slate type by
// default, or a status colour, square, edge to edge. It says one thing
// (Regular), a little more if needed (Light), and offers the one action that
// deals with it — what's in the way and how to clear it. Details can fold
// away behind a chevron; a dismissible banner remembers being dismissed
// (by key in localStorage, or through your own callback).
//
//   <Banner tone="warning" title="Not ready to approve" items={blockers} action={<Button size="sm">Review</Button>} />

const bannerVariants = cva('relative w-full border-b text-sm font-light', {
  variants: {
    tone: {
      hope: 'border-transparent bg-primary text-primary-foreground',
      slate: 'border-transparent bg-secondary text-secondary-foreground',
      neutral: 'border-border bg-muted text-foreground',
      info: 'border-transparent bg-info text-info-foreground',
      ok: 'border-transparent bg-ok text-ok-foreground',
      warning: 'border-transparent bg-warning text-warning-foreground',
      destructive: 'border-transparent bg-destructive text-destructive-foreground',
    },
  },
  defaultVariants: { tone: 'hope' },
});

// the controls on the band take its text colour, and so does their focus ring,
// which would vanish in the ring colour on Hope
const bandButton =
  'inline-flex size-8 shrink-0 items-center justify-center rounded-none text-current transition-colors outline-none hover:bg-current/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-current [&_svg]:size-4';

const STORAGE_PREFIX = 'govwell-banner:';

function readDismissed(key: string | undefined) {
  if (!key) return false;
  try {
    return window.localStorage.getItem(STORAGE_PREFIX + key) === '1';
  } catch {
    return false;
  }
}

type BannerProps = Omit<React.ComponentProps<'div'>, 'title'> &
  VariantProps<typeof bannerVariants> & {
    /** the one thing it says */
    title: React.ReactNode;
    /** a lucide icon or similar, before the title */
    icon?: React.ReactNode;
    /** more about it; folds away when `collapsible` */
    description?: React.ReactNode;
    /** a short list — what's blocking, what's missing */
    items?: React.ReactNode[];
    /** the button that deals with it */
    action?: React.ReactNode;
    /** fold the description and items behind a chevron (closed at first unless `defaultExpanded`) */
    collapsible?: boolean;
    defaultExpanded?: boolean;
    /** show a close button */
    dismissible?: boolean;
    /** remember the dismissal in localStorage under this key, so it stays gone */
    dismissKey?: string;
    /** called when dismissed (store it yourself, or close something) */
    onDismiss?: () => void;
    /** controlled: hide it yourself */
    dismissed?: boolean;
    /** keep the content to a centred column, as on govwell.com (default true) */
    contained?: boolean;
  };

function Banner({
  tone,
  title,
  icon,
  description,
  items,
  action,
  collapsible = false,
  defaultExpanded = false,
  dismissible = false,
  dismissKey,
  onDismiss,
  dismissed: dismissedProp,
  contained = true,
  className,
  children,
  ...props
}: BannerProps) {
  const [ownDismissed, setOwnDismissed] = React.useState(() => readDismissed(dismissKey));
  const [expanded, setExpanded] = React.useState(defaultExpanded);
  const titleId = React.useId();
  const detailsId = React.useId();
  const dismissed = dismissedProp ?? ownDismissed;
  if (dismissed) return null;

  const hasDetails = !!description || (items?.length ?? 0) > 0 || !!children;
  const showDetails = hasDetails && (!collapsible || expanded);

  const dismiss = () => {
    if (dismissKey) {
      try {
        window.localStorage.setItem(STORAGE_PREFIX + dismissKey, '1');
      } catch {
        // storage blocked: it's dismissed for this visit only
      }
    }
    setOwnDismissed(true);
    onDismiss?.();
  };

  return (
    <div
      data-slot="banner"
      data-tone={tone ?? 'hope'}
      role="region"
      aria-labelledby={titleId}
      className={cn(bannerVariants({ tone }), className)}
      {...props}
    >
      <div className={cn('flex items-start gap-3 px-4 py-3 sm:px-6', contained && 'mx-auto max-w-7xl')}>
        {icon && <span className="mt-1.5 flex shrink-0 [&_svg]:size-5">{icon}</span>}
        <div className="flex min-w-0 flex-1 flex-col gap-1 py-1.5">
          <p id={titleId} className="text-base leading-tight font-normal">
            {title}
          </p>
          {showDetails && (
            <div id={detailsId} data-slot="banner-details" className="flex flex-col gap-1.5">
              {description && <div>{description}</div>}
              {items && items.length > 0 && (
                <ul className="list-disc space-y-0.5 pl-5">
                  {items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              )}
              {children}
            </div>
          )}
        </div>
        {action && <div className="flex shrink-0 items-center gap-2 self-center">{action}</div>}
        {collapsible && hasDetails && (
          <button
            type="button"
            className={bandButton}
            aria-expanded={expanded}
            aria-controls={expanded ? detailsId : undefined}
            aria-label={expanded ? 'Hide details' : 'Show details'}
            onClick={() => setExpanded((e) => !e)}
          >
            <ChevronDown className={cn('transition-transform duration-150', expanded && 'rotate-180')} />
          </button>
        )}
        {dismissible && (
          <button type="button" className={bandButton} aria-label="Dismiss" onClick={dismiss}>
            <X />
          </button>
        )}
      </div>
    </div>
  );
}

export { Banner, bannerVariants };
