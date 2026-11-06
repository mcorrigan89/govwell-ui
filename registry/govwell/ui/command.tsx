'use client';

import * as React from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { CheckIcon, SearchIcon } from 'lucide-react';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { InputGroup, InputGroupAddon } from '@/components/ui/input-group';
import { cn } from '@/lib/utils';

// A searchable list of commands (cmdk) in the popover's square white panel:
// a square search box over the list, a grey band on the selected item. Type
// to filter, arrows to move, Enter to run. Inline as <Command>, or as a ⌘K palette in
// <CommandDialog>: open it from your own key handler.

/**
 * cmdk keeps the selected item (and its group's heading) in view with
 * scrollIntoView, which scrolls the page too — an inline <Command> on a long
 * page would drag the page down to it when it mounts. Scroll only the list.
 */
function keepInList(el: HTMLElement | null | undefined) {
  if (!el) return;
  el.scrollIntoView = () => {
    const list = el.closest<HTMLElement>('[cmdk-list]');
    if (!list) return;
    // the list's visible inside: within its border, less any scroll padding
    const css = getComputedStyle(list);
    const outer = list.getBoundingClientRect();
    const top = outer.top + list.clientTop + (parseFloat(css.scrollPaddingTop) || 0);
    const bottom = outer.top + list.clientTop + list.clientHeight - (parseFloat(css.scrollPaddingBottom) || 0);
    const item = el.getBoundingClientRect();
    if (item.top < top) list.scrollTop -= top - item.top;
    else if (item.bottom > bottom) list.scrollTop += item.bottom - bottom;
  };
}

/** a ref that does `fn` and still hands the element to the caller's ref */
function withRef<T>(fn: (el: T | null) => void, ref: React.Ref<T> | undefined) {
  return (el: T | null) => {
    fn(el);
    if (typeof ref === 'function') ref(el);
    else if (ref) (ref as React.RefObject<T | null>).current = el;
  };
}

function Command({ className, ...props }: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn('flex size-full flex-col overflow-hidden rounded-none bg-popover p-1 text-popover-foreground', className)}
      {...props}
    />
  );
}

function CommandDialog({
  title = 'Command palette',
  description = 'Search for a command to run…',
  children,
  className,
  showCloseButton = false,
  ...props
}: Omit<React.ComponentProps<typeof Dialog>, 'children'> & {
  title?: string;
  description?: string;
  className?: string;
  showCloseButton?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Dialog {...props}>
      <DialogContent
        className={cn('top-1/3 translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-lg', className)}
        showCloseButton={showCloseButton}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

function CommandInput({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div data-slot="command-input-wrapper" className="p-1 pb-0">
      <InputGroup className="has-[[data-slot=command-input]:focus-visible]:border-foreground">
        <CommandPrimitive.Input
          data-slot="command-input"
          className={cn(
            'h-full w-full min-w-0 flex-1 bg-transparent px-2.5 text-base font-light text-foreground outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-40',
            className,
          )}
          {...props}
        />
        <InputGroupAddon>
          <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}

function CommandList({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn('no-scrollbar max-h-72 scroll-py-1 overflow-x-hidden overflow-y-auto outline-none', className)}
      {...props}
    />
  );
}

function CommandEmpty({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className={cn('py-6 text-center text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

function CommandGroup({ className, ref, ...props }: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      ref={withRef((el: HTMLDivElement | null) => keepInList(el?.querySelector<HTMLElement>('[cmdk-group-heading]')), ref)}
      data-slot="command-group"
      className={cn(
        'overflow-hidden p-1 text-foreground **:[[cmdk-group-heading]]:px-3 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-normal **:[[cmdk-group-heading]]:text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}

function CommandSeparator({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return <CommandPrimitive.Separator data-slot="command-separator" className={cn('-mx-1 h-px w-auto bg-border', className)} {...props} />;
}

function CommandItem({ className, children, ref, ...props }: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      ref={withRef(keepInList, ref)}
      data-slot="command-item"
      className={cn(
        "group/command-item relative flex cursor-default items-center gap-2 rounded-none px-3 py-2 text-sm outline-hidden select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-40 data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg]:text-muted-foreground data-[selected=true]:[&_svg]:text-accent-foreground",
        className,
      )}
      {...props}
    >
      {children}
      <CheckIcon className="ml-auto opacity-0 group-has-data-[slot=command-shortcut]/command-item:hidden group-data-[checked=true]/command-item:text-foreground group-data-[checked=true]/command-item:opacity-100" />
    </CommandPrimitive.Item>
  );
}

function CommandShortcut({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn(
        'ml-auto text-xs tracking-wide text-muted-foreground group-data-[selected=true]/command-item:text-accent-foreground',
        className,
      )}
      {...props}
    />
  );
}

export { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut };
