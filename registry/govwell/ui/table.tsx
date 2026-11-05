'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

// A plain, dense table on a card: a Base header row in Regular type, Ash
// hairlines between the rows and tabular figures, so amounts and dates line
// up. Rows fill with the hover colour as you pass over them.

function Table({ className, ...props }: React.ComponentProps<'table'>) {
  return (
    <div data-slot="table-container" className="relative w-full overflow-x-auto bg-card text-card-foreground">
      <table data-slot="table" className={cn('w-full caption-bottom text-sm font-light tabular-nums', className)} {...props} />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  return <thead data-slot="table-header" className={cn('bg-muted text-foreground [&_tr]:border-b-0', className)} {...props} />;
}

function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return <tbody data-slot="table-body" className={cn(className)} {...props} />;
}

function TableFooter({ className, ...props }: React.ComponentProps<'tfoot'>) {
  return (
    <tfoot data-slot="table-footer" className={cn('border-t border-foreground font-normal [&>tr]:last:border-b-0', className)} {...props} />
  );
}

function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        'border-b border-border transition-colors hover:bg-accent/60 has-aria-expanded:bg-accent/60 data-[state=selected]:bg-accent',
        className,
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<'th'>) {
  return (
    <th
      data-slot="table-head"
      className={cn('h-11 px-4 text-left align-middle font-normal whitespace-nowrap [&:has([role=checkbox])]:pr-0', className)}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<'td'>) {
  return (
    <td
      data-slot="table-cell"
      className={cn('px-4 py-3 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0', className)}
      {...props}
    />
  );
}

function TableCaption({ className, ...props }: React.ComponentProps<'caption'>) {
  return <caption data-slot="table-caption" className={cn('px-4 py-3 text-left text-sm text-muted-foreground', className)} {...props} />;
}

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
