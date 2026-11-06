import { useEffect, useState, type ReactNode } from 'react';

import { ActorBadge, type ActorType } from '@/components/ui/actor-badge';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-button';
import { DescriptionDetails, DescriptionItem, DescriptionList, DescriptionTerm } from '@/components/ui/description-list';
import { DownloadLink } from '@/components/ui/download-link';
import { Highlight, SearchHit } from '@/components/ui/highlight';
import { Input } from '@/components/ui/input';
import { Lightbox, type LightboxImage } from '@/components/ui/lightbox';
import { Markdown } from '@/components/ui/markdown';
import { Tree, type TreeNode } from '@/components/ui/tree';

// ---- description list ------------------------------------------------------

const PARCEL: [string, ReactNode, string?][] = [
  ['Parcel number', '042-118-07', 'Assessor parcel fabric · imported 3 Nov 2026'],
  ['Lot area', '6,016 sq ft', 'Assessor parcel fabric · imported 3 Nov 2026'],
  ['Zoning', 'R-1 Single-family', 'Zoning layer · adopted 12 Mar 2025'],
  ['Flood zone', 'X (minimal)', 'FEMA NFHL · imported 28 Oct 2026'],
  ['Historic district', null],
  ['Year built', '1962', 'Assessor parcel fabric · imported 3 Nov 2026'],
];

function DescriptionListDemo() {
  return (
    <div className="grid max-w-3xl gap-10">
      <section className="grid gap-3">
        <h3 className="text-lg font-normal">Inline, divided, with sources on hover</h3>
        <DescriptionList layout="inline" divided>
          {PARCEL.map(([label, value, source]) => (
            <DescriptionItem key={label}>
              <DescriptionTerm>{label}</DescriptionTerm>
              <DescriptionDetails source={source}>{value}</DescriptionDetails>
            </DescriptionItem>
          ))}
        </DescriptionList>
      </section>
      <section className="grid gap-3">
        <h3 className="text-lg font-normal">Grid of three, sources as a second line</h3>
        <DescriptionList layout="grid" columns={3}>
          <DescriptionItem>
            <DescriptionTerm>Declared valuation</DescriptionTerm>
            <DescriptionDetails source="Applicant, on the application" sourceDisplay="line">
              $48,200.00
            </DescriptionDetails>
          </DescriptionItem>
          <DescriptionItem>
            <DescriptionTerm>Computed valuation</DescriptionTerm>
            <DescriptionDetails source="ICC table, Feb 2026 · 412 sq ft × $117.06" sourceDisplay="line">
              $48,228.72
            </DescriptionDetails>
          </DescriptionItem>
          <DescriptionItem>
            <DescriptionTerm>Plan review fee</DescriptionTerm>
            <DescriptionDetails source="Fee schedule § 4.2 · 65% of permit fee" sourceDisplay="line">
              $412.75
            </DescriptionDetails>
          </DescriptionItem>
          <DescriptionItem>
            <DescriptionTerm>Contractor licence</DescriptionTerm>
            <DescriptionDetails>CSLB 1048213</DescriptionDetails>
          </DescriptionItem>
          <DescriptionItem>
            <DescriptionTerm>Inspector</DescriptionTerm>
            <DescriptionDetails>Marcus Oyelaran</DescriptionDetails>
          </DescriptionItem>
          <DescriptionItem>
            <DescriptionTerm>Final inspection</DescriptionTerm>
            <DescriptionDetails />
          </DescriptionItem>
        </DescriptionList>
      </section>
      <section className="grid max-w-sm gap-3">
        <h3 className="text-lg font-normal">Stacked</h3>
        <DescriptionList>
          <DescriptionItem>
            <DescriptionTerm>Applicant</DescriptionTerm>
            <DescriptionDetails>Priya Raman, 418 Alder Street</DescriptionDetails>
          </DescriptionItem>
          <DescriptionItem>
            <DescriptionTerm>Work description</DescriptionTerm>
            <DescriptionDetails>Convert detached garage to an accessory dwelling unit with a new half bath.</DescriptionDetails>
          </DescriptionItem>
        </DescriptionList>
      </section>
    </div>
  );
}

