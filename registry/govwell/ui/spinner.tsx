'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

// Busy, for how long unknown: GovWell's logomark (Logos/GovWell_Logomark) with
// its flag rippling, a wave running from the pole to the free end while the
// square holds still. The flag is redrawn 8 times a second, so it moves in
// visible steps, like stop motion. Sized and coloured by className, like an
// icon (size-4 by default; size-40 for a page-sized loader); it takes the
// colour of the text around it. At rest, and under prefers-reduced-motion, it
// is the logomark exactly.
//
//   <Spinner />
//   <Spinner className="size-40" />

// The logomark's own geometry (its 149 × 108 artboard).
const SQUARE = 'M51.2055 56.608H0V107.887H51.2055V56.608Z';
const POLE = 51.2058; // the flag's left edge, where it meets the square
const TIP = 148.494; // its free end
const TOP = 5.32928; // its top edge at the pole and the tip
const DEPTH = 51.2786; // top edge to bottom edge
// how far the logomark's curve swings from straight (its Bézier, measured)
const SWING = 5.2;

// The ripple can lift the flag up to two swings above the artboard, so the
// view starts that far up.
const VIEW_TOP = -SWING * 2;
const VIEW_HEIGHT = 108 - VIEW_TOP;

const FPS = 8;
const PERIOD_MS = 2000;
const STEPS = 28;

/**
 * The flag's outline with the wave moved on by `phase` (radians). At phase 0
 * it follows the logomark's curve; the pole stays pinned at every phase.
 */
function flagPath(phase: number) {
  const edge = (u: number) => TOP + SWING * (Math.sin(Math.PI * 2 * u - phase) + Math.sin(phase) * (1 - u));
  const top: string[] = [];
  const bottom: string[] = [];
  for (let i = 0; i <= STEPS; i++) {
    const u = i / STEPS;
    const x = (POLE + (TIP - POLE) * u).toFixed(3);
    const y = edge(u);
    top.push(`${x} ${y.toFixed(3)}`);
    bottom.unshift(`${x} ${(y + DEPTH).toFixed(3)}`);
  }
  return `M${top.join('L')}L${bottom.join('L')}Z`;
}

function Spinner({ className, ...props }: React.ComponentProps<'svg'>) {
  const flagRef = React.useRef<SVGPathElement>(null);

  React.useEffect(() => {
    const flag = flagRef.current;
    if (!flag) return;
    if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // a new frame every 1/8 s: the path changes only on those ticks
    const start = performance.now();
    const tick = window.setInterval(() => {
      const elapsed = performance.now() - start;
      flag.setAttribute('d', flagPath(((elapsed % PERIOD_MS) / PERIOD_MS) * Math.PI * 2));
    }, 1000 / FPS);
    return () => window.clearInterval(tick);
  }, []);

  return (
    <svg
      data-slot="spinner"
      role="status"
      aria-label="Loading"
      viewBox={`0 ${VIEW_TOP} 149 ${VIEW_HEIGHT}`}
      fill="currentColor"
      className={cn('block size-4', className)}
      {...props}
    >
      <path d={SQUARE} />
      <path ref={flagRef} d={flagPath(0)} />
    </svg>
  );
}

export { Spinner };
