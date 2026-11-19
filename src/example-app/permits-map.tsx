import { useState } from 'react';
import { ChevronUp, Map as MapIcon, Satellite } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { divIcon } from 'leaflet';
import { ImageOverlay, Marker, ZoomControl } from 'react-leaflet';

import { Map, MapPopup, MapTiles } from '@/components/ui/map';
import { SegmentedControl, SegmentedControlItem } from '@/components/ui/segmented-control';
import { cn } from '@/lib/utils';

import { locationOf, TOWN_CENTER, type PermitRecord } from './data';

// The permits list's GIS map: every record that passes the list's search, as a
// location pin you can click for its number, address and status. A Map / Satellite
// switch sits bottom left, zoom bottom right, and the map folds away with Hide
// map. Laid out like GovWell's record maps: Esri's street map and World
// Imagery, zoomed out to show the town and around it.

const LAYERS = {
  // Esri's World Street Map, as on GovWell's own record maps
  map: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Powered by Esri',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Powered by Esri',
  },
} as const;

// A published copy can't load outside map tiles, so its build
// (VITE_STATIC_MAP=1) lays one picture of Esri's street map round the town
// (sample/twinsburg-map.jpg, shipped beside the page, not in the repo) under
// the pins instead, and keeps the view on it. Pan and zoom still work; there's
// no satellite picture.
const STATIC_MAP = import.meta.env.VITE_STATIC_MAP === '1';
const STATIC_BOUNDS: [[number, number], [number, number]] = [
  [TOWN_CENTER[0] - 0.05, TOWN_CENTER[1] - 0.1],
  [TOWN_CENTER[0] + 0.05, TOWN_CENTER[1] + 0.1],
];
const STATIC_VIEW = { minZoom: 13, maxZoom: 15, maxBounds: STATIC_BOUNDS, maxBoundsViscosity: 1 };

// the sidebar's Locations pin (Streamline Ultimate "Pin"), black with a white
// edge so it reads on streets and imagery alike, its tip on the spot
const PIN_PATH =
  'M12 0a8 8 0 0 0 -8 8c0 3.51 5 12 7.15 15.52a1 1 0 0 0 1.7 0C15 20 20 11.51 20 8a8 8 0 0 0 -8 -8Zm0 11.5A3.5 3.5 0 1 1 15.5 8a3.5 3.5 0 0 1 -3.5 3.5Z';
const PIN = divIcon({
  // no `leaflet-div-icon` (a white box with a grey border)
  className: '',
  iconSize: [26, 26],
  iconAnchor: [13, 25],
  popupAnchor: [0, -24],
  html: `<svg data-slot="permit-pin" viewBox="-1 -1 26 26" width="26" height="26" aria-hidden="true"><path d="${PIN_PATH}" fill="#000000" fill-rule="evenodd" stroke="#ffffff" stroke-width="1.5" paint-order="stroke"/></svg>`,
});

export function PermitsMap({ rows, onOpen }: { rows: PermitRecord[]; onOpen: (record: PermitRecord) => void }) {
  const [shown, setShown] = useState(true);
  const [layer, setLayer] = useState<keyof typeof LAYERS>('map');

  return (
    <div className="flex flex-col gap-3">
      {/* a plain outline button either way: the outline variant fills Hope while
          aria-expanded (meant for an open menu), so that fill is undone here. The
          arrow flips over on its x-axis as the map folds away */}
      <Button
        variant="outline"
        size="sm"
        className="self-end aria-expanded:border-foreground aria-expanded:bg-transparent aria-expanded:text-foreground aria-expanded:hover:border-hope aria-expanded:hover:bg-hope aria-expanded:hover:text-slate"
        aria-expanded={shown}
        onClick={() => setShown((s) => !s)}
      >
        <ChevronUp
          data-icon="inline-start"
          // flips over on its x-axis (a little perspective so it reads as a turn)
          className={cn(
            'transition-transform duration-300 ease-in motion-reduce:transition-none',
            shown ? '[transform:perspective(40px)_rotateX(0deg)]' : '[transform:perspective(40px)_rotateX(180deg)]',
          )}
        />
        {shown ? 'Hide map' : 'Show map'}
      </Button>
      {shown && (
        <Map
          label={`${rows.length} permits on the map`}
          center={TOWN_CENTER}
          zoom={13}
          tiles={false}
          zoomControl={false}
          {...(STATIC_MAP ? STATIC_VIEW : {})}
          className="h-96"
          overlay={
            !STATIC_MAP && (
              <SegmentedControl
                aria-label="Map style"
                value={layer}
                onValueChange={setLayer}
                size="sm"
                fitContent
                className="absolute bottom-3 left-3 border-border bg-background"
              >
                <SegmentedControlItem value="map">
                  <MapIcon /> Map
                </SegmentedControlItem>
                <SegmentedControlItem value="satellite">
                  <Satellite /> Satellite
                </SegmentedControlItem>
              </SegmentedControl>
            )
          }
        >
          {/* a new layer when the style changes: Leaflet reads a tile layer's url once */}
          {STATIC_MAP ? (
            <ImageOverlay
              url={`${import.meta.env.BASE_URL}sample/twinsburg-map.jpg`}
              bounds={STATIC_BOUNDS}
              attribution={LAYERS.map.attribution}
            />
          ) : (
            <MapTiles key={layer} url={LAYERS[layer].url} attribution={LAYERS[layer].attribution} />
          )}
          <ZoomControl position="bottomright" />
          {rows.map((r) => (
            <Marker key={r.id} position={locationOf(r)} icon={PIN} title={`${r.number}, ${r.address}`} alt={`${r.number}, ${r.address}`}>
              <MapPopup>
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    className="w-fit text-left font-normal underline decoration-1 underline-offset-4 outline-none hover:decoration-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring"
                    onClick={() => onOpen(r)}
                  >
                    {r.number}
                  </button>
                  <span>{r.address}</span>
                  <span className="text-muted-foreground">
                    {r.kind} · {r.status.name}
                  </span>
                </div>
              </MapPopup>
            </Marker>
          ))}
        </Map>
      )}
    </div>
  );
}
