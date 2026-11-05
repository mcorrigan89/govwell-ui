'use client';

import * as React from 'react';
import { divIcon, marker as leafletMarker, type DivIcon, type LatLngTuple, type Map as LeafletMap, type PathOptions } from 'leaflet';
import {
  GeoJSON,
  MapContainer,
  Marker,
  Polygon,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
  type GeoJSONProps,
  type MapContainerProps,
  type MarkerProps,
  type PolygonProps,
  type PolylineProps,
  type PopupProps,
  type TileLayerProps,
  type TooltipProps,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import { cn } from '@/lib/utils';

// A Leaflet map in GovWell's look: a square map behind an Ash hairline, with
// square zoom buttons drawn like GovWell's outline buttons, the tile credit in
// small muted type, and pin labels and popups set as the popover panel.
// Leaflet's own rounded, shadowed chrome is overridden by CSS scoped to the
// map (its stylesheet is unlayered, so the overrides are `!important`).
// Markers are squares like the flag mark's: Slate with a white edge, or Hope
// or a status colour, with a Slate ring when selected. Shapes take their
// stroke and fill from the theme's tokens.
//
// Leaflet touches `window` when imported: in a server-rendered app, lazy-load
// the component that uses the map behind <ClientOnly> (see client-only).
//
//   <Map center={[44.4759, -73.2121]} zoom={16} label="Inspections">
//     <MapMarker position={[44.4762, -73.2125]} tone="warning" label="Re-inspection">
//       <MapPopup>BP-2026-0418 · Framing</MapPopup>
//     </MapMarker>
//   </Map>

/** a point as Leaflet takes it: [latitude, longitude] */
type LatLng = [number, number];

type MapTone = 'default' | 'primary' | 'ok' | 'info' | 'warning' | 'destructive' | 'muted';

/** OpenStreetMap's standard tiles */
const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
/** the credit OpenStreetMap's tile policy requires wherever its tiles are shown */
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// Leaflet's chrome, restyled. Tiles are always light, so the controls use the
// page's own surfaces and read in either colour mode.
const mapChrome = [
  // zoom: square outline buttons stacked on a shared edge, no rounded bar
  '[&_.leaflet-bar]:rounded-none! [&_.leaflet-bar]:border-0! [&_.leaflet-bar]:shadow-none!',
  '[&_.leaflet-bar_a]:flex! [&_.leaflet-bar_a]:size-10! [&_.leaflet-bar_a]:items-center [&_.leaflet-bar_a]:justify-center [&_.leaflet-bar_a]:rounded-none! [&_.leaflet-bar_a]:border! [&_.leaflet-bar_a]:border-solid! [&_.leaflet-bar_a]:border-foreground! [&_.leaflet-bar_a]:bg-background! [&_.leaflet-bar_a]:indent-0! [&_.leaflet-bar_a]:font-sans! [&_.leaflet-bar_a]:text-xl! [&_.leaflet-bar_a]:leading-none! [&_.leaflet-bar_a]:font-light! [&_.leaflet-bar_a]:text-foreground! [&_.leaflet-bar_a]:no-underline! [&_.leaflet-bar_a]:transition-colors [&_.leaflet-bar_a]:outline-none',
  '[&_.leaflet-bar_a+a]:-mt-px [&_.leaflet-bar_a]:hover:bg-accent! [&_.leaflet-bar_a]:focus-visible:outline-2 [&_.leaflet-bar_a]:focus-visible:outline-offset-2 [&_.leaflet-bar_a]:focus-visible:outline-solid [&_.leaflet-bar_a]:focus-visible:outline-ring',
  '[&_.leaflet-bar_a.leaflet-disabled]:bg-background! [&_.leaflet-bar_a.leaflet-disabled]:text-foreground! [&_.leaflet-bar_a.leaflet-disabled]:opacity-40',
  // the tile credit: small muted type on a pale strip
  '[&_.leaflet-control-attribution]:bg-background/85! [&_.leaflet-control-attribution]:px-1.5! [&_.leaflet-control-attribution]:py-0.5 [&_.leaflet-control-attribution]:text-xs! [&_.leaflet-control-attribution]:font-light [&_.leaflet-control-attribution]:text-muted-foreground!',
  '[&_.leaflet-control-attribution_a]:text-muted-foreground! [&_.leaflet-control-attribution_a]:underline! [&_.leaflet-control-attribution_a]:underline-offset-2 [&_.leaflet-control-attribution_a]:hover:text-foreground!',
  // popups: the popover panel, square, with its tip in the same colours
  '[&_.leaflet-popup-content-wrapper]:rounded-none! [&_.leaflet-popup-content-wrapper]:border [&_.leaflet-popup-content-wrapper]:border-border [&_.leaflet-popup-content-wrapper]:bg-popover! [&_.leaflet-popup-content-wrapper]:p-0! [&_.leaflet-popup-content-wrapper]:text-popover-foreground! [&_.leaflet-popup-content-wrapper]:shadow-lg!',
  '[&_.leaflet-popup-content]:m-0! [&_.leaflet-popup-content]:py-3! [&_.leaflet-popup-content]:pr-9! [&_.leaflet-popup-content]:pl-4! [&_.leaflet-popup-content]:text-sm! [&_.leaflet-popup-content]:leading-normal! [&_.leaflet-popup-content]:font-light',
  '[&_.leaflet-popup-tip]:border-r [&_.leaflet-popup-tip]:border-b [&_.leaflet-popup-tip]:border-border [&_.leaflet-popup-tip]:bg-popover! [&_.leaflet-popup-tip]:shadow-none!',
  '[&_.leaflet-popup-close-button]:text-muted-foreground! [&_.leaflet-popup-close-button]:hover:text-foreground!',
  // pin labels (tooltips): the popover panel without Leaflet's arrow
  '[&_.leaflet-tooltip]:rounded-none! [&_.leaflet-tooltip]:border-border! [&_.leaflet-tooltip]:bg-popover! [&_.leaflet-tooltip]:px-3! [&_.leaflet-tooltip]:py-1.5! [&_.leaflet-tooltip]:font-sans [&_.leaflet-tooltip]:text-sm! [&_.leaflet-tooltip]:font-light [&_.leaflet-tooltip]:text-popover-foreground! [&_.leaflet-tooltip]:shadow-lg! [&_.leaflet-tooltip]:before:hidden!',
  // markers are focusable buttons: the GovWell focus ring
  '[&_.leaflet-marker-icon]:outline-none [&_.leaflet-marker-icon]:focus-visible:outline-2 [&_.leaflet-marker-icon]:focus-visible:outline-offset-2 [&_.leaflet-marker-icon]:focus-visible:outline-solid [&_.leaflet-marker-icon]:focus-visible:outline-ring',
].join(' ');

type MapProps = Omit<MapContainerProps, 'children' | 'className' | 'style' | 'placeholder' | 'id'> & {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  /** false: a still picture of the place (no dragging, zooming or zoom buttons) */
  interactive?: boolean;
  /** false to leave the default tiles out (draw your own <MapTiles> or a vector layer) */
  tiles?: boolean;
  /** the tile URL template; defaults to OpenStreetMap's */
  tileUrl?: string;
  /** the tile credit, as HTML; defaults to OpenStreetMap's */
  attribution?: string;
  /** an accessible name for the map, e.g. "Parcel 042-118" */
  label?: string;
  /** drawn over the map, outside Leaflet (a link, a legend); position it yourself */
  overlay?: React.ReactNode;
  /** the Leaflet map, once it's made */
  mapRef?: React.Ref<LeafletMap>;
  'data-slot'?: string;
};

// Leaflet reads its options once, when the map is made: a centre that arrives
// later is followed with <Recenter>, new bounds by remounting (a `key`).
function Map({
  className,
  style,
  children,
  interactive = true,
  tiles = true,
  tileUrl = OSM_TILE_URL,
  attribution = OSM_ATTRIBUTION,
  label,
  overlay,
  mapRef,
  'data-slot': slot = 'map',
  // the page scrolls past a map; zoom with the buttons or a pinch
  scrollWheelZoom = false,
  ...props
}: MapProps) {
  const still = interactive
    ? {}
    : { dragging: false, touchZoom: false, doubleClickZoom: false, boxZoom: false, keyboard: false, zoomControl: false };
  return (
    <div
      data-slot={slot}
      data-interactive={interactive ? '' : undefined}
      role={label ? 'region' : undefined}
      aria-label={label}
      className={cn('relative isolate h-80 w-full overflow-hidden rounded-none border border-border bg-muted', mapChrome, className)}
      style={style}
    >
      <MapContainer
        ref={mapRef}
        className="size-full bg-muted! font-sans! text-sm! outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring"
        scrollWheelZoom={interactive ? scrollWheelZoom : false}
        {...still}
        {...props}
      >
        {tiles && <MapTiles url={tileUrl} attribution={attribution} />}
        {children}
      </MapContainer>
      {overlay && (
        <div data-slot="map-overlay" className="pointer-events-none absolute inset-0 z-[1000] *:pointer-events-auto">
          {overlay}
        </div>
      )}
    </div>
  );
}

/** a raster tile layer; OpenStreetMap's, with its credit, unless told otherwise */
function MapTiles({ url = OSM_TILE_URL, attribution = OSM_ATTRIBUTION, ...props }: Partial<TileLayerProps>) {
  return <TileLayer url={url} attribution={attribution} {...props} />;
}

/** Leaflet takes its centre once: follow it when it arrives (or changes) later */
function Recenter({ center, zoom }: { center: LatLng | null | undefined; zoom?: number }) {
  const map = useMap();
  const lat = center?.[0];
  const lng = center?.[1];
  React.useEffect(() => {
    if (lat == null || lng == null) return;
    map.setView([lat, lng], zoom ?? map.getZoom());
  }, [map, lat, lng, zoom]);
  return null;
}

/** calls back with the point clicked on the map */
function MapClick({ onClick }: { onClick: (point: LatLng) => void }) {
  useMapEvents({ click: (e) => onClick([e.latlng.lat, e.latlng.lng]) });
  return null;
}

type MapView = {
  /** what's in view, [west, south, east, north], rounded so a nudge isn't a new query */
  bbox: [number, number, number, number];
  zoom: number;
};

const round4 = (n: number) => Math.round(n * 1e4) / 1e4;

/** reports what's in view once at the start and each time the map settles after a move */
function MapViewChange({ onChange }: { onChange: (view: MapView) => void }) {
  const map = useMap();
  const latest = React.useRef(onChange);
  React.useEffect(() => {
    latest.current = onChange;
  });
  const report = React.useCallback(() => {
    const b = map.getBounds();
    latest.current({
      bbox: [round4(b.getWest()), round4(b.getSouth()), round4(b.getEast()), round4(b.getNorth())],
      zoom: map.getZoom(),
    });
  }, [map]);
  useMapEvents({ moveend: report });
  React.useEffect(report, [report]);
  return null;
}

// Marker fills, written out in full so Tailwind sees each class.
const MARKER_FILL: Record<MapTone, string> = {
  default: 'bg-slate',
  primary: 'bg-hope',
  ok: 'bg-ok',
  info: 'bg-info',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
  muted: 'bg-concrete',
};

const STROKE: Record<MapTone, string> = {
  default: 'stroke-slate',
  primary: 'stroke-hope',
  ok: 'stroke-ok',
  info: 'stroke-info',
  warning: 'stroke-warning',
  destructive: 'stroke-destructive',
  muted: 'stroke-concrete',
};

const FILL: Record<MapTone, string> = {
  default: 'fill-slate',
  primary: 'fill-hope',
  ok: 'fill-ok',
  info: 'fill-info',
  warning: 'fill-warning',
  destructive: 'fill-destructive',
  muted: 'fill-concrete',
};

/**
 * A square marker icon: the tone's fill inside a white edge and a Slate
 * hairline (so it reads on pale and dark tiles alike); larger, with a Slate
 * ring, when selected.
 */
function markerIcon({ tone = 'default', selected = false }: { tone?: MapTone; selected?: boolean } = {}): DivIcon {
  const size = selected ? 20 : 14;
  return divIcon({
    // no `leaflet-div-icon` (a white box with a grey border)
    className: '',
    iconSize: [size, size],
    tooltipAnchor: [0, -size / 2 - 2],
    popupAnchor: [0, -size / 2 - 2],
    html: `<span data-slot="map-marker-mark" data-tone="${tone}"${selected ? ' data-selected=""' : ''} class="${cn(
      'block size-full border-2 border-white',
      MARKER_FILL[tone],
      selected ? 'outline-2 outline-offset-1 outline-solid outline-slate' : 'outline-1 outline-solid outline-slate/60',
    )}"></span>`,
  });
}

type MapMarkerProps = Omit<MarkerProps, 'icon' | 'position'> & {
  position: LatLng;
  tone?: MapTone;
  selected?: boolean;
  /** the marker's accessible name (Leaflet makes markers focusable buttons) */
  label?: string;
};

function MapMarker({ position, tone = 'default', selected = false, label, title, zIndexOffset, ...props }: MapMarkerProps) {
  const icon = React.useMemo(() => markerIcon({ tone, selected }), [tone, selected]);
  return (
    <Marker
      position={position}
      icon={icon}
      title={label ?? title}
      alt={label ?? title}
      zIndexOffset={zIndexOffset ?? (selected ? 1000 : 0)}
      {...props}
    />
  );
}

/** a pin label: the popover panel, above the marker or shape; `permanent` keeps it shown */
function MapTooltip({ direction = 'top', ...props }: TooltipProps) {
  return <Tooltip direction={direction} {...props} />;
}

/** a popup opened by clicking a marker or shape, set as the popover panel */
function MapPopup(props: PopupProps) {
  return <Popup {...props} />;
}

type ShapeStyle = {
  /** the stroke colour (and the fill's, unless fillTone says otherwise) */
  tone?: MapTone;
  /** a different fill, e.g. Hope inside a Slate outline */
  fillTone?: MapTone;
  /** a dashed outline: drafts, retired areas */
  dashed?: boolean;
};

// Shapes are SVG paths; a class on the path beats the colour Leaflet writes
// as an attribute, so the colours are the theme's own. Leaflet only reads a
// path's class when it's added, so a change of tone remounts it.
function shapeOptions(
  { tone = 'default', fillTone, dashed }: ShapeStyle,
  base: PathOptions,
  pathOptions: PathOptions | undefined,
  fill: boolean,
): PathOptions {
  return {
    ...base,
    ...(dashed ? { dashArray: '6 4' } : {}),
    ...pathOptions,
    className: cn(STROKE[tone], fill ? FILL[fillTone ?? tone] : 'fill-none', pathOptions?.className),
  };
}

function MapPolygon({ tone, fillTone, dashed, pathOptions, ...props }: PolygonProps & ShapeStyle) {
  return (
    <Polygon
      key={`${tone}-${fillTone}`}
      pathOptions={shapeOptions({ tone, fillTone, dashed }, { weight: 2, fillOpacity: 0.2 }, pathOptions, true)}
      {...props}
    />
  );
}

function MapPolyline({ tone, dashed, pathOptions, ...props }: PolylineProps & Omit<ShapeStyle, 'fillTone'>) {
  return <Polyline key={tone} pathOptions={shapeOptions({ tone, dashed }, { weight: 3 }, pathOptions, false)} {...props} />;
}

/** GeoJSON shapes in a tone; points become square markers. New data needs a new `key`. */
function MapGeoJSON({ tone = 'default', fillTone, dashed, ...props }: Omit<GeoJSONProps, 'style'> & ShapeStyle) {
  return (
    <GeoJSON
      key={`${tone}-${fillTone}`}
      style={(feature) => {
        // lines are never filled (the fill class would close them)
        const line = (feature?.geometry?.type ?? '').endsWith('LineString');
        return shapeOptions({ tone, fillTone, dashed }, line ? { weight: 3 } : { weight: 2, fillOpacity: 0.2 }, undefined, !line);
      }}
      pointToLayer={(_, latlng) => leafletMarker(latlng, { icon: markerIcon({ tone }) })}
      {...props}
    />
  );
}

export {
  Map,
  MapClick,
  MapGeoJSON,
  MapMarker,
  MapPolygon,
  MapPolyline,
  MapPopup,
  MapTiles,
  MapTooltip,
  MapViewChange,
  OSM_ATTRIBUTION,
  OSM_TILE_URL,
  Recenter,
  markerIcon,
};
export type { LatLng, LatLngTuple, MapProps, MapMarkerProps, MapTone, MapView };