// ---- copy button -----------------------------------------------------------

function CopyButtonDemo() {
  return (
    <div className="grid max-w-lg gap-6">
      <div className="flex items-center gap-3">
        <span className="text-lg tabular-nums">BLD-2026-01482</span>
        <CopyButton value="BLD-2026-01482" label="Copy permit number" variant="ghost" size="icon-sm" />
      </div>
      <div className="flex gap-2">
        <Input readOnly value="K7Q-4M2-XP9" aria-label="Contractor invite code" className="tabular-nums" />
        <CopyButton value="K7Q-4M2-XP9">Copy code</CopyButton>
      </div>
      <div className="flex gap-2">
        <CopyButton value="https://permits.example.gov/r/BLD-2026-01482" variant="secondary" size="sm">
          Copy public link
        </CopyButton>
        <CopyButton value={() => Promise.reject(new Error('blocked'))} size="sm" errorLabel="Couldn't copy — select it instead">
          Copy (always fails)
        </CopyButton>
      </div>
    </div>
  );
}

// ---- markdown --------------------------------------------------------------

const CONDITIONS = `## Conditions of approval

The accessory dwelling unit at **418 Alder Street** is approved subject to the following:

1. Provide a **one-hour fire separation** between the ADU and the main house (CRC R302.6).
2. Install smoke and carbon monoxide alarms in each sleeping room.
3. ~~Off-street parking~~ — waived under Gov. Code § 66314(d)(10), within ½ mile of transit.

> Inspections must be requested at least 24 hours ahead through the resident portal.

### Fees

| Item | Amount |
| --- | ---: |
| Building permit | $635.00 |
| Plan review | $412.75 |
| Technology surcharge | $31.75 |

- [x] Site plan received
- [ ] Energy compliance (Title 24) report

Questions? Read the [ADU guide](https://example.gov/adu) or call the permit counter. <script>alert('raw HTML is dropped')</script>
`;

// ---- highlight -------------------------------------------------------------

const SECTIONS = [
  {
    citation: 'R302.6',
    title: 'Dwelling-garage fire separation',
    book: 'Residential Code 2025',
    body: 'The garage shall be separated as required by Table R302.6. Openings in garage walls shall comply with Section R302.5. Attachment of gypsum board shall comply with Table R702.3.5. The wall separation provisions of Table R302.6 shall not apply to garage walls that are perpendicular to the adjacent dwelling unit wall.',
  },
  {
    citation: '17.42.030',
    title: 'Accessory dwelling units — garage conversions',
    book: 'Zoning Ordinance',
    body: 'An existing garage may be converted to an accessory dwelling unit without replacement parking. The converted structure shall meet the fire separation requirements of the building code where it remains attached to the primary dwelling.',
  },
];

function HighlightDemo() {
  const [q, setQ] = useState('garage fire separation');
  const terms = q.split(/\s+/);
  return (
    <div className="grid max-w-2xl gap-6">
      <Input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search the code library" />
      <p className="text-base">
        <Highlight text="Garage conversions need a fire separation where the garage stays attached." terms={terms} />
      </p>
      <ul className="grid border-y border-border">
        {SECTIONS.map((s) => (
          <li key={s.citation} className="border-b border-border last:border-b-0">
            <SearchHit citation={s.citation} title={s.title} meta={`· ${s.book}`} snippet={s.body} terms={terms} radius={70} />
          </li>
        ))}
        <li>
          <SearchHit
            citation="R309.1"
            title="Garage floor surfaces"
            meta="· in your amendment"
            snippet="…floors shall be of approved **noncombustible** material, sloped to drain toward the **garage** door…"
            delimiter="**"
          />
        </li>
      </ul>
    </div>
  );
}

// ---- tree ------------------------------------------------------------------

type Entry = { actor: ActorType; who: string; what: string; at: string };

