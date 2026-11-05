'use client';

import * as React from 'react';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  columnFilteringFeature,
  columnVisibilityFeature,
  filterFn_includesString,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
  useTable,
  type Column,
  type ColumnDef,
  type Row,
  type RowData,
} from '@tanstack/react-table';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  Columns3Icon,
  EyeOffIcon,
  GripVerticalIcon,
  InboxIcon,
  SearchIcon,
  SearchXIcon,
  XIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Spinner } from '@/components/ui/spinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

// GovWell's working table: TanStack Table v9 driving GovWell UI's table,
// filter box, menus and pagination. It sorts, filters, pages, hides columns
// and selects rows; when rows are selected a bulk-action bar floats up from
// the bottom (count, your actions, clear — Esc clears too). Optional: a
// pinned header and first column for wide, long tables; rows reordered by
// dragging a handle (or with the keyboard: Space to lift, arrows, Space to
// drop); rows that open to show more; a row click; a loading state; and an
// empty state in the brand's node frame.
//
//   const col = dataTableColumns<Permit>();
//   const columns = col.columns([col.accessor('number', { header: 'Permit' }), …]);
//   <DataTable columns={columns} data={permits} getRowId={(p) => p.number} selectable
//     bulkActions={(rows, clear) => <Button onClick={() => assign(rows).then(clear)}>Assign</Button>} />
//
// Keep `columns` and `data` stable (module scope, state or useMemo): a new
// array every render rebuilds every row model.

/** The features every DataTable registers, with the row models, filter and sort functions they need. */
export const dataTableFeatures = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, basic: sortFn_basic, datetime: sortFn_datetime, text: sortFn_text },
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: { includesString: filterFn_includesString },
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
  columnVisibilityFeature,
  rowSelectionFeature,
});

export type DataTableFeatures = typeof dataTableFeatures;
// oxlint-disable-next-line typescript/no-explicit-any -- a column's value type varies per column
export type DataTableColumn<TData extends RowData> = ColumnDef<DataTableFeatures, TData, any>;
export type DataTableRow<TData extends RowData> = Row<DataTableFeatures, TData>;

/** A column helper typed for DataTable. */
export const dataTableColumns = <TData extends RowData>() => createColumnHelper<DataTableFeatures, TData>();

/** A row moved by dragging: indexes into `data`, so `arrayMove(data, from, to)` applies it. */
export type DataTableReorder = { id: string; from: number; to: number };

// the leading columns the table adds itself
const DRAG = '__drag';
const SELECT = '__select';
const EXPAND = '__expand';
const UTILITY = new Set([DRAG, SELECT, EXPAND]);
const UTILITY_WIDTH = 44;

const columnLabel = <TData extends RowData>(column: Column<DataTableFeatures, TData, unknown>) =>
  typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id;

// pages to show around the current one, with gaps marked
function pageList(current: number, count: number): (number | 'gap')[] {
  const pages = [...new Set([0, current - 1, current, current + 1, count - 1])].filter((p) => p >= 0 && p < count).sort((a, b) => a - b);
  return pages.flatMap((p, i) => (i > 0 && p - pages[i - 1]! > 1 ? (['gap', p] as const) : ([p] as const)));
}

// a click on something that handles itself shouldn't also select or open the row
const fromControl = (e: React.SyntheticEvent) =>
  !!(e.target as HTMLElement).closest(
    'a,button,input,label,select,textarea,[role=checkbox],[role=button],[role=menuitem],[data-slot=data-table-expanded]',
  );

type Handle = {
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners;
  setActivatorNodeRef: (el: HTMLElement | null) => void;
};

// a row that dnd-kit can move; it hands its drag handle's props down
function SortableRow({
  id,
  children,
}: {
  id: string;
  children: (
    props: { ref: (el: HTMLElement | null) => void; style: React.CSSProperties; dragging: boolean },
    handle: Handle,
  ) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });
  return children(
    {
      ref: setNodeRef,
      // rows only move up and down
      style: {
        transform: CSS.Translate.toString(transform && { ...transform, x: 0 }),
        transition,
        position: 'relative',
        zIndex: isDragging ? 2 : undefined,
      },
      dragging: isDragging,
    },
    { attributes, listeners, setActivatorNodeRef },
  );
}

