'use client';

import * as React from 'react';

import { Map, MapMarker, MapPolygon, type LatLng, type MapProps } from '@/components/ui/map';
import { cn } from '@/lib/utils';

// A record's place, not just its address text: a small, still map with the
// parcel outlined (Hope inside a Slate line, as the brand pairs them) and the
// address point marked with a Slate square. It frames the parcel with a
// little room around it, or the point on its own. Not interactive unless
// asked; `action` puts a link ("Open map") in a small panel in the corner.
//
//   <MiniMap parcel={parcel.geometry} point={[44.4759, -73.2121]}
//     action={<Link href="/parcels/042-118/map">Open map</Link>} />

/** a parcel's outline, as GeoJSON geometry ([longitude, latitude] pairs) */
type ParcelGeometry = { type: 'Polygon'; coordinates: number[][][] } | { type: 'MultiPolygon'; coordinates: number[][][][] };

const flip = (c: number[]): LatLng => [c[1]!, c[0]!];

/** GeoJSON's [lng, lat] rings as Leaflet's [lat, lng] positions */
function parcelPositions(geometry: ParcelGeometry): LatLng[][] | LatLng[][][] {
  return geometry.type === 'Polygon'
    ? geometry.coordinates.map((ring) => ring.map(flip))
    : geometry.coordinates.map((polygon) => polygon.map((ring) => ring.map(flip)));
}

/** the corners [[south, west], [north, east]] around a parcel and a point, or null when there's neither */
function placeBounds(geometry?: ParcelGeometry | null, point?: LatLng | null): [LatLng, LatLng] | null {
  const points: LatLng[] = [];
  if (geometry) {
    const rings = geometry.type === 'Polygon' ? geometry.coordinates : geometry.coordinates.flat();
    for (const ring of rings) for (const c of ring) points.push(flip(c));
  }
  if (point) points.push(point);
  if (points.length === 0) return null;
  const lats = points.map((p) => p[0]);
  const lngs = points.map((p) => p[1]);
  return [
    [Math.min(...lats), Math.min(...lngs)],
    [Math.max(...lats), Math.max(...lngs)],
  ];
}

type MiniMapProps = Omit<MapProps, 'children' | 'center' | 'bounds' | 'overlay'> & {
  /** the parcel's outline */
  parcel?: ParcelGeometry | null;
  /** the address point, [lat, lng] */
  point?: LatLng | null;
  /** the accessible name of the point's marker */
  pointLabel?: string;
  /** where to look when there's no parcel or point */
  center?: LatLng;
  /** a link (or button) shown in the corner, e.g. "Open map" */
  action?: React.ReactNode;
  /** more layers to draw on the map */
  children?: React.ReactNode;
};

function MiniMap({
  parcel,
  point,
  pointLabel = 'Address point',
  center,
  zoom,
  interactive = false,
  action,
  className,
  children,
  label = 'Location map',
  ...props
}: MiniMapProps) {
  const positions = React.useMemo(() => (parcel ? parcelPositions(parcel) : null), [parcel]);
  const bounds = React.useMemo(() => (parcel ? placeBounds(parcel, point) : null), [parcel, point]);
  const view = bounds
    ? { bounds, boundsOptions: { padding: [24, 24] as [number, number] } }
    : point
      ? { center: point, zoom: zoom ?? 18 }
      : center
        ? { center, zoom: zoom ?? 16 }
        : null;

  if (!view) {
    return (
      <div
        data-slot="mini-map"
        className={cn(
          'flex h-44 w-full items-center justify-center border border-border bg-muted text-sm font-light text-muted-foreground',
          className,
        )}
      >
        No location on file
      </div>
    );
  }

  return (
    <Map
      // Leaflet frames the place once: a new place is a new map
      key={JSON.stringify(bounds ?? view)}
      data-slot="mini-map"
      className={cn('h-44', className)}
      interactive={interactive}
      label={label}
      overlay={
        action ? (
          <div
            data-slot="mini-map-action"
            className="absolute top-2 right-2 border border-border bg-background px-3 py-1.5 text-sm font-light"
          >
            {action}
          </div>
        ) : undefined
      }
      {...view}
      {...props}
    >
      {positions && <MapPolygon positions={positions} tone="default" fillTone="primary" interactive={false} />}
      {point && <MapMarker position={point} label={pointLabel} keyboard={interactive} interactive={interactive} />}
      {children}
    </Map>
  );
}

export { MiniMap, parcelPositions, placeBounds };
export type { MiniMapProps, ParcelGeometry };
