import * as React from 'react';

import { cn } from '@/lib/utils';

// A stamp for an issued permit, an approved plan or a certified inspection,
// drawn as GovWell line art: a square frame with a solid square node at each
// corner (the node frame's "tech layer"), a dotted inner frame, the flag mark
// in the middle, the word on a solid status band, and two lines of eyebrow
// type — `top` above the mark, `bottom` beneath the band. It's an SVG, so it
// scales with `size`; lines and type are in currentColor.
//
//   <Seal top="City of Riverton" bottom="Permit B-2024-0193" word="Issued" />

const BAND = {
  ok: { fill: 'var(--ok)', text: 'var(--ok-foreground)' },
  info: { fill: 'var(--info)', text: 'var(--info-foreground)' },
  warning: { fill: 'var(--warning)', text: 'var(--warning-foreground)' },
  destructive: { fill: 'var(--destructive)', text: 'var(--destructive-foreground)' },
  neutral: { fill: 'currentColor', text: 'var(--background)' },
} as const;

// a line of eyebrow type wider than this (in viewBox units) is squeezed to fit
const LINE_WIDTH = 100;

/** centred on the seal, or stretched edge to edge when it's too long to fit */
function fit(text: string, fontSize: number, width = LINE_WIDTH) {
  // GT Standard caps run about 0.68em wide, plus the tracking
  if (text.length * fontSize * 0.72 <= width) return { x: 66, textAnchor: 'middle' as const };
  return { x: 66 - width / 2, textAnchor: 'start' as const, textLength: width, lengthAdjust: 'spacingAndGlyphs' as const };
}

function Seal({
  top,
  bottom,
  word = 'PASSED',
  size = 120,
  tone = 'ok',
  className,
  ...props
}: Omit<React.ComponentProps<'svg'>, 'children'> & {
  /** the line above the mark: who issued it */
  top: string;
  /** the line below the band: what was issued, a number, a date */
  bottom: string;
  /** the word on the band */
  word?: string;
  size?: number;
  /** the band's colour */
  tone?: keyof typeof BAND;
}) {
  const band = BAND[tone];
  const upper = { top: top.toUpperCase(), bottom: bottom.toUpperCase(), word: word.toUpperCase() };
  return (
    <svg
      data-slot="seal"
      data-tone={tone}
      role="img"
      aria-label={`${word}: ${top}, ${bottom}`}
      width={size}
      height={size}
      viewBox="0 0 132 132"
      fill="none"
      className={cn('shrink-0 text-foreground', className)}
      {...props}
    >
      {/* the frame and its corner nodes */}
      <rect x="4.5" y="4.5" width="123" height="123" stroke="currentColor" strokeWidth="1" shapeRendering="crispEdges" />
      <rect
        x="10.5"
        y="10.5"
        width="111"
        height="111"
        stroke="currentColor"
        strokeOpacity="0.7"
        strokeWidth="1"
        strokeDasharray="1 3"
        shapeRendering="crispEdges"
      />
      {[
        [1, 1],
        [124, 1],
        [1, 124],
        [124, 124],
      ].map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="7" height="7" fill="currentColor" />
      ))}

      <g fill="currentColor" fontSize="7" letterSpacing="0.28">
        <text y="30" {...fit(upper.top, 7)}>
          {upper.top}
        </text>
        <text y="110" {...fit(upper.bottom, 7)}>
          {upper.bottom}
        </text>
      </g>

      {/* the flag mark, from flag-mark.tsx, scaled into the field */}
      <g transform="translate(49.5 40) translate(-126 0)" fill="currentColor">
        <path d="M137.463 12.3506H126.291V23.5388H137.463V12.3506Z" />
        <path d="M158.69 12.3509C151.615 8.323 144.539 16.3789 137.463 12.3509V1.16276C144.539 5.1907 151.615 -2.86517 158.69 1.16276C158.69 4.89215 158.69 8.62155 158.69 12.3509Z" />
      </g>

      {/* the word on a solid status band */}
      <rect x="16" y="72" width="100" height="20" fill={band.fill} />
      <text y="86" fontSize="10" letterSpacing="1.5" fill={band.text} {...fit(upper.word, 11.5, 92)}>
        {upper.word}
      </text>
    </svg>
  );
}

export { Seal };
