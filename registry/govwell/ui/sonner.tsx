import { Toaster as Sonner, type ToasterProps } from 'sonner';
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from 'lucide-react';

// Toasts laid out like the alert: a square popover panel with an Ash hairline
// that follows the colour mode (white on light, raised Slate on dark), a status
// rail down the left edge and the icon on a square tile of the same colour
// (Field for success, amber for warning, red for errors, Sky for info; Hope
// for a plain message), then a Regular title and the details in Light. The
// rail keys off sonner's data-type attribute: sonner adds the `default` class
// to EVERY toast, so per-type border classes would fight it. Sonner runs
// unstyled, so nothing of its own theme leaks in.

const Toaster = (props: ToasterProps) => (
  <Sonner
    position="bottom-right"
    gap={10}
    icons={{
      success: <CircleCheckIcon className="size-4" />,
      info: <InfoIcon className="size-4" />,
      warning: <TriangleAlertIcon className="size-4" />,
      error: <OctagonXIcon className="size-4" />,
      loading: <Loader2Icon className="size-4 animate-spin" />,
    }}
    toastOptions={{
      unstyled: true,
      classNames: {
        toast:
          'group flex w-(--width) items-start gap-3 rounded-none border border-border border-l-4! border-l-primary! bg-popover px-4 py-3.5 text-sm leading-snug font-light text-popover-foreground shadow-lg data-[type=error]:border-l-destructive! data-[type=info]:border-l-info! data-[type=loading]:border-l-muted-foreground! data-[type=success]:border-l-ok! data-[type=warning]:border-l-warning!',
        title: 'text-base leading-tight font-normal tracking-tight text-foreground',
        description: 'mt-1 text-sm font-light text-foreground',
        icon: 'm-0! flex! size-7! shrink-0 items-center! justify-center! bg-primary text-primary-foreground',
        content: 'flex min-w-0 flex-1 flex-col',
        success: '[&_[data-icon]]:bg-ok [&_[data-icon]]:text-ok-foreground',
        error: '[&_[data-icon]]:bg-destructive [&_[data-icon]]:text-destructive-foreground',
        warning: '[&_[data-icon]]:bg-warning [&_[data-icon]]:text-warning-foreground',
        info: '[&_[data-icon]]:bg-info [&_[data-icon]]:text-info-foreground',
        loading: '[&_[data-icon]]:bg-transparent [&_[data-icon]]:text-muted-foreground',
        actionButton:
          'ml-auto h-8 shrink-0 bg-primary px-3 text-sm font-light text-primary-foreground outline-none hover:bg-[color-mix(in_srgb,var(--primary)_88%,var(--slate))] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring',
        cancelButton:
          'ml-auto h-8 shrink-0 border border-foreground px-3 text-sm font-light text-foreground outline-none hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring',
        closeButton:
          'absolute top-1.5 right-1.5 border-0 bg-transparent text-muted-foreground outline-none hover:text-foreground focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-ring',
      },
    }}
    {...props}
  />
);

export { Toaster };
