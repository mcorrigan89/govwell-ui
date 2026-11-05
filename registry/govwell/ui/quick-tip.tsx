'use client';

import * as React from 'react';
import { CircleHelp } from 'lucide-react';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// Inline help: a small "?" beside a label that explains it. By default it
// opens a popover on click or tap — the square floating panel with an Ash
// hairline — since help must be reachable on a touch screen; `trigger="hover"`
// makes it the inverse Slate tooltip instead, for a short hint. The "?" is
// muted until hovered or focused and has the standard focus ring.
//
//   <Label>Valuation <QuickTip content="The cost of the work, including labour and materials." /></Label>

type QuickTipProps = {
  /** the help; nothing renders without it */
  content: React.ReactNode;
  /** `click` opens a popover (default); `hover` shows a tooltip on hover or focus */
  trigger?: 'click' | 'hover';
  /** the button's accessible name (default "Help") */
  label?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
};

function QuickTip({ content, trigger = 'click', label = 'Help', side = 'top', className }: QuickTipProps) {
  if (content == null || content === false || content === '') return null;
  const button = (
    <button
      type="button"
      aria-label={label}
      data-slot="quick-tip"
      className={cn(
        'inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-none align-middle text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:text-foreground focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-solid focus-visible:outline-ring data-popup-open:text-foreground [&_svg]:size-4',
        className,
      )}
    />
  );
  if (trigger === 'hover') {
    return (
      <Tooltip>
        <TooltipTrigger delay={150} render={button}>
          <CircleHelp aria-hidden />
        </TooltipTrigger>
        <TooltipContent side={side}>{content}</TooltipContent>
      </Tooltip>
    );
  }
  return (
    <Popover>
      <PopoverTrigger render={button}>
        <CircleHelp aria-hidden />
      </PopoverTrigger>
      <PopoverContent side={side} sideOffset={6} data-slot="quick-tip-content" className="w-auto max-w-xs gap-2 font-light">
        {content}
      </PopoverContent>
    </Popover>
  );
}

export { QuickTip };
