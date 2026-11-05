import * as React from 'react';
import { RotateCw, TriangleAlert } from 'lucide-react';

import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Empty, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { Spinner } from '@/components/ui/spinner';
import { TableCell, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

// Loading, failed and empty, said the same way on every page and never
// confused with each other: a list that failed to load doesn't read as "no
// results", and a page still loading doesn't read as empty. Loading is the
// dotted spinner in muted type; a failure is a red-railed alert (or, in a
// table row, a red tile and the reason) with Try again; empty is the dashed
// Empty frame, or a muted line in a table.
//
// The state is a plain object, so a TanStack Query result fits as it is:
//   <QueryState query={permits} what="the permits">{() => <PermitList … />}</QueryState>

type QueryStatus = 'pending' | 'error' | 'success';

interface QueryLike {
  status: QueryStatus;
  error?: unknown;
  refetch?: (() => unknown) | undefined;
}

type QueryStateSource = {
  /** a query-shaped object: `{ status, error?, refetch? }` (a TanStack Query result fits) */
  query?: QueryLike;
  /** or the state as separate props; `query` wins when both are given */
  status?: QueryStatus;
  error?: unknown;
  /** what Try again calls; without it there is no Try again */
  onRetry?: (() => unknown) | undefined;
};

function resolveSource({ query, status, error, onRetry }: QueryStateSource) {
  return {
    status: query?.status ?? status ?? 'success',
    error: query ? query.error : error,
    retry: query?.refetch ?? onRetry,
  };
}

/** a readable sentence from whatever was thrown */
function errorMessage(error: unknown): string | null {
  if (error == null) return null;
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message || null;
  if (typeof error === 'object' && 'message' in error && typeof error.message === 'string') return error.message;
  return null;
}

function QueryLoading({ label = 'Loading…', className, ...props }: React.ComponentProps<'p'> & { label?: React.ReactNode }) {
  return (
    <p
      data-slot="query-loading"
      role="status"
      className={cn('flex items-center gap-2 text-sm font-light text-muted-foreground', className)}
      {...props}
    >
      {/* the paragraph is the live region and carries the words; the spinner is decoration here */}
      <Spinner aria-hidden role="presentation" aria-label={undefined} />
      {label}
    </p>
  );
}

type QueryErrorProps = {
  error?: unknown;
  /** what failed to load, e.g. "the permits": "Couldn't load the permits." */
  what?: string;
  onRetry?: (() => unknown) | undefined;
  /** `panel` (an alert, for a page) or `inline` (one line, for a table cell or a card) */
  variant?: 'panel' | 'inline';
  /** turn the thrown error into words; defaults to its message */
  formatError?: (error: unknown) => React.ReactNode;
  className?: string;
};

function QueryError({ error, what = 'this', onRetry, variant = 'panel', formatError, className }: QueryErrorProps) {
  const reason = formatError ? formatError(error) : errorMessage(error);
  const retry = onRetry && (
    <Button size="sm" variant="outline" onClick={() => void onRetry()}>
      <RotateCw data-icon="inline-start" /> Try again
    </Button>
  );
  if (variant === 'inline') {
    return (
      <div data-slot="query-error" role="alert" className={cn('flex flex-wrap items-center gap-3 text-sm', className)}>
        <span aria-hidden className="flex size-6 shrink-0 items-center justify-center bg-destructive text-destructive-foreground">
          <TriangleAlert className="size-3.5" />
        </span>
        <span>
          Couldn’t load {what}.{reason ? <span className="text-muted-foreground"> {reason}</span> : null}
        </span>
        {retry}
      </div>
    );
  }
  return (
    <Alert data-slot="query-error" variant="destructive" className={cn(onRetry && 'pr-40', className)}>
      <TriangleAlert />
      <AlertTitle>Couldn’t load {what}.</AlertTitle>
      {reason ? <AlertDescription className="text-muted-foreground">{reason}</AlertDescription> : null}
      {retry && <AlertAction>{retry}</AlertAction>}
    </Alert>
  );
}

type QueryStateProps = QueryStateSource & {
  what?: string;
  /** true when the query succeeded with nothing in it */
  isEmpty?: boolean;
  /** what an empty result says; a string becomes an Empty frame with that title */
  empty?: React.ReactNode;
  loadingLabel?: React.ReactNode;
  formatError?: (error: unknown) => React.ReactNode;
  /** the page, rendered only once the query has succeeded (a function, so data is read only then) */
  children: React.ReactNode | (() => React.ReactNode);
};

/** A page's main query: loading, or failed, or empty, or the page. */
function QueryState({ what, isEmpty = false, empty, loadingLabel, formatError, children, ...source }: QueryStateProps) {
  const { status, error, retry } = resolveSource(source);
  if (status === 'pending') return <QueryLoading label={loadingLabel} className="py-8" />;
  if (status === 'error') return <QueryError error={error} what={what} onRetry={retry} formatError={formatError} />;
  if (isEmpty && empty !== undefined) {
    return typeof empty === 'string' ? (
      <Empty data-slot="query-empty">
        <EmptyHeader>
          <EmptyTitle>{empty}</EmptyTitle>
        </EmptyHeader>
      </Empty>
    ) : (
      <>{empty}</>
    );
  }
  return <>{typeof children === 'function' ? children() : children}</>;
}

type QueryTableStateProps = QueryStateSource & {
  /** how many columns the one row spans */
  colSpan: number;
  isEmpty: boolean;
  /** what an empty list says, e.g. "No permits match." */
  empty: React.ReactNode;
  what?: string;
  loadingLabel?: React.ReactNode;
  formatError?: (error: unknown) => React.ReactNode;
  className?: string;
};

/** The one row a table body shows instead of rows: loading, failed or empty. Renders nothing when there are rows. */
function QueryTableState({ colSpan, isEmpty, empty, what, loadingLabel, formatError, className, ...source }: QueryTableStateProps) {
  const { status, error, retry } = resolveSource(source);
  const content =
    status === 'pending' ? (
      <QueryLoading label={loadingLabel} className="justify-center" />
    ) : status === 'error' ? (
      <QueryError variant="inline" error={error} what={what} onRetry={retry} formatError={formatError} className="justify-center" />
    ) : isEmpty ? (
      <span data-slot="query-empty" className="text-muted-foreground">
        {empty}
      </span>
    ) : null;
  if (!content) return null;
  return (
    <TableRow data-slot="query-table-state" data-status={status} className={cn('hover:bg-transparent', className)}>
      <TableCell colSpan={colSpan} className="py-10 text-center whitespace-normal">
        {content}
      </TableCell>
    </TableRow>
  );
}

export { QueryError, QueryLoading, QueryState, QueryTableState, type QueryLike, type QueryStatus };
