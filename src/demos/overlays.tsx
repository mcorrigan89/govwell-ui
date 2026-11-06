import { useState, type ReactNode } from 'react';
import {
  Bell,
  CalendarCheck,
  ClipboardCheck,
  Copy,
  CreditCard,
  Download,
  FileText,
  Info,
  LogOut,
  Mail,
  Pencil,
  Printer,
  Settings,
  Trash2,
  TriangleAlert,
  User,
} from 'lucide-react';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from '@/components/ui/combobox';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from '@/components/ui/menubar';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Demos for the overlays group: tooltip, hover-card, alert-dialog, sheet,
// drawer, dropdown-menu, context-menu, menubar, command and combobox.

const RECORDS = [
  'BLD-2026-0142 · 18 Elm St',
  'BLD-2026-0157 · 402 Main St',
  'ELE-2026-0031 · 9 Harbor Rd',
  'PLM-2026-0088 · 77 Oak Ave',
  'ZON-2026-0012 · 1200 Commerce Dr',
  'LIC-2026-0204 · Riverside Café',
  'LIC-2026-0219 · Main St Hardware',
  'FIR-2026-0046 · 55 Station Sq',
];

const INSPECTORS = ['Dana Ortiz', 'Sam Patel', 'Jordan Lee', 'Priya Nair', 'Chris Walker', 'Morgan Diaz', 'Alex Kim'];

