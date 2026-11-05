'use client';

import * as React from 'react';
import type { LeafletEvent, Map as LeafletMap, Marker as LeafletMarker } from 'leaflet';
import { PlusIcon, Undo2Icon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Map, MapClick, MapMarker, MapPolygon, MapPolyline, type LatLng, type MapProps, type MapTone } from '@/components/ui/map';
import { cn } from '@/lib/utils';

// An area drawn on the map, a corner per click: an inspection sector, a
// work zone, a notification radius drawn by hand. While drawing, the corners
// are joined by a dashed Slate line; click the first corner (or Finish) to
// close the area, which is then filled in its tone and its corners can be
// dragged to reshape it. Undo takes back the last corner; Clear starts again.
// From the keyboard: focus the map, move it with the arrow keys and add a
// corner under the crosshair with "Add corner at centre".
//
// The value is the ring of corners, [lat, lng] each, without the first
// repeated at the end; it's an area once it has three.
//
//   const [ring, setRing] = React.useState<LatLng[]>([]);
//   <AreaPicker center={[44.4759, -73.2121]} value={ring} onValueChange={setRing} />

const PRECISION = 1e6;
const roundCorner = (lat: number, lng: number): LatLng => [
  Math.round(lat * PRECISION) / PRECISION,
  Math.round(lng * PRECISION) / PRECISION,
];

type AreaPickerProps = Omit<React.ComponentProps<'div'>, 'onChange' | 'defaultValue'> & {
  /** the corners, [lat, lng], in order */
  value: LatLng[];
  onValueChange: (value: LatLng[]) => void;
  /** called with the ring when the area is closed */
  onFinish?: (value: LatLng[]) => void;
  /** where the map starts */
  center: LatLng;
  zoom?: number;
  disabled?: boolean;
  /** the map's accessible name */
  label?: string;
  /** the closed area's colour */
  tone?: MapTone;
  /** classes for the map itself (its height) */
  mapClassName?: string;
  /** passed to the map (tiles and so on) */
  mapProps?: Omit<MapProps, 'children' | 'center' | 'zoom' | 'className' | 'mapRef'>;
  /** other layers for context: the sectors already drawn */
  children?: React.ReactNode;
};

function AreaPicker({
  value,
  onValueChange,
  onFinish,
  center,
  zoom = 15,
  disabled = false,
  label = 'Area',
  tone = 'info',
  className,
  mapClassName,
  mapProps,
  children,
  ...props
}: AreaPickerProps) {
  const mapRef = React.useRef<LeafletMap>(null);
  // an area handed in whole (one being edited) starts closed
  const [closedState, setClosed] = React.useState(value.length >= 3);
  const [shownLength, setShownLength] = React.useState(value.length);
  if (shownLength !== value.length) {
    setShownLength(value.length);
    if (shownLength === 0 && value.length >= 3) setClosed(true);
  }
  const closed = closedState && value.length >= 3;
  const drawing = !closed && !disabled;

  const addCorner = (lat: number, lng: number) => onValueChange([...value, roundCorner(lat, lng)]);
  const moveCorner = (i: number, lat: number, lng: number) => onValueChange(value.map((c, j) => (j === i ? roundCorner(lat, lng) : c)));
  const finish = () => {
    if (value.length < 3) return;
    setClosed(true);
    onFinish?.(value);
  };
  const clear = () => {
    setClosed(false);
    onValueChange([]);
  };
  const addAtCentre = () => {
    const c = mapRef.current?.getCenter();
    if (c) addCorner(c.lat, c.lng);
  };

  const status = closed
    ? `Area closed: ${value.length} corners. Drag a corner to move it.`
    : value.length === 0
      ? 'Click the map to add the first corner.'
      : value.length < 3
        ? `${value.length} ${value.length === 1 ? 'corner' : 'corners'}. Add at least ${3 - value.length} more.`
        : `${value.length} corners. Click the first corner or Finish to close the area.`;

  return (
    <div
      data-slot="area-picker"
      data-state={closed ? 'closed' : 'drawing'}
      data-disabled={disabled ? '' : undefined}
      className={cn('flex w-full flex-col gap-3', className)}
      {...props}
    >
      <Map
        mapRef={mapRef}
        center={center}
        zoom={zoom}
        label={label}
        className={cn('h-96', drawing && '[&_.leaflet-container]:cursor-crosshair', mapClassName)}
        overlay={
          drawing ? (
            // the keyboard's aim: "Add corner at centre" puts a corner here
            <span
              aria-hidden="true"
              data-slot="area-picker-crosshair"
              className="pointer-events-none! absolute top-1/2 left-1/2 size-5 -translate-1/2 before:absolute before:top-1/2 before:left-0 before:h-px before:w-full before:bg-slate after:absolute after:top-0 after:left-1/2 after:h-full after:w-px after:bg-slate"
            />
          ) : undefined
        }
        {...mapProps}
      >
        {children}
        {drawing && <MapClick onClick={([lat, lng]) => addCorner(lat, lng)} />}
        {closed ? (
          <MapPolygon positions={value} tone={tone} />
        ) : (
          value.length > 1 && <MapPolyline positions={value.length > 2 ? [...value, value[0]!] : value} tone="default" dashed weight={2} />
        )}
        {value.map((corner, i) => {
          const closer = drawing && i === 0 && value.length >= 3;
          return (
            <MapMarker
              key={i}
              position={corner}
              tone={closed ? tone : 'default'}
              selected={closer}
              label={closer ? 'Close the area' : `Corner ${i + 1}`}
              draggable={closed && !disabled}
              eventHandlers={{
                click: () => {
                  if (closer) finish();
                },
                dragend: (e: LeafletEvent) => {
                  const at = (e.target as LeafletMarker).getLatLng();
                  moveCorner(i, at.lat, at.lng);
                },
              }}
            />
          );
        })}
      </Map>
      <div className="flex flex-wrap items-center gap-2">
        <p data-slot="area-picker-status" aria-live="polite" className="mr-auto text-sm font-light text-muted-foreground">
          {status}
        </p>
        {drawing && (
          <>
            <Button type="button" variant="outline" size="sm" onClick={addAtCentre}>
              <PlusIcon data-icon="inline-start" />
              Add corner at centre
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={value.length === 0}
              onClick={() => onValueChange(value.slice(0, -1))}
            >
              <Undo2Icon data-icon="inline-start" />
              Undo
            </Button>
            <Button type="button" variant="secondary" size="sm" disabled={value.length < 3} onClick={finish}>
              Finish
            </Button>
          </>
        )}
        <Button type="button" variant="ghost" size="sm" disabled={disabled || value.length === 0} onClick={clear}>
          Clear
        </Button>
      </div>
    </div>
  );
}

export { AreaPicker };
export type { AreaPickerProps };
