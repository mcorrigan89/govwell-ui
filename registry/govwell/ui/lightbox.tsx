'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, Minus, Plus } from 'lucide-react';

import { Button, buttonVariants } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

// An image seen large, in the GovWell dialog: a page of a submitted plan, a
// site photo, a scanned form. It opens fitted to the window; "100%" shows it
// at its own size and − / + step the zoom, with the page scrolling inside a
// white well. Regions — where a value was read, what a comment is about —
// are given as fractions of the page and drawn as a Hope outline over a Hope
// tint, and scrolled into view when the page loads or the zoom changes. A
// caption ("plot-plan.pdf · p. 1") titles it, and with more than one image
// Previous / Next (or the arrow keys) step through the set.
//
//   <Lightbox images={[{ src, alt: 'Plot plan, page 1', caption: 'plot-plan.pdf · p. 1',
//     regions: [{ x: 0.62, y: 0.4, width: 0.2, height: 0.06, label: 'Lot area' }] }]}
//     trigger={<Button variant="outline">View page</Button>} />

type LightboxRegion = {
  /** left and top edges, as fractions of the image (0–1) */
  x: number;
  y: number;
  /** size as fractions; leave out for a point, drawn as a small square */
  width?: number;
  height?: number;
  /** what the region marks, for screen readers and its hover title */
  label?: string;
};

type LightboxImage = {
  src: string;
  alt: string;
  /** the title: "plot-plan.pdf · p. 1" (defaults to the alt text) */
  caption?: React.ReactNode;
  /** a line under it: the quote that was read there */
  description?: React.ReactNode;
  regions?: LightboxRegion[];
  /** the original file, opened in a new tab */
  href?: string;
  hrefLabel?: string;
};

type Zoom = 'fit' | number;
// a pressed zoom preset is a Slate fill, like any other "on" state
const PRESSED = 'aria-pressed:bg-secondary aria-pressed:text-secondary-foreground aria-pressed:hover:bg-secondary';
const STEPS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4];

type LightboxProps = {
  images: LightboxImage[];
  index?: number;
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** the element that opens it, rendered as a DialogTrigger */
  trigger?: React.ReactElement;
  className?: string;
};

