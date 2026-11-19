import type { ReactNode } from 'react';

import { BASE_DEMOS } from '@/docs/demos/base';
import { MAPS_DEMOS } from '@/docs/demos/maps';
import { PATTERNS_DEMOS } from '@/docs/demos/patterns';
import { CONTENT_DEMOS } from '@/docs/demos/content';
import { RULES_DEMOS } from '@/docs/demos/rules';
import { INPUTS_DEMOS } from '@/docs/demos/inputs';
import { FEEDBACK_DEMOS } from '@/docs/demos/feedback';
import { BLOCKS_DEMOS } from '@/docs/demos/blocks';
import { CHAT_DEMOS } from '@/docs/demos/chat';
import { INSTRUMENTS_DEMOS } from '@/docs/demos/instruments';
import { DATA_DEMOS } from '@/docs/demos/data';
import { OVERLAYS_DEMOS } from '@/docs/demos/overlays';
import { DISPLAY_DEMOS } from '@/docs/demos/display';
import { FORMS_DEMOS } from '@/docs/demos/forms';

// One demo per registry item, keyed by item name. Items without one show
// their description only.

type SwatchSpec = { name: string; token: string; hex: string };

// the core palette: Gold Standard, Jet and White
const CORE: SwatchSpec[] = [
  { name: 'Gold Standard', token: 'hope', hex: '#FEAF0E' },
  { name: 'Jet', token: 'jet', hex: '#000000' },
  { name: 'White', token: 'background', hex: '#FFFFFF' },
];

// the systems palette: the greys the interface is built from
const SYSTEMS: SwatchSpec[] = [
  { name: 'Slate', token: 'slate', hex: '#000000' },
  { name: 'Concrete', token: 'concrete', hex: '#7C7C7C' },
  { name: 'Cement', token: 'cement', hex: '#B1B1B1' },
  { name: 'Ash', token: 'ash', hex: '#D9D9D9' },
  { name: 'Base-Gray', token: 'base-grey', hex: '#ECECEC' },
];

// the expanded palette: the tag families, 01 (lightest) to 04 (darkest)
const EXPANDED: { family: string; prefix: string; hexes: string[] }[] = [
  { family: 'Gold Standard', prefix: 'gold', hexes: ['#FEE6B2', '#FEDB92', '#FEC54E', '#FEAF0D'] },
  { family: 'Blueprint', prefix: 'blueprint', hexes: ['#BCE1F8', '#8BCBF3', '#40AAEB', '#1283CA'] },
  { family: 'Groundwork', prefix: 'groundwork', hexes: ['#DACDC9', '#A2908B', '#85655D', '#482921'] },
  { family: 'Greenlight', prefix: 'greenlight', hexes: ['#C2E5D4', '#76C09E', '#39C25E', '#003D1F'] },
  { family: 'Ribbon Cutting', prefix: 'ribbon', hexes: ['#F9D2D3', '#E39394', '#B90B0E', '#690002'] },
];

const TINTS = ['hope-tint', 'sky-tint', 'field-tint', 'ash-tint'];
const STATUS = ['primary', 'ok', 'info', 'warning', 'destructive'];
const SURFACES = ['background', 'card', 'muted', 'accent', 'secondary', 'border', 'input'];

function Swatch({ token, name, hex }: { token: string; name?: string; hex?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="h-14 w-28 border border-border" style={{ background: hex ?? `var(--${token})` }} />
      {name ? (
        <span className="flex flex-col text-xs">
          <span>{name}</span>
          <span className="text-muted-foreground">{hex}</span>
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">{token}</span>
      )}
    </div>
  );
}

function Swatches({ title, tokens }: { title: string; tokens: string[] }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="eyebrow-type text-muted-foreground">{title}</h3>
      <div className="flex flex-wrap gap-4">
        {tokens.map((t) => (
          <Swatch key={t} token={t} />
        ))}
      </div>
    </section>
  );
}