const ENTRIES: Record<string, Entry> = {
  submitted: { actor: 'person', who: 'Priya Raman', what: 'submitted the application', at: '3 Nov, 9:14' },
  fees: { actor: 'automation', who: 'Fee schedule', what: 'assessed $1,079.50 in fees', at: '3 Nov, 9:14' },
  invoice: { actor: 'system', who: 'Billing', what: 'emailed invoice INV-20931', at: '3 Nov, 9:15' },
  review: { actor: 'automation', who: 'Routing rules', what: 'routed plan review to Building and Fire', at: '3 Nov, 9:14' },
  precheck: { actor: 'ai', who: 'Intake assistant', what: 'flagged a missing Title 24 report', at: '3 Nov, 9:16' },
  paid: { actor: 'person', who: 'Priya Raman', what: 'paid $1,079.50 by card', at: '4 Nov, 18:02' },
  receipt: { actor: 'system', who: 'Billing', what: 'sent receipt RCT-11873', at: '4 Nov, 18:02' },
};

/** a node per entry; typeahead matches the actor's name */
const node = (id: string, children?: TreeNode[]): TreeNode => ({ id, label: ENTRIES[id]!.what, textValue: ENTRIES[id]!.who, children });

// the causal chain: what an automation or the system did hangs under the event that caused it
const EXPLAIN: TreeNode[] = [
  node('submitted', [node('fees', [node('invoice')]), node('review'), node('precheck')]),
  node('paid', [node('receipt')]),
];

function TreeDemo() {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <div className="grid max-w-2xl gap-3">
      <Tree
        aria-label="Why this application is the way it is"
        items={EXPLAIN}
        defaultExpanded={['submitted', 'fees', 'paid']}
        selectionMode="single"
        selected={selected}
        onSelectedChange={setSelected}
        renderItem={(n) => {
          const e = ENTRIES[n.id]!;
          return (
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <ActorBadge type={e.actor} name={e.who} />
              <span>{e.what}</span>
              <span className="ml-auto text-sm tabular-nums opacity-70">{e.at}</span>
            </span>
          );
        }}
      />
      <p className="text-sm text-muted-foreground">Indented entries were caused by the event above them. Selected: {selected ?? 'none'}</p>
    </div>
  );
}

// ---- lightbox --------------------------------------------------------------

