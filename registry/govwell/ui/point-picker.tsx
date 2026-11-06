'use client';

import * as React from 'react';
import type { LeafletEvent, Marker as LeafletMarker } from 'leaflet';
import { useMap } from 'react-leaflet';

import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Map, MapClick, MapMarker, type LatLng, type MapProps, type MapTone } from '@/components/ui/map';
import { cn } from '@/lib/utils';

// A point placed on the map: click to place it, drag the square to move it.
// Where an inspection was carried out, where a sign or hydrant stands. The
// keyboard (and anyone with coordinates to hand) uses the Latitude and
// Longitude boxes under the map, which take the value on Enter or when you
// leave the box; the map pans to a typed point that's out of view. Points are
// rounded to 6 decimal places (about 10 cm).
//
//   const [point, setPoint] = React.useState<LatLng | null>(null);
//   <PointPicker center={[44.4759, -73.2121]} value={point} onValueChange={setPoint} />

const PRECISION = 1e6;
const roundPoint = (lat: number, lng: number): LatLng => [Math.round(lat * PRECISION) / PRECISION, Math.round(lng * PRECISION) / PRECISION];
const samePoint = (a: LatLng | null, b: LatLng | null) => a === b || (!!a && !!b && a[0] === b[0] && a[1] === b[1]);

type Draft = { lat: string; lng: string };
const toDraft = (p: LatLng | null): Draft => ({ lat: p ? String(p[0]) : '', lng: p ? String(p[1]) : '' });

/** a typed coordinate, or NaN when it isn't one in range */
function parseCoordinate(text: string, limit: number) {
  const trimmed = text.trim();
  if (trimmed === '') return Number.NaN;
  const n = Number(trimmed);
  return Number.isFinite(n) && Math.abs(n) <= limit ? n : Number.NaN;
}

/** pans to the point when it's set out of view (typed in, or set by the app) */
function FollowPoint({ point }: { point: LatLng | null }) {
  const map = useMap();
  const lat = point?.[0];
  const lng = point?.[1];
  React.useEffect(() => {
    if (lat == null || lng == null) return;
    if (!map.getBounds().contains([lat, lng])) map.panTo([lat, lng]);
  }, [map, lat, lng]);
  return null;
}

type PointPickerProps = Omit<React.ComponentProps<'div'>, 'onChange' | 'defaultValue'> & {
  /** the point, [lat, lng], or null when none is placed */
  value: LatLng | null;
  onValueChange: (value: LatLng | null) => void;
  /** where the map starts when there's no point yet */
  center: LatLng;
  zoom?: number;
  disabled?: boolean;
  /** the map's accessible name and the marker's */
  label?: string;
  /** the marker's colour */
  tone?: MapTone;
  /** false to leave out the coordinate boxes (the map alone isn't keyboard-accessible) */
  inputs?: boolean;
  /** classes for the map itself (its height) */
  mapClassName?: string;
  /** passed to the map (tiles and so on) */
  mapProps?: Omit<MapProps, 'children' | 'center' | 'zoom' | 'className'>;
  /** other layers for context: the parcel, nearby points */
  children?: React.ReactNode;
};

function PointPicker({
  value,
  onValueChange,
  center,
  zoom = 17,
  disabled = false,
  label = 'Location',
  tone = 'default',
  inputs = true,
  className,
  mapClassName,
  mapProps,
  children,
  ...props
}: PointPickerProps) {
  const id = React.useId();
  const [draft, setDraft] = React.useState<Draft>(() => toDraft(value));
  // keep the boxes in step with a value set from outside (a click, a drag)
  const [shown, setShown] = React.useState(value);
  if (!samePoint(shown, value)) {
    setShown(value);
    setDraft(toDraft(value));
  }

  const place = (lat: number, lng: number) => {
    const next = roundPoint(lat, lng);
    if (!samePoint(next, value)) onValueChange(next);
  };

  const commit = () => {
    if (draft.lat.trim() === '' && draft.lng.trim() === '') {
      if (value) onValueChange(null);
      return;
    }
    const lat = parseCoordinate(draft.lat, 90);
    const lng = parseCoordinate(draft.lng, 180);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return;
    place(lat, lng);
  };

  const latInvalid = draft.lat.trim() !== '' && Number.isNaN(parseCoordinate(draft.lat, 90));
  const lngInvalid = draft.lng.trim() !== '' && Number.isNaN(parseCoordinate(draft.lng, 180));

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
    }
  };

  return (
    <div
      data-slot="point-picker"
      data-disabled={disabled ? '' : undefined}
      className={cn('flex w-full flex-col gap-3', className)}
      {...props}
    >
      <Map
        center={value ?? center}
        zoom={zoom}
        label={label}
        className={cn('h-64', !disabled && '[&_.leaflet-container]:cursor-crosshair', mapClassName)}
        {...mapProps}
      >
        {children}
        {!disabled && <MapClick onClick={([lat, lng]) => place(lat, lng)} />}
        <FollowPoint point={value} />
        {value && (
          <MapMarker
            position={value}
            tone={tone}
            selected
            label={label}
            draggable={!disabled}
            eventHandlers={{
              dragend: (e: LeafletEvent) => {
                const at = (e.target as LeafletMarker).getLatLng();
                place(at.lat, at.lng);
              },
            }}
          />
        )}
      </Map>
      {inputs && (
        <div className="flex flex-wrap items-end gap-3">
          <Field className="min-w-32 flex-1">
            <FieldLabel htmlFor={`${id}-lat`}>Latitude</FieldLabel>
            <Input
              id={`${id}-lat`}
              inputMode="decimal"
              autoComplete="off"
              placeholder="44.475900"
              disabled={disabled}
              aria-invalid={latInvalid || undefined}
              value={draft.lat}
              onChange={(e) => setDraft((d) => ({ ...d, lat: e.target.value }))}
              onBlur={commit}
              onKeyDown={onKeyDown}
            />
          </Field>
          <Field className="min-w-32 flex-1">
            <FieldLabel htmlFor={`${id}-lng`}>Longitude</FieldLabel>
            <Input
              id={`${id}-lng`}
              inputMode="decimal"
              autoComplete="off"
              placeholder="-73.212100"
              disabled={disabled}
              aria-invalid={lngInvalid || undefined}
              value={draft.lng}
              onChange={(e) => setDraft((d) => ({ ...d, lng: e.target.value }))}
              onBlur={commit}
              onKeyDown={onKeyDown}
            />
          </Field>
          <Button type="button" variant="outline" disabled={disabled || !value} onClick={() => onValueChange(null)}>
            Clear
          </Button>
        </div>
      )}
    </div>
  );
}

export { PointPicker, parseCoordinate, roundPoint };
export type { PointPickerProps };
