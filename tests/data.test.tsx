import { useState } from 'react';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { DatePicker } from '@/components/ui/date-picker';
import { Progress, ProgressLabel, ProgressValue } from '@/components/ui/progress';
import { Toaster } from '@/components/ui/sonner';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// jsdom has no ResizeObserver or IntersectionObserver (recharts and Embla use
// them) and no matchMedia (Embla); nothing here needs real measurements.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
globalThis.IntersectionObserver ??= class {
  root = null;
  rootMargin = '';
  thresholds = [];
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
} as unknown as typeof IntersectionObserver;
window.matchMedia ??= (query: string) =>
  ({
    matches: false,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent: () => false,
  }) as MediaQueryList;

describe('Progress', () => {
  it('reports its value, labelled', () => {
    render(
      <Progress value={64}>
        <ProgressLabel>Application progress</ProgressLabel>
        <ProgressValue />
      </Progress>,
    );
    const bar = screen.getByRole('progressbar', { name: 'Application progress' });
    expect(bar).toHaveAttribute('aria-valuenow', '64');
    expect(screen.getByText('64%')).toBeInTheDocument();
  });

  it('is indeterminate when the length is unknown', () => {
    const { container } = render(
      <Progress value={null}>
        <ProgressLabel>Uploading plans</ProgressLabel>
      </Progress>,
    );
    expect(screen.getByRole('progressbar', { name: 'Uploading plans' })).not.toHaveAttribute('aria-valuenow');
    expect(container.querySelector('[data-slot=progress-indicator]')).toHaveAttribute('data-indeterminate');
  });
});

describe('Progress tones', () => {
  it('fills with Hope by default and a status colour by tone', () => {
    const { container } = render(
      <>
        <Progress value={40} />
        <Progress value={100} tone="ok" />
      </>,
    );
    const [plain, ok] = container.querySelectorAll('[data-slot=progress-indicator]');
    expect(plain).toHaveClass('bg-primary');
    expect(ok).toHaveClass('bg-ok');
    expect(container.querySelector('[data-slot=progress-track]')).toHaveClass('bg-muted');
  });
});

describe('Calendar', () => {
  function Single() {
    const [day, setDay] = useState<Date | undefined>();
    return (
      <>
        <Calendar mode="single" selected={day} onSelect={setDay} defaultMonth={new Date(2026, 10, 1)} />
        <p>Picked: {day ? day.getDate() : 'none'}</p>
      </>
    );
  }

  it('selects the day you click', async () => {
    render(<Single />);
    expect(screen.getByText('November 2026')).toBeInTheDocument();
    const grid = screen.getByRole('grid');
    const day = within(grid).getByRole('button', { name: /November 13th, 2026/ });
    await userEvent.click(day);
    expect(screen.getByText('Picked: 13')).toBeInTheDocument();
    // the grid re-renders on select, so look the day up again
    expect(within(screen.getByRole('grid')).getByRole('button', { name: /November 13th, 2026/ })).toHaveAttribute(
      'data-selected-single',
      'true',
    );
  });

  it('sits on a card with an Ash hairline', () => {
    const { container } = render(<Calendar mode="single" defaultMonth={new Date(2026, 10, 1)} />);
    expect(container.querySelector('[data-slot=calendar]')).toHaveClass('bg-card', 'border-border');
  });
});

describe('DatePicker', () => {
  function Example() {
    const [day, setDay] = useState<Date | undefined>();
    return (
      <DatePicker aria-label="Inspection date" value={day} onValueChange={setDay} calendar={{ defaultMonth: new Date(2026, 10, 1) }} />
    );
  }

  it('opens a calendar and shows the picked date', async () => {
    render(<Example />);
    const trigger = screen.getByRole('button', { name: 'Inspection date' });
    expect(trigger).toHaveTextContent('Pick a date');
    await userEvent.click(trigger);
    await userEvent.click(await screen.findByRole('button', { name: /November 20th, 2026/ }));
    expect(trigger).toHaveTextContent(
      new Date(2026, 10, 20).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }),
    );
    expect(trigger).not.toHaveAttribute('data-placeholder');
    expect(trigger).toHaveClass('h-12', 'border-input', 'bg-background');
  });
});

