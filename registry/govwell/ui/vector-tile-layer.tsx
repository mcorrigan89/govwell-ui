'use client';

import * as React from 'react';
import {
  LineSymbolizer,
  PolygonSymbolizer,
  leafletLayer,
  type Feature,
  type Filter,
  type PaintRule,
  type PaintSymbolizer,
} from 'protomaps-leaflet';
import { useMap } from 'react-leaflet';

import type { MapTone } from '@/components/ui/map';

// A server's vector tiles drawn on canvas, a tile at a time, inside a <Map>:
// a town's whole parcel fabric, zoning or sewer lines without ever holding
// them in the browser at once. One layer draws several SOURCES onto one
// canvas per tile (a layer per source would be a canvas per source per tile:
// at a city's zoom, enough to crash the tab). It's rebuilt when its sources,
// zoom range, pane or `paintKey` change; canvas tiles keep what they drew, so
// change `paintKey` when a paint rule's colour changes.
//
// Canvas can't read CSS, so the rule helpers below look the theme's tokens
// up as each tile is drawn (Slate, Hope, Sky, Field and the status colours).
//
//   <Map center={[44.4759, -73.2121]} zoom={16}>
//     <VectorTileLayer
//       sources={{ parcels: '/api/tiles/parcels/{z}/{x}/{y}.mvt' }}
//       paintRules={[polygonRule({ dataSource: 'parcels', dataLayer: 'parcels', tone: 'default', opacity: 0.05 })]}
//     />
//   </Map>

type VectorTileLayerHandle = {
  /** the features under a point: each with its source and the layer in the tile it came from */
  featuresAt(lat: number, lng: number, brushPixels?: number): { source: string; layer: string; feature: Feature }[];
};

type VectorTileLayerProps = {
  /** each source's tile URL template, by name (paint rules name it as their dataSource) */
  sources: Record<string, string>;
  paintRules: PaintRule[];
  /** the zoom the layer starts at: no tiles are asked for below it */
  minZoom?: number;
  /** the deepest zoom tiles are fetched at; past it they're drawn larger */
  maxDataZoom?: number;
  /** the Leaflet pane to draw in */
  pane?: string;
  /** what changes the drawing without changing a URL (a colour, a recolour) */
  paintKey?: string;
  /** credit for the data, as HTML */
  attribution?: string;
  ref?: React.Ref<VectorTileLayerHandle>;
};

function VectorTileLayer({
  sources,
  paintRules,
  minZoom = 0,
  maxDataZoom = 17,
  pane = 'overlayPane',
  paintKey = '',
  attribution,
  ref,
}: VectorTileLayerProps) {
  const map = useMap();
  const layer = React.useRef<ReturnType<typeof leafletLayer> | null>(null);
  // the paint rules as of the last build: rebuilt on paintKey, not identity
  const rules = React.useRef(paintRules);
  React.useEffect(() => {
    rules.current = paintRules;
  });
  const sourceKey = JSON.stringify(sources);

  React.useEffect(() => {
    const created = leafletLayer({
      // the server's tiles are the display zoom's own (protomaps-leaflet would
      // otherwise fetch a level up and draw it at 512 pixels: below a layer's
      // starting zoom, that's empty)
      sources: Object.fromEntries(
        Object.entries(JSON.parse(sourceKey) as Record<string, string>).map(([name, url]) => [name, { url, levelDiff: 0, maxDataZoom }]),
      ),
      paintRules: rules.current,
      labelRules: [],
      minZoom,
      pane,
      attribution,
    } as Parameters<typeof leafletLayer>[0]);
    created.addTo(map);
    layer.current = created;
    return () => {
      created.remove();
      if (layer.current === created) layer.current = null;
    };
  }, [map, sourceKey, minZoom, maxDataZoom, pane, paintKey, attribution]);

  React.useImperativeHandle(
    ref,
    () => ({
      featuresAt(lat, lng, brushPixels = 4) {
        const found = layer.current?.queryTileFeaturesDebug(lng, lat, brushPixels);
        if (!found) return [];
        return [...found.entries()].flatMap(([source, picked]) => picked.map((p) => ({ source, layer: p.layerName, feature: p.feature })));
      },
    }),
    [],
  );
  return null;
}

