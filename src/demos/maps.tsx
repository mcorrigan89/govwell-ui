import { useMemo, useState, type ReactNode } from 'react';

import { AreaPicker } from '@/components/ui/area-picker';
import { ClientOnly } from '@/components/ui/client-only';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Link } from '@/components/ui/link';
import { Map, MapClick, MapMarker, MapPolygon, MapPolyline, MapPopup, MapTooltip, type LatLng, type MapTone } from '@/components/ui/map';
import { MiniMap, type ParcelGeometry } from '@/components/ui/mini-map';
import { PointPicker } from '@/components/ui/point-picker';
import { Skeleton } from '@/components/ui/skeleton';
import { VectorTileLayer, polygonRule, type VectorTileLayerHandle } from '@/components/ui/vector-tile-layer';

// Demos for the map family: client-only, map, mini-map, point-picker,
// area-picker and vector-tile-layer. Places are in downtown Burlington,
// Vermont; parcels, permits and sectors are illustrative.

const DOWNTOWN: LatLng = [44.4772, -73.2118];

// an illustrative lot on Pearl Street, GeoJSON [lng, lat]
const PARCEL: ParcelGeometry = {
  type: 'Polygon',
  coordinates: [
    [
      [-73.21065, 44.47905],
      [-73.21038, 44.47905],
      [-73.21038, 44.4794],
      [-73.21065, 44.4794],
      [-73.21065, 44.47905],
    ],
  ],
};
const SITUS: LatLng = [44.47912, -73.21052];

function ClientOnlyDemo() {
  return (
    <div className="flex max-w-md flex-col gap-3">
      <ClientOnly fallback={<Skeleton className="h-44" />}>
        <MiniMap parcel={PARCEL} point={SITUS} label="Parcel 042-118" />
      </ClientOnly>
      <p className="text-sm font-light text-muted-foreground">
        The map renders after hydration; the server and the first client pass show the skeleton.
      </p>
    </div>
  );
}

const INSPECTIONS: { id: string; at: LatLng; title: string; detail: string; tone: MapTone }[] = [
  { id: 'BP-2026-0418', at: [44.4781, -73.212], title: 'Framing', detail: 'Passed · M. Okafor', tone: 'ok' },
  { id: 'BP-2026-0422', at: [44.4769, -73.2098], title: 'Electrical rough-in', detail: 'Scheduled 10:30', tone: 'info' },
  { id: 'CE-2026-0107', at: [44.4752, -73.2142], title: 'Overgrown lot', detail: 'Re-inspection overdue', tone: 'warning' },
  { id: 'BP-2026-0431', at: [44.4793, -73.2085], title: 'Final', detail: 'Failed: handrail height', tone: 'destructive' },
  { id: 'BP-2026-0440', at: [44.4762, -73.2116], title: 'Footing', detail: 'Unassigned', tone: 'default' },
];

function MapDemo() {
  const [selected, setSelected] = useState('BP-2026-0422');
  const current = INSPECTIONS.find((i) => i.id === selected);
  return (
    <div className="flex max-w-3xl flex-col gap-3">
      <Map center={DOWNTOWN} zoom={16} label="Today's inspections" className="h-96">
        <MapPolyline
          positions={[
            [44.4757, -73.2129],
            [44.4799, -73.2124],
          ]}
          tone="warning"
          weight={5}
        >
          <MapTooltip sticky>Water main repair · Oct 6–17</MapTooltip>
        </MapPolyline>
        {INSPECTIONS.map((i) => (
          <MapMarker
            key={i.id}
            position={i.at}
            tone={i.tone}
            selected={i.id === selected}
            label={`${i.id} ${i.title}`}
            eventHandlers={{ click: () => setSelected(i.id) }}
          >
            <MapPopup>
              <div className="font-normal">{i.id}</div>
              <div>{i.title}</div>
              <div className="text-muted-foreground">{i.detail}</div>
            </MapPopup>
          </MapMarker>
        ))}
      </Map>
      <p className="text-sm font-light text-muted-foreground">
        {current ? `${current.id} · ${current.title} · ${current.detail}` : 'Select an inspection'}
      </p>
    </div>
  );
}

function MiniMapDemo() {
  return (
    <div className="flex max-w-md flex-col gap-2">
      <div className="text-sm font-normal">212 Pearl Street · Parcel 042-118</div>
      <MiniMap
        parcel={PARCEL}
        point={SITUS}
        label="Parcel 042-118"
        action={
          <Link href="#/map" size="sm">
            Open map
          </Link>
        }
      />
    </div>
  );
}