function NamedSwatches({ title, swatches }: { title: string; swatches: SwatchSpec[] }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="eyebrow-type text-muted-foreground">{title}</h3>
      <div className="flex flex-wrap gap-4">
        {swatches.map((s) => (
          <Swatch key={s.name} {...s} />
        ))}
      </div>
    </section>
  );
}

function ExpandedPalette() {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="eyebrow-type text-muted-foreground">Expanded palette</h3>
      <div className="flex flex-wrap gap-4">
        {EXPANDED.map(({ family, prefix, hexes }) => (
          <div key={family} className="flex flex-col gap-4">
            {hexes.map((hex, i) => (
              <Swatch key={hex} token={`${prefix}-${i + 1}00`} name={`${family} 0${i + 1}`} hex={hex} />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function ThemeDemo() {
  return (
    <div className="flex flex-col gap-10">
      <NamedSwatches title="Core palette" swatches={CORE} />
      <ExpandedPalette />
      <NamedSwatches title="Systems palette" swatches={SYSTEMS} />
      <Swatches title="Eyebrow tints" tokens={TINTS} />
      <Swatches title="Actions and status" tokens={STATUS} />
      <Swatches title="Surfaces" tokens={SURFACES} />
      <section className="flex flex-col gap-3">
        <h3 className="eyebrow-type text-muted-foreground">Type</h3>
        <p className="text-6xl leading-tight tracking-tight">The operating system for modern government</p>
        <p className="text-3xl">Simplify services for the public</p>
        <p className="text-xl font-bold">Faster permit decisions mean fewer delays</p>
        <p className="max-w-prose text-lg">
          Give your community an intuitive way to access critical services, make payments, and get questions answered online 24/7.
        </p>
        <p className="text-sm text-muted-foreground">Light 300 for body, Regular 400 for headlines, Bold 700 for subheads.</p>
        <p className="eyebrow-type">Eyebrow · uppercase · 4% tracking</p>
      </section>
      <section className="flex flex-col gap-3">
        <h3 className="eyebrow-type text-muted-foreground">The AI’s mark</h3>
        <p className="max-w-prose text-sm text-muted-foreground">
          The one gradient: what the assistant and the AI readers do wears a slow band of the brand’s colours. ai-border on a card or
          button, ai-edge down a panel’s left side. It holds still for reduced motion.
        </p>
        <div className="flex flex-wrap items-start gap-4">
          <div className="ai-border max-w-sm bg-card p-5">
            <p className="text-lg">Automated review</p>
            <p className="text-sm text-muted-foreground">Read 4 documents with two readers · 19 checks passed</p>
          </div>
          <div className="ai-edge relative max-w-sm border border-border bg-card p-5 pl-6">
            <p className="text-lg">Assistant</p>
            <p className="text-sm text-muted-foreground">Ask about the caseload, or have it act.</p>
          </div>
        </div>
      </section>
      <section className="flex flex-col gap-3">
        <h3 className="eyebrow-type text-muted-foreground">Base grid</h3>
        <div className="base-grid flex h-48 items-end p-6">
          <p className="text-3xl">
            Twinsburg,
            <br />
            OH
          </p>
        </div>
      </section>
    </div>
  );
}

export const DEMOS: Record<string, () => ReactNode> = {
  ...BASE_DEMOS,
  ...MAPS_DEMOS,
  ...PATTERNS_DEMOS,
  ...CONTENT_DEMOS,
  ...RULES_DEMOS,
  ...INPUTS_DEMOS,
  ...FEEDBACK_DEMOS,
  ...BLOCKS_DEMOS,
  ...CHAT_DEMOS,
  ...INSTRUMENTS_DEMOS,
  ...DATA_DEMOS,
  ...OVERLAYS_DEMOS,
  ...DISPLAY_DEMOS,
  ...FORMS_DEMOS,
  theme: ThemeDemo,
};
