import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from '@/components/ui/combobox';
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarTrigger } from '@/components/ui/menubar';
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// jsdom lacks a few things Base UI and cmdk reach for
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
Element.prototype.scrollIntoView ??= function () {};
globalThis.matchMedia ??= ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener() {},
  removeListener() {},
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent: () => false,
})) as typeof globalThis.matchMedia;

describe('Tooltip', () => {
  it('shows its label on focus and hides it on Escape', async () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger render={<Button aria-label="Print permit" />}>★</TooltipTrigger>
          <TooltipContent>Print permit</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );
    await userEvent.tab();
    const tip = await screen.findByText('Print permit', { selector: '[data-slot=tooltip-content]' });
    expect(tip).toHaveClass('bg-secondary', 'text-secondary-foreground');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByText('Print permit', { selector: '[data-slot=tooltip-content]' })).not.toBeInTheDocument());
  });
});

describe('HoverCard', () => {
  it('opens on hover', async () => {
    render(
      <HoverCard>
        <HoverCardTrigger href="#record" delay={0}>
          BLD-2026-0142
        </HoverCardTrigger>
        <HoverCardContent>Residential addition, 18 Elm St</HoverCardContent>
      </HoverCard>,
    );
    await userEvent.hover(screen.getByRole('link', { name: 'BLD-2026-0142' }));
    expect(await screen.findByText('Residential addition, 18 Elm St')).toHaveAttribute('data-slot', 'hover-card-content');
  });
});

function Withdraw({ onCancel }: { onCancel: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button />}>Withdraw application</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogTitle>Withdraw this application?</AlertDialogTitle>
        <AlertDialogDescription>The applicant will be notified.</AlertDialogDescription>
        <AlertDialogCancel>Keep application</AlertDialogCancel>
        <AlertDialogAction
          onClick={() => {
            onCancel();
            setOpen(false);
          }}
        >
          Yes, withdraw
        </AlertDialogAction>
      </AlertDialogContent>
    </AlertDialog>
  );
}