// Each tone's token, with the light theme's value for when there's no page
// (a test, a worker).
const TONE_TOKEN: Record<MapTone, [token: string, fallback: string]> = {
  default: ['slate', '#202020'],
  primary: ['hope', '#feaf0e'],
  ok: ['ok', '#39c25e'],
  info: ['info', '#41aaeb'],
  warning: ['warning', '#dc6803'],
  destructive: ['destructive', '#b42318'],
  muted: ['concrete', '#7c7c7c'],
};

/** a theme colour as canvas needs it: the token's value on the page, or the fallback */
function themeColor(token: string, fallback: string) {
  if (typeof document === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(`--${token}`).trim();
  return value || fallback;
}

/** a tone's colour, looked up when a tile is drawn */
function toneColor(tone: MapTone) {
  const [token, fallback] = TONE_TOKEN[tone];
  return () => themeColor(token, fallback);
}

type RuleBase = {
  dataSource?: string;
  dataLayer: string;
  tone?: MapTone;
  filter?: Filter;
  minzoom?: number;
  maxzoom?: number;
  id?: string;
};

/**
 * filled areas (parcels, zones) in a tone, outlined in the same tone (or
 * `strokeTone`). The outline is drawn separately at `strokeOpacity`: the
 * polygon symbolizer applies its opacity to fill and outline alike, so a
 * light fill would otherwise leave outlines nearly invisible on a busy map.
 */
function polygonRule({
  tone = 'default',
  strokeTone,
  opacity = 0.15,
  strokeOpacity = 1,
  width = 1,
  ...rule
}: RuleBase & { strokeTone?: MapTone; opacity?: number; strokeOpacity?: number; width?: number }): PaintRule {
  const fill = new PolygonSymbolizer({ fill: toneColor(tone), opacity, width: 0 });
  const outline = width > 0 ? new LineSymbolizer({ color: toneColor(strokeTone ?? tone), width, opacity: strokeOpacity }) : null;
  return { ...rule, symbolizer: outlined(fill, outline) };
}

// draws a fill and then its outline, each with its own style (set per
// feature, since the two share the canvas's alpha and colours)
function outlined(fill: PaintSymbolizer, outline: PaintSymbolizer | null): PaintSymbolizer {
  return {
    draw(ctx, geom, z, feature) {
      fill.before?.(ctx, z);
      fill.draw(ctx, geom, z, feature);
      if (!outline) return;
      outline.before?.(ctx, z);
      outline.draw(ctx, geom, z, feature);
    },
  };
}

/** lines (centrelines, pipes, boundaries) in a tone */
function lineRule({
  tone = 'default',
  width = 2,
  opacity = 1,
  dash,
  ...rule
}: RuleBase & { width?: number; opacity?: number; dash?: number[] }): PaintRule {
  return { ...rule, symbolizer: new LineSymbolizer({ color: toneColor(tone), width, opacity, dash }) };
}

/** draws each point as a square in the tone with a white edge, like the map's markers */
class SquareSymbolizer implements PaintSymbolizer {
  fill: () => string;
  size: number;
  constructor(fill: () => string, size: number) {
    this.fill = fill;
    this.size = size;
  }
  draw(ctx: CanvasRenderingContext2D, geom: { x: number; y: number }[][]) {
    const s = this.size;
    ctx.fillStyle = this.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    for (const points of geom) {
      for (const p of points) {
        ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
        ctx.strokeRect(p.x - s / 2, p.y - s / 2, s, s);
      }
    }
  }
}

/** points (hydrants, signs) as squares in a tone with a white edge */
function pointRule({ tone = 'default', size = 8, ...rule }: RuleBase & { size?: number }): PaintRule {
  return { ...rule, symbolizer: new SquareSymbolizer(toneColor(tone), size) };
}

export { VectorTileLayer, lineRule, pointRule, polygonRule, themeColor };
export type { VectorTileLayerHandle, VectorTileLayerProps };
