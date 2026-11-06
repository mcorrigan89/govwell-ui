import type { ReactNode } from 'react';

import { BASE_DEMOS } from '@/docs/demos/base';
import { BLOCKS_DEMOS } from '@/docs/demos/blocks';
import { CHAT_DEMOS } from '@/docs/demos/chat';
import { INSTRUMENTS_DEMOS } from '@/docs/demos/instruments';
import { DATA_DEMOS } from '@/docs/demos/data';
import { OVERLAYS_DEMOS } from '@/docs/demos/overlays';
import { DISPLAY_DEMOS } from '@/docs/demos/display';
import { FORMS_DEMOS } from '@/docs/demos/forms';

// One demo per registry item, keyed by item name. Items without one show
// their description only.

const BRAND = ['jet', 'slate', 'concrete', 'cement', 'ash', 'base-grey', 'hope', 'sky', 'field'];
const TINTS = ['hope-tint', 'sky-tint', 'field-tint', 'ash-tint'];
const STATUS = ['primary', 'ok', 'info', 'warning', 'destructive'];
const SURFACES = ['background', 'card', 'muted', 'accent', 'secondary', 'border', 'input'];

function Swatch({ token }: { token: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="h-14 w-28 border border-border" style={{ background: `var(--${token})` }} />
      <span className="text-xs text-muted-foreground">{token}</span>
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

function ThemeDemo() {
  return (
    <div className="flex flex-col gap-10">
      <Swatches title="Brand palette" tokens={BRAND} />
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
  ...BLOCKS_DEMOS,
  ...CHAT_DEMOS,
  ...INSTRUMENTS_DEMOS,
  ...DATA_DEMOS,
  ...OVERLAYS_DEMOS,
  ...DISPLAY_DEMOS,
  ...FORMS_DEMOS,
  theme: ThemeDemo,
};