function PointPickerDemo() {
  const [point, setPoint] = useState<LatLng | null>([44.47915, -73.21048]);
  return (
    <div className="flex max-w-xl flex-col gap-4">
      <PointPicker center={SITUS} value={point} onValueChange={setPoint} label="Inspection location">
        <MapPolygon positions={PARCEL.coordinates[0]!.map(([lng, lat]) => [lat!, lng!] as LatLng)} fillTone="primary" interactive={false} />
      </PointPicker>
      <Field>
        <FieldLabel htmlFor="recorded-location">Recorded location</FieldLabel>
        <Input id="recorded-location" readOnly value={point ? `${point[0]}, ${point[1]}` : ''} placeholder="No point placed" />
        <FieldDescription>Saved with inspection BP-2026-0418.</FieldDescription>
      </Field>
    </div>
  );
}

const SECTORS: { name: string; inspector: string; ring: LatLng[] }[] = [
  {
    name: 'Sector 1 · Old North End',
    inspector: 'J. Alvarez',
    ring: [
      [44.4835, -73.2185],
      [44.4835, -73.205],
      [44.4795, -73.205],
      [44.4795, -73.2185],
    ],
  },
  {
    name: 'Sector 2 · Downtown',
    inspector: 'M. Okafor',
    ring: [
      [44.4795, -73.2185],
      [44.4795, -73.205],
      [44.4745, -73.205],
      [44.4745, -73.2185],
    ],
  },
];

function AreaPickerDemo() {
  const [ring, setRing] = useState<LatLng[]>([
    [44.4745, -73.2185],
    [44.4745, -73.207],
    [44.4705, -73.2055],
    [44.4698, -73.2175],
  ]);
  return (
    <div className="flex max-w-3xl flex-col gap-3">
      <div className="text-sm font-normal">Sector 3 · South End</div>
      <AreaPicker center={[44.4765, -73.212]} zoom={14} value={ring} onValueChange={setRing} label="Sector 3 boundary">
        {SECTORS.map((s) => (
          <MapPolygon key={s.name} positions={s.ring} tone="muted" dashed>
            <MapTooltip sticky>
              {s.name} · {s.inspector}
            </MapTooltip>
          </MapPolygon>
        ))}
      </AreaPicker>
    </div>
  );
}

// the 2018 Census ZIP code areas, as vector tiles (Protomaps sample data)
const ZCTA = 'https://r2-public.protomaps.com/protomaps-sample-datasets/cb_2018_us_zcta510_500k.pmtiles';

function VectorTileLayerDemo() {
  const [layer, setLayer] = useState<VectorTileLayerHandle | null>(null);
  const [zip, setZip] = useState<string | null>(null);
  const rules = useMemo(
    () => [
      polygonRule({ dataSource: 'zcta', dataLayer: 'zcta', tone: 'info', opacity: 0.12 }),
      polygonRule({
        dataSource: 'zcta',
        dataLayer: 'zcta',
        tone: 'primary',
        strokeTone: 'default',
        opacity: 0.35,
        width: 2,
        filter: (_z, f) => f.props.ZCTA5CE10 === zip,
      }),
    ],
    [zip],
  );
  return (
    <div className="flex max-w-3xl flex-col gap-3">
      <Map center={[44.48, -73.2]} zoom={11} label="ZIP code areas" className="h-96">
        <VectorTileLayer ref={setLayer} sources={{ zcta: ZCTA }} paintRules={rules} paintKey={zip ?? ''} maxDataZoom={7} />
        <PickZip layer={layer} onPick={setZip} />
      </Map>
      <p className="text-sm font-light text-muted-foreground">
        {zip ? `ZIP code ${zip}: notices go to every address in this area.` : 'Click an area to pick its ZIP code.'}
      </p>
    </div>
  );
}

function PickZip({ layer, onPick }: { layer: VectorTileLayerHandle | null; onPick: (zip: string | null) => void }) {
  return (
    <MapClick
      onClick={([lat, lng]) => {
        const hit = layer?.featuresAt(lat, lng).find((f) => f.layer === 'zcta');
        onPick(hit ? String(hit.feature.props.ZCTA5CE10) : null);
      }}
    />
  );
}

export const MAPS_DEMOS: Record<string, () => ReactNode> = {
  'client-only': ClientOnlyDemo,
  map: MapDemo,
  'mini-map': MiniMapDemo,
  'point-picker': PointPickerDemo,
  'area-picker': AreaPickerDemo,
  'vector-tile-layer': VectorTileLayerDemo,
};