/** a drawn plan sheet, as a data URL, so the demo needs no external image */
function planPage(title: string, sheet: string, body: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1275" height="1650" viewBox="0 0 1275 1650">
<rect width="1275" height="1650" fill="#fff"/>
<rect x="40" y="40" width="1195" height="1570" fill="none" stroke="#202020" stroke-width="3"/>
<rect x="40" y="1460" width="1195" height="150" fill="none" stroke="#202020" stroke-width="2"/>
<text x="70" y="1520" font-family="Helvetica, Arial" font-size="34" fill="#202020">${title}</text>
<text x="70" y="1570" font-family="Helvetica, Arial" font-size="22" fill="#666">418 Alder Street · APN 042-118-07</text>
<text x="1200" y="1545" font-family="Helvetica, Arial" font-size="48" text-anchor="end" fill="#202020">${sheet}</text>
${body}
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const SITE_PLAN = planPage(
  'SITE PLAN',
  'A1.0',
  `<rect x="160" y="160" width="955" height="1180" fill="none" stroke="#7c7c7c" stroke-width="3" stroke-dasharray="18 10"/>
<rect x="330" y="420" width="520" height="380" fill="#ececec" stroke="#202020" stroke-width="3"/>
<text x="590" y="620" font-family="Helvetica, Arial" font-size="30" text-anchor="middle" fill="#202020">EXISTING HOUSE</text>
<rect x="760" y="950" width="260" height="240" fill="#fff" stroke="#202020" stroke-width="3"/>
<text x="890" y="1075" font-family="Helvetica, Arial" font-size="24" text-anchor="middle" fill="#202020">GARAGE → ADU</text>
<text x="200" y="1390" font-family="Helvetica, Arial" font-size="26" fill="#202020">LOT AREA: 6,016 SQ. FT. ±</text>
<text x="200" y="1425" font-family="Helvetica, Arial" font-size="22" fill="#666">ZONING R-1 · SETBACKS 20' FRONT / 5' SIDE / 10' REAR</text>`,
);

const FLOOR_PLAN = planPage(
  'ADU FLOOR PLAN',
  'A2.0',
  `<rect x="240" y="260" width="800" height="760" fill="none" stroke="#202020" stroke-width="8"/>
<line x1="640" y1="260" x2="640" y2="700" stroke="#202020" stroke-width="5"/>
<line x1="240" y1="700" x2="1040" y2="700" stroke="#202020" stroke-width="5"/>
<text x="440" y="480" font-family="Helvetica, Arial" font-size="28" text-anchor="middle" fill="#202020">BEDROOM</text>
<text x="840" y="480" font-family="Helvetica, Arial" font-size="28" text-anchor="middle" fill="#202020">LIVING</text>
<text x="640" y="870" font-family="Helvetica, Arial" font-size="28" text-anchor="middle" fill="#202020">KITCHEN / ½ BATH</text>
<text x="240" y="1100" font-family="Helvetica, Arial" font-size="24" fill="#202020">1-HR FIRE SEPARATION AT WALL SHARED WITH MAIN HOUSE</text>`,
);

const PAGES: LightboxImage[] = [
  {
    src: SITE_PLAN,
    alt: 'Site plan, sheet A1.0',
    caption: 'plot-plan.pdf · p. 1',
    description: '“LOT AREA: 6,016 SQ. FT. ±” — read as 6,016 sq ft',
    regions: [{ x: 0.145, y: 0.82, width: 0.33, height: 0.03, label: 'Lot area' }],
  },
  {
    src: FLOOR_PLAN,
    alt: 'ADU floor plan, sheet A2.0',
    caption: 'plan-set.pdf · p. 4',
    description: 'Fire separation note, flagged in plan review',
    regions: [
      { x: 0.18, y: 0.645, width: 0.68, height: 0.035, label: 'Fire separation note' },
      { x: 0.5, y: 0.4, label: 'Shared wall' },
    ],
  },
];

function LightboxDemo() {
  return (
    <div className="flex flex-wrap gap-3">
      <Lightbox images={PAGES} trigger={<Button variant="outline">Open the cited pages</Button>} />
      <Lightbox images={[PAGES[1]!]} trigger={<Button variant="ghost">Single page</Button>} />
    </div>
  );
}

// ---- download link ---------------------------------------------------------

function DownloadLinkDemo() {
  const [state, setState] = useState<'preparing' | 'ready' | 'error'>('preparing');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (state !== 'preparing') return;
    // the first build fails, the retry succeeds
    const t = setTimeout(() => setState(attempt === 0 ? 'error' : 'ready'), 1800);
    return () => clearTimeout(t);
  }, [state, attempt]);
  const pdf = 'data:application/pdf;base64,JVBERi0xLjQKJSVFT0YK';
  return (
    <div className="grid max-w-lg gap-6">
      <DownloadLink
        state={state}
        href={pdf}
        filename="BLD-2026-01482-permit.pdf"
        label="Permit (PDF)"
        size={184_320}
        preparingLabel={state === 'preparing' ? 'Preparing the permit PDF…' : undefined}
        onRetry={() => {
          setAttempt((a) => a + 1);
          setState('preparing');
        }}
      />
      <DownloadLink state="ready" href={pdf} filename="review-set-2.pdf" label="Marked-up set" size="PDF, 14 comments on 6 pages" />
      <DownloadLink state="preparing" variant="button" filename="BLD-2026-01482-permit.pdf" />
      <DownloadLink
        state="ready"
        variant="button"
        href={pdf}
        filename="BLD-2026-01482-permit.pdf"
        label="Download your permit"
        size={184_320}
      />
      <DownloadLink state="error" filename="inspection-export.csv" errorLabel="The export timed out." onRetry={() => {}} />
    </div>
  );
}

export const CONTENT_DEMOS: Record<string, () => ReactNode> = {
  'description-list': () => <DescriptionListDemo />,
  'copy-button': () => <CopyButtonDemo />,
  markdown: () => <Markdown>{CONDITIONS}</Markdown>,
  highlight: () => <HighlightDemo />,
  tree: () => <TreeDemo />,
  lightbox: () => <LightboxDemo />,
  'download-link': () => <DownloadLinkDemo />,
};