export function DataTable<TData extends RowData>({
  columns,
  data,
  getRowId,
  rowLabel,
  pageSize = 10,
  filter = true,
  filterPlaceholder = 'Filter…',
  searchShortcut = false,
  selectable = false,
  bulkActions,
  onRowClick,
  renderExpanded,
  getRowCanExpand,
  onReorder,
  stickyHeader = false,
  maxHeight,
  stickyFirstColumn = false,
  columnMenus = false,
  loading = false,
  emptyTitle = 'Nothing here yet',
  emptyDescription,
  emptyAction,
  emptyIcon = <InboxIcon />,
  toolbar,
  wrapRow = (_row, element) => element,
  className,
}: {
  columns: DataTableColumn<TData>[];
  data: TData[];
  /** a stable id per row, so selection survives sorting and filtering (and dragging needs it) */
  getRowId?: (row: TData) => string;
  /** how to name a row to a screen reader ("Select BP-2026-0418"); default its id */
  rowLabel?: (row: TData) => string;
  /** rows per page, or false for one long page */
  pageSize?: number | false;
  /** show the filter box; default true */
  filter?: boolean;
  filterPlaceholder?: string;
  /** ⌘F / Ctrl+F focuses the filter box; pressed again, the browser's own find */
  searchShortcut?: boolean;
  /** a leading column of checkboxes; a function says which rows can be selected */
  selectable?: boolean | ((row: TData) => boolean);
  /** what to do with the selected rows: shown in a bar while any are selected */
  bulkActions?: (selected: TData[], clear: () => void) => React.ReactNode;
  /** a click (or Enter) on a row; without it, a click on a selectable row selects it */
  onRowClick?: (row: TData) => void;
  /** the content under a row that opens; adds a leading open/close button */
  renderExpanded?: (row: TData) => React.ReactNode;
  /** which rows can open; default all */
  getRowCanExpand?: (row: TData) => boolean;
  /** rows can be dragged into a new order (not while sorted or filtered); you apply the move to `data` */
  onReorder?: (move: DataTableReorder) => void;
  /** pin the header while the rows scroll under it; pair with `maxHeight` */
  stickyHeader?: boolean;
  /** cap the table's height and scroll inside it (pins the header) */
  maxHeight?: React.CSSProperties['maxHeight'];
  /** pin the first column (with the checkboxes and handles before it) while the rest scroll sideways */
  stickyFirstColumn?: boolean;
  /** a menu on each column's header: sort either way, clear the sort, hide the column */
  columnMenus?: boolean;
  /** dim the rows and show a spinner while new data is on its way */
  loading?: boolean;
  emptyTitle?: React.ReactNode;
  emptyDescription?: React.ReactNode;
  /** a button or link under the empty state (e.g. "New permit") */
  emptyAction?: React.ReactNode;
  emptyIcon?: React.ReactNode;
  /** more controls for the toolbar, after the filter box */
  toolbar?: React.ReactNode;
  /** wrap a row — e.g. in a context menu trigger; `element` is the <TableRow> */
  wrapRow?: (row: DataTableRow<TData>, element: React.ReactElement) => React.ReactNode;
  className?: string;
}) {
  const nameOf = React.useCallback((row: DataTableRow<TData>) => rowLabel?.(row.original) ?? row.id, [rowLabel]);
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
  const canExpand = (row: DataTableRow<TData>) => !!renderExpanded && (getRowCanExpand?.(row.original) ?? true);

  const allColumns = React.useMemo<DataTableColumn<TData>[]>(() => {
    const lead: DataTableColumn<TData>[] = [];
    if (onReorder) lead.push({ id: DRAG, enableSorting: false, enableHiding: false, enableGlobalFilter: false, header: () => null });
    if (selectable)
      lead.push({
        id: SELECT,
        enableSorting: false,
        enableHiding: false,
        enableGlobalFilter: false,
        header: ({ table }) => (
          <Checkbox
            aria-label="Select all rows on this page"
            checked={table.getIsAllPageRowsSelected()}
            indeterminate={table.getIsSomePageRowsSelected()}
            onCheckedChange={(checked) => table.toggleAllPageRowsSelected(!!checked)}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            aria-label={`Select ${nameOf(row)}`}
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            onCheckedChange={(checked) => row.toggleSelected(!!checked)}
          />
        ),
      });
    if (renderExpanded) lead.push({ id: EXPAND, enableSorting: false, enableHiding: false, enableGlobalFilter: false, header: () => null });
    return [...lead, ...columns];
  }, [columns, onReorder, selectable, renderExpanded, nameOf]);

  const table = useTable({
    features: dataTableFeatures,
    columns: allColumns,
    data,
    getRowId,
    globalFilterFn: 'includesString',
    enableRowSelection: typeof selectable === 'function' ? (row) => selectable(row.original) : !!selectable,
    initialState: { pagination: { pageIndex: 0, pageSize: pageSize === false ? Number.MAX_SAFE_INTEGER : pageSize } },
  });

  const { pagination, globalFilter, sorting } = table.state;
  const filtering = !!globalFilter;
  const pageCount = table.getPageCount();
  const filteredCount = table.getFilteredRowModel().rows.length;
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedCount = selectedRows.length;
  const hideable = table.getAllLeafColumns().filter((c) => c.getCanHide());
  const rows = table.getRowModel().rows;
  const visibleColumns = table.getVisibleLeafColumns();
  // dragging follows the data's own order, so not while a sort or filter rearranges it
  const reorderable = !!onReorder && !sorting?.length && !filtering;

  const rootRef = React.useRef<HTMLDivElement>(null);
  const filterRef = React.useRef<HTMLInputElement>(null);

  const clearSelection = React.useCallback(() => table.resetRowSelection(true), [table]);

  // Esc clears the selection — while focus is in the table, so it doesn't
  // fight a dialog or menu elsewhere on the page
  React.useEffect(() => {
    if (!selectedCount || !bulkActions) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      const inside = rootRef.current?.contains(document.activeElement) || document.activeElement === document.body;
      if (!inside) return;
      clearSelection();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [selectedCount, bulkActions, clearSelection]);

  // ⌘F / Ctrl+F: the first press focuses the filter box, the next falls through to the browser's find
  React.useEffect(() => {
    if (!searchShortcut || !filter) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f' && document.activeElement !== filterRef.current) {
        e.preventDefault();
        filterRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [searchShortcut, filter]);

  // where each pinned column sits: the utility columns and the first of yours
  const pinned = new Map<string, { left: number; last: boolean }>();
  if (stickyFirstColumn) {
    let left = 0;
    for (const column of visibleColumns) {
      const utility = UTILITY.has(column.id);
      pinned.set(column.id, { left, last: !utility });
      if (!utility) break;
      left += UTILITY_WIDTH;
    }
  }
  const pinStyle = (id: string): React.CSSProperties | undefined => {
    const pin = pinned.get(id);
    return pin ? { position: 'sticky', left: pin.left } : undefined;
  };
  const pinClass = (id: string) => {
    const pin = pinned.get(id);
    if (!pin) return undefined;
    return cn('z-[1]', pin.last && 'shadow-[inset_-1px_0_0_var(--border)]');
  };
  const utilityClass = (id: string) =>
    UTILITY.has(id) && 'w-11 min-w-11 max-w-11 px-0 text-center [&:has([role=checkbox])]:pr-0 [&>*]:mx-auto';

  const pinHeader = stickyHeader || maxHeight !== undefined;

  const go = (page: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    table.setPageIndex(page);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const rowById = (id: string | number) => rows.find((r) => r.id === String(id));
  const announcements: Announcements = {
    onDragStart: ({ active }) => {
      const row = rowById(active.id);
      return row ? `Picked up ${nameOf(row)}. Use the arrow keys to move it, Space to drop it, Escape to cancel.` : undefined;
    },
    onDragOver: ({ active, over }) => {
      const a = rowById(active.id);
      const o = over && rowById(over.id);
      return a && o ? `${nameOf(a)} is over ${nameOf(o)}.` : undefined;
    },
    onDragEnd: ({ active, over }) => {
      const a = rowById(active.id);
      const o = over && rowById(over.id);
      return a && o ? `Dropped ${nameOf(a)} at ${nameOf(o)}'s place.` : undefined;
    },
    onDragCancel: ({ active }) => {
      const a = rowById(active.id);
      return a ? `Moving ${nameOf(a)} was cancelled.` : undefined;
    },
  };
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = rowById(active.id);
    const to = rowById(over.id);
    if (from && to) onReorder?.({ id: from.id, from: from.index, to: to.index });
  };

  const renderRow = (row: DataTableRow<TData>, sortable?: Parameters<React.ComponentProps<typeof SortableRow>['children']>) => {
    const open = !!expanded[row.id];
    const expandable = canExpand(row);
    const clickable = !!onRowClick || (!!selectable && row.getCanSelect());
    const [rowProps, handle] = sortable ?? [];
    const utilityCell = (id: string) => {
      if (id === DRAG)
        return reorderable && handle ? (
          <Button
            variant="ghost"
            size="icon-xs"
            className="cursor-grab touch-none active:cursor-grabbing"
            ref={handle.setActivatorNodeRef}
            {...handle.attributes}
            {...handle.listeners}
            aria-label={`Reorder ${nameOf(row)}`}
          >
            <GripVerticalIcon />
          </Button>
        ) : null;
      if (id === EXPAND)
        return expandable ? (
          <Button
            variant="ghost"
            size="icon-xs"
            aria-expanded={open}
            aria-label={`${open ? 'Collapse' : 'Expand'} ${nameOf(row)}`}
            onClick={() => setExpanded((s) => ({ ...s, [row.id]: !open }))}
          >
            {open ? <ChevronDownIcon /> : <ChevronRightIcon />}
          </Button>
        ) : null;
      return null;
    };
    const element = (
      <TableRow
        ref={rowProps?.ref}
        style={rowProps?.style}
        data-state={row.getIsSelected() ? 'selected' : undefined}
        data-dragging={rowProps?.dragging || undefined}
        tabIndex={onRowClick ? 0 : undefined}
        className={cn(
          'group/row',
          clickable && 'cursor-pointer',
          onRowClick &&
            'outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring',
          rowProps?.dragging && 'bg-card shadow-lg',
        )}
        onClick={(e) => {
          if (fromControl(e)) return;
          if (onRowClick) onRowClick(row.original);
          // a ⌘/Ctrl-click is for opening a link in a new tab, not selecting
          else if (selectable && row.getCanSelect() && !e.metaKey && !e.ctrlKey) row.toggleSelected();
        }}
        onKeyDown={
          onRowClick
            ? (e) => {
                if (e.key === 'Enter' && e.target === e.currentTarget) onRowClick(row.original);
              }
            : undefined
        }
      >
        {row.getVisibleCells().map((cell) => (
          <TableCell
            key={cell.id}
            style={pinStyle(cell.column.id)}
            className={cn(
              'first:pl-4',
              utilityClass(cell.column.id),
              pinned.has(cell.column.id) &&
                'bg-card group-hover/row:bg-[color-mix(in_srgb,var(--accent)_60%,var(--card))] group-data-[state=selected]/row:bg-accent',
              pinClass(cell.column.id),
            )}
          >
            {UTILITY.has(cell.column.id) && cell.column.id !== SELECT ? utilityCell(cell.column.id) : <table.FlexRender cell={cell} />}
          </TableCell>
        ))}
      </TableRow>
    );
    return (
      <React.Fragment key={row.id}>
        {wrapRow(row, element)}
        {open && expandable && (
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={visibleColumns.length} className="bg-muted/50 p-0 whitespace-normal">
              <div data-slot="data-table-expanded" className="px-4 py-4 sm:pl-14">
                {renderExpanded?.(row.original)}
              </div>
            </TableCell>
          </TableRow>
        )}
      </React.Fragment>
    );
  };

  const body = rows.length ? (
    reorderable ? (
      rows.map((row) => (
        <SortableRow key={row.id} id={row.id}>
          {(props, handle) => renderRow(row, [props, handle])}
        </SortableRow>
      ))
    ) : (
      rows.map((row) => renderRow(row))
    )
  ) : (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={visibleColumns.length} className="p-0 whitespace-normal">
        {loading ? (
          <div className="flex h-40 items-center justify-center gap-3 text-muted-foreground">
            <Spinner className="size-5" /> Loading…
          </div>
        ) : filtering ? (
          <Empty className="border-0">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SearchXIcon />
              </EmptyMedia>
              <EmptyTitle>Nothing matches.</EmptyTitle>
              <EmptyDescription>No rows match “{globalFilter}”.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="outline" size="sm" onClick={() => table.setGlobalFilter('')}>
                Clear the filter
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <Empty className="border-0">
            <EmptyHeader>
              <EmptyMedia variant="icon">{emptyIcon}</EmptyMedia>
              <EmptyTitle>{emptyTitle}</EmptyTitle>
              {emptyDescription && <EmptyDescription>{emptyDescription}</EmptyDescription>}
            </EmptyHeader>
            {emptyAction && <EmptyContent>{emptyAction}</EmptyContent>}
          </Empty>
        )}
      </TableCell>
    </TableRow>
  );

  const grid = (
    <Table aria-busy={loading || undefined}>
      <TableHeader>
        {table.getHeaderGroups().map((group) => (
          <TableRow key={group.id} className="hover:bg-transparent">
            {group.headers.map((header) => {
              const column = header.column;
              const sorted = column.getIsSorted();
              const utility = UTILITY.has(column.id);
              const label = columnLabel(column);
              const auto = column.getCanSort() ? column.getAutoSortDir() : 'asc';
              const menu = columnMenus && !utility && (column.getCanSort() || column.getCanHide());
              return (
                <TableHead
                  key={header.id}
                  colSpan={header.colSpan}
                  aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : undefined}
                  style={{ ...pinStyle(column.id), ...(pinHeader && { position: 'sticky', top: 0 }) }}
                  className={cn(
                    'group/head first:pl-4',
                    utilityClass(column.id),
                    (pinHeader || pinned.has(column.id)) && 'bg-muted',
                    pinHeader && 'z-[2]',
                    pinClass(column.id),
                    pinHeader && pinned.has(column.id) && 'z-[3]',
                  )}
                >
                  {header.isPlaceholder ? null : (
                    <div className="flex items-center gap-1">
                      {column.getCanSort() ? (
                        <button
                          type="button"
                          onClick={column.getToggleSortingHandler()}
                          className="-mx-1.5 inline-flex items-center gap-1.5 px-1.5 py-0.5 outline-none hover:underline hover:decoration-1 hover:underline-offset-4 focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-ring"
                        >
                          <table.FlexRender header={header} />
                          {/* sorted: the direction; not yet: a faint preview of the first click's, on hover */}
                          {sorted === 'asc' ? (
                            <ArrowUpIcon aria-hidden className="size-3.5" />
                          ) : sorted === 'desc' ? (
                            <ArrowDownIcon aria-hidden className="size-3.5" />
                          ) : auto === 'desc' ? (
                            <ArrowDownIcon aria-hidden className="invisible size-3.5 text-muted-foreground group-hover/head:visible" />
                          ) : (
                            <ArrowUpIcon aria-hidden className="invisible size-3.5 text-muted-foreground group-hover/head:visible" />
                          )}
                        </button>
                      ) : (
                        <table.FlexRender header={header} />
                      )}
                      {menu && (
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={<Button variant="ghost" size="icon-xs" className="size-6" aria-label={`${label} column options`} />}
                          >
                            <ChevronDownIcon />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-44">
                            {column.getCanSort() && (
                              <DropdownMenuGroup>
                                <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
                                  <ArrowUpIcon /> Sort ascending
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
                                  <ArrowDownIcon /> Sort descending
                                </DropdownMenuItem>
                                {sorted && (
                                  <DropdownMenuItem onClick={() => column.clearSorting()}>
                                    <XIcon /> Clear sort
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuGroup>
                            )}
                            {column.getCanSort() && column.getCanHide() && <DropdownMenuSeparator />}
                            {column.getCanHide() && (
                              <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
                                <EyeOffIcon /> Hide column
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  )}
                </TableHead>
              );
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody className={cn(loading && rows.length > 0 && 'pointer-events-none opacity-50 transition-opacity')}>{body}</TableBody>
    </Table>
  );

  return (
    <div ref={rootRef} data-slot="data-table" className={cn('flex flex-col gap-3', className)}>
      {(filter || toolbar || hideable.length > 0) && (
        <div className="flex flex-wrap items-center gap-2">
          {filter && (
            <InputGroup className="w-full max-w-xs">
              <InputGroupInput
                ref={filterRef}
                value={globalFilter ?? ''}
                onChange={(e) => table.setGlobalFilter(e.target.value)}
                placeholder={filterPlaceholder}
                aria-label={filterPlaceholder}
              />
              <InputGroupAddon>
                <SearchIcon />
              </InputGroupAddon>
            </InputGroup>
          )}
          {toolbar}
          {hideable.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="ml-auto" />}>
                <Columns3Icon data-icon="inline-start" /> Columns
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Show columns</DropdownMenuLabel>
                  {hideable.map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(visible) => column.toggleVisibility(!!visible)}
                    >
                      {columnLabel(column)}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}

      <div
        data-slot="data-table-frame"
        className={cn(
          'relative border border-border',
          // with a height cap this frame is the scroller, so the header can pin to it
          maxHeight !== undefined && 'overflow-auto *:data-[slot=table-container]:overflow-visible',
        )}
        style={maxHeight !== undefined ? { maxHeight } : undefined}
      >
        {reorderable ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd} accessibility={{ announcements }}>
            <SortableContext items={rows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
              {grid}
            </SortableContext>
          </DndContext>
        ) : (
          grid
        )}
        {loading && rows.length > 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="flex items-center gap-2 border border-border bg-popover px-4 py-2 text-sm shadow-lg">
              <Spinner /> Loading…
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground tabular-nums">
          {selectedCount > 0 ? `${selectedCount} of ${filteredCount} selected` : `${filteredCount} ${filteredCount === 1 ? 'row' : 'rows'}`}
          {pageCount > 1 && ` · page ${pagination.pageIndex + 1} of ${pageCount}`}
        </span>
        {pageCount > 1 && (
          <Pagination className="mx-0 w-auto">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  aria-disabled={!table.getCanPreviousPage()}
                  className={cn(!table.getCanPreviousPage() && 'pointer-events-none opacity-40')}
                  onClick={go(pagination.pageIndex - 1)}
                />
              </PaginationItem>
              {pageList(pagination.pageIndex, pageCount).map((p, i) => (
                <PaginationItem key={p === 'gap' ? `gap-${i}` : p}>
                  {p === 'gap' ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink href="#" isActive={p === pagination.pageIndex} onClick={go(p)}>
                      {p + 1}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  aria-disabled={!table.getCanNextPage()}
                  className={cn(!table.getCanNextPage() && 'pointer-events-none opacity-40')}
                  onClick={go(pagination.pageIndex + 1)}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>

      {bulkActions && selectedCount > 0 && (
        // the bulk-action bar: floats at the bottom of the table's view while rows are selected
        <div
          role="toolbar"
          aria-label="Bulk actions"
          data-slot="data-table-bulk-actions"
          className="sticky bottom-4 z-10 mx-auto flex w-fit max-w-full flex-wrap items-center gap-2 border border-border bg-popover p-2 text-popover-foreground shadow-lg duration-150 animate-in fade-in-0 slide-in-from-bottom-2"
        >
          <Button
            variant="outline"
            size="sm"
            className="border-dashed"
            onClick={clearSelection}
            aria-label={`Clear selection (${selectedCount} selected)`}
          >
            <span className="tabular-nums">{selectedCount.toLocaleString()} selected</span>
            <XIcon data-icon="inline-end" />
          </Button>
          <span aria-hidden className="mx-1 hidden h-6 w-px bg-border sm:block" />
          {bulkActions(
            selectedRows.map((r) => r.original),
            clearSelection,
          )}
        </div>
      )}
    </div>
  );
}
