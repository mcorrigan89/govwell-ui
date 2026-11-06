'use client';

import * as ResizablePrimitive from 'react-resizable-panels';

import { cn } from '@/lib/utils';

// Panels split by dividers you can drag. The divider is an Ash hairline that
// turns to the text colour (Slate, or white in dark mode) while you hover or
// drag it. Sizes are percentages (defaultSize); give the group an id or
// autoSaveId in react-resizable-panels to remember them. withHandle adds a
// small square grip.

function ResizablePanelGroup({ className, ...props }: ResizablePrimitive.GroupProps) {
  return (
    <ResizablePrimitive.Group
      data-slot="resizable-panel-group"
      className={cn('flex h-full w-full aria-[orientation=vertical]:flex-col', className)}
      {...props}
    />
  );
}

function ResizablePanel({ ...props }: ResizablePrimitive.PanelProps) {
  return <ResizablePrimitive.Panel data-slot="resizable-panel" {...props} />;
}

function ResizableHandle({
  withHandle,
  className,
  ...props
}: ResizablePrimitive.SeparatorProps & {
  withHandle?: boolean;
}) {
  return (
    <ResizablePrimitive.Separator
      data-slot="resizable-handle"
      className={cn(
        'relative flex w-px items-center justify-center bg-border transition-colors outline-none after:absolute after:inset-y-0 after:left-1/2 after:w-2 after:-translate-x-1/2 hover:bg-foreground focus-visible:bg-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring data-[separator=active]:bg-foreground aria-[orientation=horizontal]:h-px aria-[orientation=horizontal]:w-full aria-[orientation=horizontal]:after:left-0 aria-[orientation=horizontal]:after:h-2 aria-[orientation=horizontal]:after:w-full aria-[orientation=horizontal]:after:translate-x-0 aria-[orientation=horizontal]:after:-translate-y-1/2 [&[aria-orientation=horizontal]>div]:rotate-90',
        className,
      )}
      {...props}
    >
      {withHandle && <div className="z-10 flex h-6 w-2 shrink-0 border border-input bg-background" />}
    </ResizablePrimitive.Separator>
  );
}

export { ResizableHandle, ResizablePanel, ResizablePanelGroup };