describe('AlertDialog', () => {
  it('asks, and the cancel button backs out without acting', async () => {
    const onCancel = vi.fn();
    render(<Withdraw onCancel={onCancel} />);
    await userEvent.click(screen.getByRole('button', { name: 'Withdraw application' }));
    const dialog = await screen.findByRole('alertdialog', { name: 'Withdraw this application?' });
    expect(dialog).toHaveAccessibleDescription('The applicant will be notified.');
    expect(dialog).toHaveClass('bg-popover', 'p-8');
    await userEvent.click(screen.getByRole('button', { name: 'Keep application' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('runs the action', async () => {
    const onCancel = vi.fn();
    render(<Withdraw onCancel={onCancel} />);
    await userEvent.click(screen.getByRole('button', { name: 'Withdraw application' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Yes, withdraw' }));
    expect(onCancel).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
  });

  it('closes on Escape', async () => {
    render(<Withdraw onCancel={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: 'Withdraw application' }));
    await screen.findByRole('alertdialog');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
  });
});

describe('Sheet', () => {
  it('opens from its edge, and closes on Escape or the close button', async () => {
    render(
      <Sheet>
        <SheetTrigger render={<Button />}>Inspection details</SheetTrigger>
        <SheetContent side="left">
          <SheetTitle>Inspection details</SheetTitle>
          <SheetDescription>Framing inspection, Nov 12</SheetDescription>
        </SheetContent>
      </Sheet>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Inspection details' }));
    const sheet = await screen.findByRole('dialog', { name: 'Inspection details' });
    expect(sheet).toHaveAttribute('data-side', 'left');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'Inspection details' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});

describe('Drawer', () => {
  it('opens on its trigger and closes on Escape', async () => {
    render(
      <Drawer>
        <DrawerTrigger render={<Button />}>Today’s inspections</DrawerTrigger>
        <DrawerContent>
          <DrawerTitle>Assigned to you</DrawerTitle>
          <DrawerDescription>In route order</DrawerDescription>
        </DrawerContent>
      </Drawer>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Today’s inspections' }));
    const drawer = await screen.findByRole('dialog', { name: 'Assigned to you' });
    expect(drawer).toHaveAttribute('data-slot', 'drawer-popup');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});

describe('DropdownMenu', () => {
  it('opens on its trigger, runs an item and closes', async () => {
    const onSignOut = vi.fn();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button />}>Dana Ortiz</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={onSignOut}>
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Dana Ortiz' }));
    const signOut = await screen.findByRole('menuitem', { name: 'Sign out' });
    expect(signOut).toHaveClass('data-[variant=destructive]:text-error');
    await userEvent.click(signOut);
    expect(onSignOut).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
  });

  it('toggles a checkbox item and closes on Escape', async () => {
    function Digest() {
      const [on, setOn] = useState(false);
      return (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button />}>Dana Ortiz</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem checked={on} onCheckedChange={setOn} closeOnClick={false}>
              Daily email digest
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
    render(<Digest />);
    await userEvent.click(screen.getByRole('button', { name: 'Dana Ortiz' }));
    const item = await screen.findByRole('menuitemcheckbox', { name: 'Daily email digest' });
    expect(item).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(item);
    expect(item).toHaveAttribute('aria-checked', 'true');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
  });
});

describe('ContextMenu', () => {
  it('opens on right-click and runs an item', async () => {
    const onOpen = vi.fn();
    render(
      <ContextMenu>
        <ContextMenuTrigger>LIC-2026-0204</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={onOpen}>Open record</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    );
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    fireEvent.contextMenu(screen.getByText('LIC-2026-0204'));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Open record' }));
    expect(onOpen).toHaveBeenCalledOnce();
  });
});

describe('Menubar', () => {
  it('is a menubar whose triggers open their menus', async () => {
    const onNew = vi.fn();
    render(
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>Records</MenubarTrigger>
          <MenubarContent>
            <MenubarItem onClick={onNew}>New application</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>Reports</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Permits issued</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>,
    );
    const bar = screen.getByRole('menubar');
    expect(bar).toHaveClass('border', 'bg-background');
    await userEvent.click(within(bar).getByRole('menuitem', { name: 'Records' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'New application' }));
    expect(onNew).toHaveBeenCalledOnce();
  });
});

describe('Command', () => {
  it('keeps the selected item in view by scrolling its list, never the page', async () => {
    const pageScroll = vi.spyOn(Element.prototype, 'scrollIntoView');
    const ref = vi.fn();
    render(
      <Command>
        <CommandInput placeholder="Record" />
        <CommandList>
          <CommandGroup heading="Records">
            <CommandItem ref={ref}>BLD-2026-0142</CommandItem>
            <CommandItem>ELE-2026-0031</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>,
    );
    await screen.findByRole('option', { name: 'BLD-2026-0142', selected: true });
    await userEvent.keyboard('{ArrowDown}');
    expect(pageScroll).not.toHaveBeenCalled();
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLElement));
    pageScroll.mockRestore();
  });

  it('filters as you type and runs the chosen item', async () => {
    const onSchedule = vi.fn();
    render(
      <Command>
        <CommandInput placeholder="Search" />
        <CommandList>
          <CommandEmpty>No record or action by that name.</CommandEmpty>
          <CommandGroup heading="Actions">
            <CommandItem onSelect={onSchedule}>Schedule inspection</CommandItem>
            <CommandItem>Notifications</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>,
    );
    await userEvent.type(screen.getByPlaceholderText('Search'), 'sched');
    expect(screen.getByRole('option', { name: 'Schedule inspection' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Notifications' })).not.toBeInTheDocument();
    await userEvent.keyboard('{Enter}');
    expect(onSchedule).toHaveBeenCalledOnce();

    await userEvent.clear(screen.getByPlaceholderText('Search'));
    await userEvent.type(screen.getByPlaceholderText('Search'), 'zzz');
    expect(screen.getByText('No record or action by that name.')).toBeInTheDocument();
  });

  it('opens as a named dialog and closes on Escape', async () => {
    function Palette() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Search</Button>
          <CommandDialog open={open} onOpenChange={setOpen} title="Search records">
            <Command>
              <CommandInput placeholder="Record" />
              <CommandList>
                <CommandItem>BLD-2026-0142</CommandItem>
              </CommandList>
            </Command>
          </CommandDialog>
        </>
      );
    }
    render(<Palette />);
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));
    expect(await screen.findByRole('dialog', { name: 'Search records' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});

const RECORDS = ['BLD-2026-0142', 'BLD-2026-0157', 'ELE-2026-0031'];

function RecordPicker({ onValueChange }: { onValueChange?: (v: string | null) => void }) {
  return (
    <Combobox items={RECORDS} onValueChange={onValueChange}>
      <ComboboxInput placeholder="Link a record" />
      <ComboboxContent>
        <ComboboxEmpty>No record by that number.</ComboboxEmpty>
        <ComboboxList>
          {(item: string) => (
            <ComboboxItem key={item} value={item}>
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

describe('Combobox', () => {
  it('filters as you type and picks a record', async () => {
    const onValueChange = vi.fn();
    render(<RecordPicker onValueChange={onValueChange} />);
    const input = screen.getByPlaceholderText('Link a record');
    await userEvent.type(input, 'bld');
    expect(await screen.findByRole('option', { name: 'BLD-2026-0142' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'BLD-2026-0157' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'ELE-2026-0031' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('option', { name: 'BLD-2026-0157' }));
    expect(onValueChange).toHaveBeenCalledWith('BLD-2026-0157', expect.anything());
    expect(input).toHaveValue('BLD-2026-0157');
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
  });

  it('says when nothing matches, and closes on Escape', async () => {
    render(<RecordPicker />);
    await userEvent.type(screen.getByPlaceholderText('Link a record'), 'zzz');
    expect(await screen.findByText('No record by that number.')).toBeVisible();
    await act(async () => {
      await userEvent.keyboard('{Escape}');
    });
    await waitFor(() => expect(screen.queryByText('No record by that number.')).not.toBeInTheDocument());
  });
});