function Lightbox({
  images,
  index: indexProp,
  defaultIndex = 0,
  onIndexChange,
  open,
  defaultOpen,
  onOpenChange,
  trigger,
  className,
}: LightboxProps) {
  const [innerIndex, setInnerIndex] = React.useState(defaultIndex);
  const index = Math.min(Math.max(indexProp ?? innerIndex, 0), Math.max(images.length - 1, 0));
  const go = (next: number) => {
    if (next < 0 || next >= images.length) return;
    if (indexProp === undefined) setInnerIndex(next);
    onIndexChange?.(next);
  };
  const image = images[index];

  return (
    <Dialog open={open} defaultOpen={defaultOpen} onOpenChange={(o) => onOpenChange?.(o)}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent data-slot="lightbox" className={cn('gap-4 sm:max-w-5xl', className)}>
        {image && (
          <LightboxPage
            key={`${index}:${image.src}`}
            image={image}
            index={index}
            count={images.length}
            onPrevious={() => go(index - 1)}
            onNext={() => go(index + 1)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function LightboxPage({
  image,
  index,
  count,
  onPrevious,
  onNext,
}: {
  image: LightboxImage;
  index: number;
  count: number;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const [zoom, setZoom] = React.useState<Zoom>('fit');
  const [loaded, setLoaded] = React.useState(false);
  const [natural, setNatural] = React.useState<{ w: number; h: number } | null>(null);
  const well = React.useRef<HTMLDivElement>(null);
  const img = React.useRef<HTMLImageElement>(null);
  const regions = image.regions ?? [];
  const firstRegion = image.regions?.[0];

  // the scale the fitted image is shown at, so − and + step from there
  const currentScale = () => {
    if (zoom !== 'fit') return zoom;
    const el = img.current;
    return el && natural?.w ? el.clientWidth / natural.w : 1;
  };
  const zoomOut = () => {
    const s = currentScale();
    setZoom([...STEPS].reverse().find((step) => step < s - 0.01) ?? STEPS[0]!);
  };
  const zoomIn = () => {
    const s = currentScale();
    setZoom(STEPS.find((step) => step > s + 0.01) ?? STEPS[STEPS.length - 1]!);
  };

  // bring the first region into view once the page is drawn, and on zoom
  React.useEffect(() => {
    const box = well.current;
    const el = img.current;
    const first = firstRegion;
    if (!loaded || !box || !el || !first) return;
    const cx = first.x + (first.width ?? 0) / 2;
    const cy = first.y + (first.height ?? 0) / 2;
    box.scrollLeft = cx * el.clientWidth - box.clientWidth / 2;
    box.scrollTop = cy * el.clientHeight - box.clientHeight / 2;
  }, [loaded, zoom, firstRegion]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.target !== event.currentTarget && (event.target as HTMLElement).closest('input, textarea')) return;
    if (event.key === 'ArrowLeft' && count > 1 && event.target !== well.current) onPrevious();
    else if (event.key === 'ArrowRight' && count > 1 && event.target !== well.current) onNext();
    else if (event.key === '+' || event.key === '=') zoomIn();
    else if (event.key === '-') zoomOut();
    else if (event.key === '0') setZoom('fit');
    else return;
    event.preventDefault();
  };

  const percent = zoom === 'fit' ? 'Fit' : `${Math.round(zoom * 100)}%`;

  return (
    // the keys work anywhere in the dialog; a plain wrapper keeps them local
    // oxlint-disable-next-line jsx-a11y/no-static-element-interactions
    <div className="contents" onKeyDown={onKeyDown}>
      <DialogHeader>
        <DialogTitle className="text-xl">{image.caption ?? image.alt}</DialogTitle>
        {(image.description || count > 1) && (
          <DialogDescription>
            {image.description}
            {image.description && count > 1 ? ' · ' : ''}
            {count > 1 && (
              <span className="tabular-nums">
                {index + 1} of {count}
              </span>
            )}
          </DialogDescription>
        )}
      </DialogHeader>

      <div
        ref={well}
        data-slot="lightbox-well"
        // a scroll area must be reachable from the keyboard so it can be panned
        // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        aria-label={`${image.alt}, ${percent === 'Fit' ? 'fitted' : percent}`}
        role="region"
        className={cn(
          'relative max-h-[70vh] min-h-48 overflow-auto border border-border bg-white outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring',
          zoom === 'fit' && 'flex items-start justify-center',
        )}
      >
        {/* a click toggles fit / 100%; the zoom buttons do the same from the keyboard */}
        {/* oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
        <div
          className={cn('relative inline-block', zoom === 'fit' ? 'cursor-zoom-in' : 'cursor-zoom-out')}
          onClick={() => setZoom(zoom === 'fit' ? 1 : 'fit')}
        >
          <img
            ref={img}
            src={image.src}
            alt={image.alt}
            draggable={false}
            onLoad={(event) => {
              setLoaded(true);
              const el = event.currentTarget;
              if (el.naturalWidth) setNatural({ w: el.naturalWidth, h: el.naturalHeight });
            }}
            className={cn('block max-w-none select-none', zoom === 'fit' && 'h-auto max-h-[calc(70vh-2px)] w-auto max-w-full')}
            style={zoom !== 'fit' && natural ? { width: natural.w * zoom, height: natural.h * zoom } : undefined}
          />
          {loaded &&
            regions.map((r, i) => {
              const point = r.width == null || r.height == null;
              return (
                <span
                  key={i}
                  data-slot="lightbox-region"
                  title={r.label}
                  className={cn(
                    'pointer-events-none absolute border-2 border-hope bg-hope/20',
                    point && 'size-10 -translate-x-1/2 -translate-y-1/2',
                  )}
                  style={{
                    left: `${r.x * 100}%`,
                    top: `${r.y * 100}%`,
                    ...(point ? {} : { width: `${r.width! * 100}%`, height: `${r.height! * 100}%` }),
                  }}
                >
                  {r.label && <span className="sr-only">{r.label}</span>}
                </span>
              );
            })}
        </div>
        {!loaded && (
          <p className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Spinner aria-hidden role="presentation" /> Loading the page…
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {count > 1 && (
          <>
            <Button size="icon-sm" variant="outline" aria-label="Previous" disabled={index === 0} onClick={onPrevious}>
              <ChevronLeft />
            </Button>
            <Button size="icon-sm" variant="outline" aria-label="Next" disabled={index === count - 1} onClick={onNext}>
              <ChevronRight />
            </Button>
          </>
        )}
        <div role="group" aria-label="Zoom" className="flex items-center gap-2 sm:ml-auto">
          <Button size="icon-sm" variant="outline" aria-label="Zoom out" onClick={zoomOut} disabled={zoom === STEPS[0]}>
            <Minus />
          </Button>
          <span aria-live="polite" className="w-12 text-center text-sm tabular-nums">
            {percent}
          </span>
          <Button size="icon-sm" variant="outline" aria-label="Zoom in" onClick={zoomIn} disabled={zoom === STEPS[STEPS.length - 1]}>
            <Plus />
          </Button>
          <Button size="sm" variant="outline" className={PRESSED} aria-pressed={zoom === 'fit'} onClick={() => setZoom('fit')}>
            Fit
          </Button>
          <Button size="sm" variant="outline" className={PRESSED} aria-pressed={zoom === 1} onClick={() => setZoom(1)}>
            100%
          </Button>
        </div>
        {image.href && (
          <a className={buttonVariants({ size: 'sm', variant: 'outline' })} href={image.href} target="_blank" rel="noreferrer">
            <ExternalLink data-icon="inline-start" /> {image.hrefLabel ?? 'Open the original'}
          </a>
        )}
      </div>
    </div>
  );
}

export { Lightbox, type LightboxImage, type LightboxProps, type LightboxRegion };