describe('Carousel', () => {
  // Embla measures with offsetLeft/offsetWidth, which jsdom leaves at 0: make
  // the viewport and each slide 300px wide, slides laid end to end.
  const WIDTH = 300;
  const saved: Record<string, PropertyDescriptor | undefined> = {};
  beforeEach(() => {
    for (const key of ['offsetWidth', 'offsetLeft', 'offsetHeight'] as const) {
      saved[key] = Object.getOwnPropertyDescriptor(HTMLElement.prototype, key);
    }
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get: () => WIDTH });
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get: () => 100 });
    Object.defineProperty(HTMLElement.prototype, 'offsetLeft', {
      configurable: true,
      get(this: HTMLElement) {
        if (this.dataset.slot !== 'carousel-item' || !this.parentElement) return 0;
        return [...this.parentElement.children].indexOf(this) * WIDTH;
      },
    });
  });
  afterEach(() => {
    for (const [key, descriptor] of Object.entries(saved)) {
      if (descriptor) Object.defineProperty(HTMLElement.prototype, key, descriptor);
    }
  });

  it('has labelled previous and next buttons that move the slides', async () => {
    render(
      <Carousel>
        <CarouselContent>
          {['Hillsborough', 'Lakeview', 'Marion County'].map((s) => (
            <CarouselItem key={s}>{s}</CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>,
    );
    expect(screen.getByRole('region')).toHaveAttribute('aria-roledescription', 'carousel');
    expect(screen.getAllByRole('group')).toHaveLength(3);
    const prev = screen.getByRole('button', { name: 'Previous slide' });
    const next = screen.getByRole('button', { name: 'Next slide' });
    // on the first slide only "next" goes anywhere
    expect(prev).toBeDisabled();
    expect(next).toBeEnabled();
    await userEvent.click(next);
    expect(prev).toBeEnabled();
    await userEvent.click(prev);
    expect(prev).toBeDisabled();
  });
});

describe('Chart', () => {
  const config = {
    building: { label: 'Building', color: 'var(--chart-1)' },
    trade: { label: 'Trade', color: 'var(--chart-2)' },
  } satisfies ChartConfig;

  // recharts measures its container once on mount; jsdom reports 0 × 0
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(DOMRect.fromRect({ width: 400, height: 200 }));
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders a card panel and publishes each series colour', () => {
    const { container } = render(
      <ChartContainer config={config} style={{ width: 400, height: 200 }}>
        <div />
      </ChartContainer>,
    );
    expect(container.querySelector('[data-slot=chart]')).toHaveClass('bg-card', 'border-border');
    const css = container.querySelector('style')!.textContent!;
    expect(css).toContain('--color-building: var(--chart-1);');
    expect(css).toContain('--color-trade: var(--chart-2);');
  });

  it('tooltip lists every series value at the point, named from the config', () => {
    render(
      <ChartContainer config={config}>
        <ChartTooltipContent
          active
          label="Oct"
          payload={[
            { dataKey: 'building', name: 'building', value: 620, color: 'var(--chart-1)', payload: {}, graphicalItemId: 'building' },
            { dataKey: 'trade', name: 'trade', value: 1545, color: 'var(--chart-2)', payload: {}, graphicalItemId: 'trade' },
          ]}
        />
      </ChartContainer>,
    );
    expect(screen.getByText('Oct')).toBeInTheDocument();
    expect(screen.getByText('Building')).toBeInTheDocument();
    expect(screen.getByText('620')).toBeInTheDocument();
    expect(screen.getByText('1,545')).toBeInTheDocument();
  });
});

describe('Toaster', () => {
  it('shows a toast with its title and description', async () => {
    render(<Toaster />);
    act(() => {
      toast.warning('Corrections requested', { description: 'Building review needs a revised site plan.' });
    });
    expect(await screen.findByText('Corrections requested')).toBeInTheDocument();
    expect(screen.getByText('Building review needs a revised site plan.')).toBeInTheDocument();
    expect(screen.getByText('Corrections requested').closest('[data-sonner-toast]')).toHaveAttribute('data-type', 'warning');
  });
});

describe('Alert', () => {
  it('announces its title and details, and carries its status', () => {
    render(
      <Alert variant="destructive">
        <AlertTitle>Payment failed</AlertTitle>
        <AlertDescription>The card was declined.</AlertDescription>
      </Alert>,
    );
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('data-variant', 'destructive');
    expect(alert).toHaveClass('bg-card', 'border-l-destructive');
    expect(alert).toHaveTextContent('Payment failedThe card was declined.');
  });
});

describe('Table', () => {
  it('is a captioned table with column headers on a Base row', () => {
    render(
      <Table>
        <TableCaption>Fees</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Fee</TableHead>
            <TableHead>Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Plan review</TableCell>
            <TableCell>$812.50</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const table = screen.getByRole('table', { name: 'Fees' });
    expect(table).toHaveClass('tabular-nums');
    expect(screen.getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['Fee', 'Amount']);
    expect(screen.getByRole('columnheader', { name: 'Fee' })).toHaveClass('font-normal');
    expect(screen.getByRole('columnheader', { name: 'Fee' }).closest('thead')).toHaveClass('bg-muted');
    expect(screen.getByRole('cell', { name: 'Plan review' })).toBeInTheDocument();
  });
});
