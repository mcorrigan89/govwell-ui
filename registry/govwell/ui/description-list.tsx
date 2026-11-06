import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { QuickTip } from '@/components/ui/quick-tip';
import { cn } from '@/lib/utils';

// Label → value facts, as on a record, a parcel or a fee: a real <dl> with
// the label in muted Light and the value in foreground, figures in tabular
// numbers so a column of amounts lines up. Three layouts: stacked (label over
// value), inline (a label column beside the values, aligned across rows with
// a subgrid) and grid (stacked pairs flowing into columns). `divided` rules
// each row with an Ash hairline. A value can carry its source: a "?" that
// opens a small panel, or a muted second line. An empty value shows an em
// dash, read out as "None".
//
//   <DescriptionList layout="inline" divided>
//     <DescriptionItem>
//       <DescriptionTerm>Valuation</DescriptionTerm>
//       <DescriptionDetails source="Applicant, on the application">$48,200</DescriptionDetails>
//     </DescriptionItem>
//   </DescriptionList>

type Layout = 'stacked' | 'inline' | 'grid';

const DescriptionListContext = React.createContext<{ layout: Layout; divided: boolean }>({ layout: 'stacked', divided: false });

const descriptionListVariants = cva('grid text-base font-light', {
  variants: {
    layout: {
      stacked: 'grid-cols-1',
      inline: 'grid-cols-[minmax(7rem,max-content)_1fr] gap-x-6',
      grid: 'grid-cols-1 gap-x-8 sm:grid-cols-2',
    },
    columns: { 2: '', 3: '', 4: '' },
    divided: { true: '', false: '' },
  },
  compoundVariants: [
    { layout: 'grid', columns: 3, className: 'lg:grid-cols-3' },
    { layout: 'grid', columns: 4, className: 'lg:grid-cols-4' },
    { layout: 'stacked', divided: false, className: 'gap-y-4' },
    { layout: 'inline', divided: false, className: 'gap-y-2' },
    { layout: 'grid', divided: false, className: 'gap-y-5' },
  ],
  defaultVariants: { layout: 'stacked', columns: 2, divided: false },
});

function DescriptionList({
  className,
  layout = 'stacked',
  columns = 2,
  divided = false,
  ...props
}: React.ComponentProps<'dl'> & VariantProps<typeof descriptionListVariants>) {
  const l = layout ?? 'stacked';
  const d = divided ?? false;
  const value = React.useMemo(() => ({ layout: l, divided: d }), [l, d]);
  return (
    <DescriptionListContext.Provider value={value}>
      <dl
        data-slot="description-list"
        data-layout={l}
        className={cn(descriptionListVariants({ layout: l, columns, divided: d }), className)}
        {...props}
      />
    </DescriptionListContext.Provider>
  );
}

/** one label → value pair (a <div> around a <dt> and its <dd>s, which HTML allows) */
function DescriptionItem({ className, ...props }: React.ComponentProps<'div'>) {
  const { layout, divided } = React.useContext(DescriptionListContext);
  return (
    <div
      data-slot="description-item"
      className={cn(
        layout === 'inline' ? 'col-span-2 grid grid-cols-subgrid items-baseline' : 'flex min-w-0 flex-col gap-1',
        divided && 'border-b border-border py-3',
        className,
      )}
      {...props}
    />
  );
}

function DescriptionTerm({ className, ...props }: React.ComponentProps<'dt'>) {
  return <dt data-slot="description-term" className={cn('text-sm text-muted-foreground', className)} {...props} />;
}

type DescriptionDetailsProps = React.ComponentProps<'dd'> & {
  /** where the value comes from: "Assessor parcel fabric · imported 3 Nov 2026" */
  source?: React.ReactNode;
  /** `tip` (default): a "?" beside the value opens the source; `line`: a muted line under it */
  sourceDisplay?: 'tip' | 'line';
  /** what a screen reader hears for an empty value (default "None") */
  emptyLabel?: string;
};

function isEmpty(children: React.ReactNode) {
  return children == null || children === false || children === '' || (Array.isArray(children) && children.every(isEmpty));
}

function DescriptionDetails({
  className,
  children,
  source,
  sourceDisplay = 'tip',
  emptyLabel = 'None',
  ...props
}: DescriptionDetailsProps) {
  const empty = isEmpty(children);
  const value = empty ? (
    <span data-slot="description-empty" className="text-muted-foreground">
      <span aria-hidden>—</span>
      <span className="sr-only">{emptyLabel}</span>
    </span>
  ) : (
    children
  );
  return (
    <dd data-slot="description-details" className={cn('min-w-0 text-foreground tabular-nums', className)} {...props}>
      {source != null && sourceDisplay === 'tip' ? (
        <span className="inline-flex items-center gap-1">
          <span className="min-w-0">{value}</span>
          <QuickTip content={source} label="Source" className="-my-1" />
        </span>
      ) : (
        value
      )}
      {source != null && sourceDisplay === 'line' && (
        <span data-slot="description-source" className="mt-0.5 block text-sm text-muted-foreground">
          {source}
        </span>
      )}
    </dd>
  );
}

export { DescriptionDetails, DescriptionItem, DescriptionList, DescriptionTerm, descriptionListVariants };
