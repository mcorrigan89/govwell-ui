'use client';

import * as React from 'react';
import { Toggle as TogglePrimitive } from '@base-ui/react/toggle';
import { ToggleGroup as ToggleGroupPrimitive } from '@base-ui/react/toggle-group';
import { Toolbar as ToolbarPrimitive } from '@base-ui/react/toolbar';
import { cva, type VariantProps } from 'class-variance-authority';

import { buttonVariants } from '@/components/ui/button';
import { toggleVariants } from '@/components/ui/toggle';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// A row of controls that acts as one tab stop: Tab enters it, the arrow keys
// move between its buttons, toggles and links, wrapping at the ends. A
// square strip with an Ash hairline; `floating` lifts it onto a popover
// panel with a shadow, for toolbars over a canvas or a selection. Buttons
// are ghost buttons; toggles turn Slate when on; groups are split by Ash
// rules. Give icon-only items a `tooltip` — it doubles as their name.

const toolbarVariants = cva(
  'flex w-fit max-w-full flex-wrap items-center gap-1 rounded-none border border-border p-1 data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-stretch',
  {
    variants: {
      variant: {
        default: 'bg-background',
        floating: 'bg-popover text-popover-foreground shadow-lg',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

function Toolbar({ className, variant, ...props }: ToolbarPrimitive.Root.Props & VariantProps<typeof toolbarVariants>) {
  return <ToolbarPrimitive.Root data-slot="toolbar" className={cn(toolbarVariants({ variant }), className)} {...props} />;
}

function ToolbarGroup({ className, ...props }: ToolbarPrimitive.Group.Props) {
  return <ToolbarPrimitive.Group data-slot="toolbar-group" className={cn('flex items-center gap-1', className)} {...props} />;
}

function ToolbarSeparator({ className, ...props }: ToolbarPrimitive.Separator.Props) {
  return (
    <ToolbarPrimitive.Separator
      data-slot="toolbar-separator"
      className={cn(
        'mx-1 shrink-0 bg-border data-[orientation=horizontal]:my-1 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:self-stretch data-[orientation=vertical]:h-6 data-[orientation=vertical]:w-px',
        className,
      )}
      {...props}
    />
  );
}

// wraps an item in a tooltip, and names it by the tooltip when it has no name of its own
function withTooltip(tooltip: string | undefined, element: React.ReactElement<{ 'aria-label'?: string }>) {
  if (!tooltip) return element;
  return (
    <Tooltip>
      <TooltipTrigger render={element.props['aria-label'] ? element : React.cloneElement(element, { 'aria-label': tooltip })} />
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

type ToolbarSize = 'sm' | 'icon-sm' | 'xs' | 'icon-xs';

function ToolbarButton({
  className,
  variant = 'ghost',
  size = 'icon-sm',
  tooltip,
  ...props
}: ToolbarPrimitive.Button.Props & {
  variant?: VariantProps<typeof buttonVariants>['variant'];
  size?: ToolbarSize;
  tooltip?: string;
}) {
  return withTooltip(
    tooltip,
    <ToolbarPrimitive.Button data-slot="toolbar-button" className={cn(buttonVariants({ variant, size }), className)} {...props} />,
  );
}

function ToolbarLink({ className, ...props }: ToolbarPrimitive.Link.Props) {
  return (
    <ToolbarPrimitive.Link
      data-slot="toolbar-link"
      className={cn(
        'inline-flex h-10 items-center px-3 text-sm font-light text-foreground underline decoration-1 underline-offset-4 outline-none hover:decoration-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring',
        className,
      )}
      {...props}
    />
  );
}

/** One or several toggles that share a value, inside a toolbar; `multiple` lets more than one be on. */
function ToolbarToggleGroup({ className, ...props }: ToggleGroupPrimitive.Props) {
  return <ToggleGroupPrimitive data-slot="toolbar-toggle-group" className={cn('flex items-center gap-1', className)} {...props} />;
}

function ToolbarToggle({
  className,
  value,
  pressed,
  defaultPressed,
  onPressedChange,
  tooltip,
  size = 'icon',
  ...props
}: Omit<ToolbarPrimitive.Button.Props, 'value'> &
  Pick<TogglePrimitive.Props, 'pressed' | 'defaultPressed' | 'onPressedChange'> & {
    /** its value in a ToolbarToggleGroup */
    value?: string;
    tooltip?: string;
    /** "icon" is square; "text" fits a label */
    size?: 'icon' | 'text';
  }) {
  return withTooltip(
    tooltip,
    <ToolbarPrimitive.Button
      data-slot="toolbar-toggle"
      className={cn(toggleVariants({ size: 'sm' }), size === 'icon' && 'w-10 px-0', className)}
      render={<TogglePrimitive value={value} pressed={pressed} defaultPressed={defaultPressed} onPressedChange={onPressedChange} />}
      {...props}
    />,
  );
}

export { Toolbar, ToolbarButton, ToolbarGroup, ToolbarLink, ToolbarSeparator, ToolbarToggle, ToolbarToggleGroup, toolbarVariants };