function TooltipDemo() {
  return (
    <TooltipProvider>
      <div className="flex gap-2">
        {[
          { icon: <Pencil />, label: 'Edit application' },
          { icon: <Printer />, label: 'Print permit' },
          { icon: <Download />, label: 'Download documents' },
        ].map(({ icon, label }) => (
          <Tooltip key={label}>
            <TooltipTrigger render={<Button variant="outline" size="icon" aria-label={label} />}>{icon}</TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}

function HoverCardDemo() {
  return (
    <p className="text-base">
      Plan review for{' '}
      <HoverCard>
        <HoverCardTrigger href="#record" className="underline decoration-1 underline-offset-4 hover:decoration-2">
          BLD-2026-0142
        </HoverCardTrigger>
        <HoverCardContent className="flex flex-col gap-3">
          <Badge variant="sky" className="self-start">
            In review
          </Badge>
          <p className="text-lg leading-tight font-normal tracking-tight">Residential addition, 18 Elm St</p>
          <p className="text-muted-foreground">Applicant: Maria Gonzales · submitted Oct 28</p>
          <p className="flex items-center gap-1.5 text-muted-foreground">
            <CalendarCheck className="size-4" /> Framing inspection Nov 12
          </p>
        </HoverCardContent>
      </HoverCard>{' '}
      is due by Friday.
    </p>
  );
}

function AlertDialogDemo() {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="outline" />}>Withdraw application</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <TriangleAlert />
          </AlertDialogMedia>
          <AlertDialogTitle>Withdraw this application?</AlertDialogTitle>
          <AlertDialogDescription>
            BLD-2026-0142 will be closed and the applicant notified. Fees already paid are refunded under your refund policy.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep application</AlertDialogCancel>
          <AlertDialogCancel variant="destructive">Withdraw</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function SheetDemo() {
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" />}>Inspection details</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Framing inspection</SheetTitle>
          <SheetDescription>BLD-2026-0142 · 18 Elm St</SheetDescription>
        </SheetHeader>
        <ul className="flex flex-col gap-4 px-8">
          {[
            ['Scheduled', 'Wed, Nov 12 · 9:00–11:00'],
            ['Inspector', 'Dana Ortiz'],
            ['Contact on site', 'Maria Gonzales · (555) 014-2290'],
          ].map(([name, value]) => (
            <li key={name} className="flex flex-col gap-1 border-b border-border pb-4">
              <span className="text-sm text-muted-foreground">{name}</span>
              <span>{value}</span>
            </li>
          ))}
        </ul>
        <SheetFooter>
          <SheetClose render={<Button />}>Done</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function DrawerDemo() {
  return (
    <Drawer showSwipeHandle>
      <DrawerTrigger render={<Button variant="outline" />}>Today’s inspections</DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader>
            <DrawerTitle>Today’s inspections</DrawerTitle>
            <DrawerDescription>Assigned to you, in route order.</DrawerDescription>
          </DrawerHeader>
          <ul className="flex flex-col gap-3 p-8">
            {[
              ['9:00', '18 Elm St', 'Framing'],
              ['10:30', '402 Main St', 'Final electrical'],
              ['1:15', '77 Oak Ave', 'Rough plumbing'],
            ].map(([time, address, kind]) => (
              <li key={time} className="flex items-center justify-between gap-3 border-b border-border pb-3">
                <span className="flex flex-col">
                  <span>{address}</span>
                  <span className="text-sm text-muted-foreground">{kind}</span>
                </span>
                <span className="text-muted-foreground">{time}</span>
              </li>
            ))}
          </ul>
          <DrawerFooter>
            <DrawerClose render={<Button variant="outline" />}>Close</DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function DropdownMenuDemo() {
  const [digest, setDigest] = useState(true);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>
        <User /> Dana Ortiz
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Building Department</DropdownMenuLabel>
          <DropdownMenuItem>
            <User /> Profile
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings /> Account settings
            <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CreditCard /> Payments
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem checked={digest} onCheckedChange={setDigest}>
          Daily email digest
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ContextMenuDemo() {
  return (
    <ContextMenu>
      <ContextMenuTrigger className="flex h-28 w-full max-w-sm items-center justify-center border border-dashed border-input text-sm text-muted-foreground">
        Right-click LIC-2026-0204
      </ContextMenuTrigger>
      <ContextMenuContent className="w-60">
        <ContextMenuGroup>
          <ContextMenuLabel>Business licence renewal</ContextMenuLabel>
          <ContextMenuItem>
            <FileText /> Open record
          </ContextMenuItem>
          <ContextMenuItem>
            <Copy /> Copy record number
            <ContextMenuShortcut>⌘C</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem>
            <Mail /> Email applicant
          </ContextMenuItem>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuItem disabled>
          <ClipboardCheck /> Issue licence
        </ContextMenuItem>
        <ContextMenuItem variant="destructive">
          <Trash2 /> Delete draft
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function MenubarDemo() {
  const [view, setView] = useState('list');
  const [mine, setMine] = useState(false);
  return (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>Records</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            New application <MenubarShortcut>⌘N</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>Import from spreadsheet</MenubarItem>
          <MenubarSeparator />
          <MenubarCheckboxItem checked={mine} onCheckedChange={setMine}>
            Only records assigned to me
          </MenubarCheckboxItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>View</MenubarTrigger>
        <MenubarContent>
          <MenubarGroup>
            <MenubarLabel>Show as</MenubarLabel>
            <MenubarRadioGroup value={view} onValueChange={setView}>
              <MenubarRadioItem value="list">List</MenubarRadioItem>
              <MenubarRadioItem value="board">Board</MenubarRadioItem>
              <MenubarRadioItem value="map">Map</MenubarRadioItem>
            </MenubarRadioGroup>
          </MenubarGroup>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>Reports</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>Permits issued</MenubarItem>
          <MenubarItem>Fees collected</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}

function CommandItems() {
  return (
    <>
      <CommandEmpty>No record or action by that name.</CommandEmpty>
      <CommandGroup heading="Records">
        {RECORDS.slice(0, 4).map((r) => (
          <CommandItem key={r}>
            <FileText /> {r}
          </CommandItem>
        ))}
      </CommandGroup>
      <CommandSeparator />
      <CommandGroup heading="Actions">
        <CommandItem>
          <ClipboardCheck /> Schedule inspection <CommandShortcut>⌘I</CommandShortcut>
        </CommandItem>
        <CommandItem>
          <Bell /> Notifications <CommandShortcut>⌘B</CommandShortcut>
        </CommandItem>
        <CommandItem>
          <Info /> Help centre
        </CommandItem>
      </CommandGroup>
    </>
  );
}

function CommandDemo() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex max-w-md flex-col items-start gap-4">
      <Command className="border border-border">
        <CommandInput placeholder="Search records or actions…" />
        <CommandList>
          <CommandItems />
        </CommandList>
      </Command>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Open the palette <span className="text-sm text-muted-foreground">⌘K</span>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen} title="Search records" description="Find a record or run an action">
        <Command>
          <CommandInput placeholder="Search records or actions…" />
          <CommandList>
            <CommandItems />
          </CommandList>
        </Command>
      </CommandDialog>
    </div>
  );
}

function ComboboxDemo() {
  const anchor = useComboboxAnchor();
  return (
    <div className="grid max-w-md gap-4">
      <Combobox items={RECORDS}>
        <ComboboxInput placeholder="Link a record" />
        <ComboboxContent>
          <ComboboxEmpty>No record by that number or address.</ComboboxEmpty>
          <ComboboxList>
            {(item: string) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      <Combobox multiple autoHighlight items={INSPECTORS} defaultValue={['Dana Ortiz', 'Sam Patel']}>
        <ComboboxChips ref={anchor}>
          <ComboboxValue>
            {(values: string[]) => (
              <>
                {values.map((v) => (
                  <ComboboxChip key={v}>{v}</ComboboxChip>
                ))}
                <ComboboxChipsInput placeholder="Assign inspectors" />
              </>
            )}
          </ComboboxValue>
        </ComboboxChips>
        <ComboboxContent anchor={anchor}>
          <ComboboxEmpty>No inspector by that name.</ComboboxEmpty>
          <ComboboxList>
            {(item: string) => (
              <ComboboxItem key={item} value={item}>
                <User /> {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}

export const OVERLAYS_DEMOS: Record<string, () => ReactNode> = {
  tooltip: () => <TooltipDemo />,
  'hover-card': () => <HoverCardDemo />,
  'alert-dialog': () => <AlertDialogDemo />,
  sheet: () => <SheetDemo />,
  drawer: () => <DrawerDemo />,
  'dropdown-menu': () => <DropdownMenuDemo />,
  'context-menu': () => <ContextMenuDemo />,
  menubar: () => <MenubarDemo />,
  command: () => <CommandDemo />,
  combobox: () => <ComboboxDemo />,
};
