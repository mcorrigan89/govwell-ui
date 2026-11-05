'use client';

import * as React from 'react';
import * as RechartsPrimitive from 'recharts';
import type { TooltipValueType } from 'recharts';

import { cn } from '@/lib/utils';

// Recharts on a square card with an Ash hairline. Name each series in a
// ChartConfig with a colour — var(--chart-1) … var(--chart-5), in that order,
// never cycled — and the container exposes it as --color-<key> for the marks.
// The series follow the mode: on white, Slate leads and Hope, Sky, Field and
// Concrete support it (the three brand colours are under 3:1 on white, so
// they never carry a chart alone); on Slate, Hope leads, then white, Sky,
// Field and Cement. Draw solid strokes and square marks. Text stays in text
// colours, in Light figures; only marks wear the series colour. Axes are
// muted, gridlines Ash, the crosshair the text colour. The tooltip is a
// square popover panel with the values in tabular figures. Inside a card it
// drops its own frame.

// Format: { THEME_NAME: CSS_SELECTOR }. The --chart-* tokens already switch
// with the colour mode, so a plain `color` is all most series need. A `theme`
// colour pair still works: `dark` applies under the explicit dark mode
// (data-mode="dark"); in "system" mode the light colour shows.
const THEMES = { light: '', dark: ':root[data-mode="dark"]' } as const;

const INITIAL_DIMENSION = { width: 320, height: 200 } as const;
type TooltipNameType = number | string;

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & ({ color?: string; theme?: never } | { color?: never; theme: Record<keyof typeof THEMES, string> })
>;

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error('useChart must be used within a <ChartContainer />');
  }

  return context;
}

