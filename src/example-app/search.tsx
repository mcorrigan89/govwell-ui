import { CalendarDays, Construction, FileText } from 'lucide-react';

import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

import { RECORDS } from './data';

// GovWell's universal search (⌘K): records by number, address or applicant,
// and a few pages to jump to.
export function SearchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const go = (href: string) => {
    location.hash = href;
    onOpenChange(false);
  };
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Search" description="Find a record or go to a page">
      <Command>
        <CommandInput placeholder="Search records, addresses, applicants…" />
        <CommandList>
          <CommandEmpty>No records match.</CommandEmpty>
          <CommandGroup heading="Go to">
            <CommandItem value="building permits" onSelect={() => go('/records/building')}>
              <Construction /> Building Permits
            </CommandItem>
            <CommandItem value="inspection calendar" onSelect={() => go('/calendar')}>
              <CalendarDays /> Inspection Calendar
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Records">
            {RECORDS.map((r) => (
              <CommandItem
                key={r.id}
                value={`${r.number} ${r.address} ${r.applicant} ${r.kind}`}
                onSelect={() => go(`/records/${r.typeId}/${r.id}`)}
              >
                <FileText />
                <span className="flex min-w-0 flex-col">
                  <span>
                    {r.number} · {r.kind}
                  </span>
                  <span className="truncate text-sm text-muted-foreground">
                    {r.address} · {r.applicant}
                  </span>
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