function ChartContainer({
  id,
  className,
  children,
  config,
  initialDimension = INITIAL_DIMENSION,
  ...props
}: React.ComponentProps<'div'> & {
  config: ChartConfig;
  children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>['children'];
  initialDimension?: {
    width: number;
    height: number;
  };
}) {
  const uniqueId = React.useId();
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, '')}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn(
          "flex aspect-video justify-center border border-border bg-card p-4 text-xs font-light text-card-foreground tabular-nums in-data-[slot=card-content]:border-0 in-data-[slot=card-content]:bg-transparent in-data-[slot=card-content]:p-0 [&_.recharts-cartesian-axis-line]:stroke-border [&_.recharts-cartesian-axis-tick_line]:stroke-border [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border [&_.recharts-curve.recharts-tooltip-cursor]:stroke-foreground [&_.recharts-dot[stroke='#fff']]:stroke-card [&_.recharts-layer]:outline-hidden [&_.recharts-polar-angle-axis-tick_text]:fill-muted-foreground [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-accent [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-accent [&_.recharts-reference-line_[stroke='#ccc']]:stroke-foreground [&_.recharts-sector]:outline-hidden [&_.recharts-sector[stroke='#fff']]:stroke-card [&_.recharts-surface]:outline-hidden",
          className,
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer initialDimension={initialDimension}>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(([, config]) => config.theme ?? config.color);

  if (!colorConfig.length) {
    return null;
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color = itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ?? itemConfig.color;
    return color ? `  --color-${key}: ${color};` : null;
  })
  .join('\n')}
}
`,
          )
          .join('\n'),
      }}
    />
  );
};

const ChartTooltip = RechartsPrimitive.Tooltip;

function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = 'line',
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  labelClassName,
  formatter,
  color,
  nameKey,
  labelKey,
}: React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
  React.ComponentProps<'div'> & {
    hideLabel?: boolean;
    hideIndicator?: boolean;
    indicator?: 'line' | 'dot' | 'dashed';
    nameKey?: string;
    labelKey?: string;
  } & Omit<RechartsPrimitive.DefaultTooltipContentProps<TooltipValueType, TooltipNameType>, 'accessibilityLayer'>) {
  const { config } = useChart();

  const tooltipLabel = React.useMemo(() => {
    if (hideLabel || !payload?.length) {
      return null;
    }

    const [item] = payload;
    const key = `${labelKey ?? item?.dataKey ?? item?.name ?? 'value'}`;
    const itemConfig = getPayloadConfigFromPayload(config, item, key);
    const value = !labelKey && typeof label === 'string' ? (config[label]?.label ?? label) : itemConfig?.label;

    if (labelFormatter) {
      return <div className={cn('font-normal text-foreground', labelClassName)}>{labelFormatter(value, payload)}</div>;
    }

    if (!value) {
      return null;
    }

    return <div className={cn('font-normal text-foreground', labelClassName)}>{value}</div>;
  }, [label, labelFormatter, payload, hideLabel, labelClassName, config, labelKey]);

  if (!active || !payload?.length) {
    return null;
  }

  const nestLabel = payload.length === 1 && indicator !== 'dot';

  return (
    <div
      className={cn(
        'grid min-w-36 items-start gap-2 rounded-none border border-border bg-popover px-3 py-2.5 text-xs font-light text-popover-foreground shadow-lg',
        className,
      )}
    >
      {!nestLabel ? tooltipLabel : null}
      <div className="grid gap-1.5">
        {inConfigOrder(
          config,
          payload.filter((item) => item.type !== 'none'),
          (item) => `${nameKey ?? item.name ?? item.dataKey ?? 'value'}`,
        ).map((item, index) => {
          const key = `${nameKey ?? item.name ?? item.dataKey ?? 'value'}`;
          const itemConfig = getPayloadConfigFromPayload(config, item, key);
          const indicatorColor = color ?? item.payload?.fill ?? item.color;

          return (
            <div
              key={index}
              className={cn(
                'flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground',
                indicator === 'dot' && 'items-center',
              )}
            >
              {formatter && item?.value !== undefined && item.name ? (
                formatter(item.value, item.name, item, index, item.payload)
              ) : (
                <>
                  {itemConfig?.icon ? (
                    <itemConfig.icon />
                  ) : (
                    !hideIndicator && (
                      <div
                        className={cn('shrink-0 rounded-none border-(--color-border) bg-(--color-bg)', {
                          'h-2.5 w-2.5': indicator === 'dot',
                          'h-1 w-3 self-center': indicator === 'line',
                          'w-0 border-[1.5px] border-dashed bg-transparent': indicator === 'dashed',
                          'my-0.5': nestLabel && indicator === 'dashed',
                        })}
                        style={
                          {
                            '--color-bg': indicatorColor,
                            '--color-border': indicatorColor,
                          } as React.CSSProperties
                        }
                      />
                    )
                  )}
                  <div className={cn('flex flex-1 justify-between leading-none', nestLabel ? 'items-end' : 'items-center')}>
                    <div className="grid gap-1.5">
                      {nestLabel ? tooltipLabel : null}
                      <span className="text-muted-foreground">{itemConfig?.label ?? item.name}</span>
                    </div>
                    {item.value != null && (
                      <span className="font-normal text-foreground tabular-nums">
                        {typeof item.value === 'number' ? item.value.toLocaleString() : String(item.value)}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const ChartLegend = RechartsPrimitive.Legend;

function ChartLegendContent({
  className,
  hideIcon = false,
  payload,
  verticalAlign = 'bottom',
  nameKey,
  indicator = 'square',
}: React.ComponentProps<'div'> & {
  hideIcon?: boolean;
  nameKey?: string;
  /** mirror the mark: a square for bars and areas, a line for lines */
  indicator?: 'square' | 'line';
} & RechartsPrimitive.DefaultLegendContentProps) {
  const { config } = useChart();

  if (!payload?.length) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-4 text-xs font-light text-foreground',
        verticalAlign === 'top' ? 'pb-3' : 'pt-3',
        className,
      )}
    >
      {inConfigOrder(
        config,
        payload.filter((item) => item.type !== 'none'),
        (item) => `${nameKey ?? item.dataKey ?? 'value'}`,
      ).map((item, index) => {
        const key = `${nameKey ?? item.dataKey ?? 'value'}`;
        const itemConfig = getPayloadConfigFromPayload(config, item, key);

        return (
          <div key={index} className={cn('flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground')}>
            {itemConfig?.icon && !hideIcon ? (
              <itemConfig.icon />
            ) : (
              <div
                className={cn('shrink-0', indicator === 'line' ? 'h-1 w-3' : 'size-2.5')}
                style={{
                  backgroundColor: item.color,
                }}
              />
            )}
            {itemConfig?.label}
          </div>
        );
      })}
    </div>
  );
}

// Recharts sorts legend and tooltip rows by name; keep them in the order the
// config lists the series, so a series is always found in the same place.
function inConfigOrder<T>(config: ChartConfig, items: readonly T[], keyOf: (item: T) => string): T[] {
  const order = Object.keys(config);
  const rank = (item: T) => {
    const i = order.indexOf(keyOf(item));
    return i === -1 ? order.length : i;
  };
  return [...items].sort((a, b) => rank(a) - rank(b));
}

function getPayloadConfigFromPayload(config: ChartConfig, payload: unknown, key: string) {
  if (typeof payload !== 'object' || payload === null) {
    return undefined;
  }

  const payloadPayload =
    'payload' in payload && typeof payload.payload === 'object' && payload.payload !== null ? payload.payload : undefined;

  let configLabelKey: string = key;

  if (key in payload && typeof payload[key as keyof typeof payload] === 'string') {
    configLabelKey = payload[key as keyof typeof payload] as string;
  } else if (payloadPayload && key in payloadPayload && typeof payloadPayload[key as keyof typeof payloadPayload] === 'string') {
    configLabelKey = payloadPayload[key as keyof typeof payloadPayload] as string;
  }

  return configLabelKey in config ? config[configLabelKey] : config[key];
}

export { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, ChartStyle };
