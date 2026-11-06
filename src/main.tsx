import { Fragment, StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { applyColorMode, useColorMode, type ColorMode } from '@/hooks/use-color-mode';
import { DEMOS } from '@/docs/demos';
import catalog from '@/docs/items.generated.json';
import { cn } from '@/lib/utils';
import { ExampleApp } from './example-app/app';
import logo from '../assets/govwell-logo.svg?raw';
import './styles.css';

// A plain preview: every registry item with its demo, grouped by category.
// Not a docs site; just enough to look at things while building them.
//   #/                 everything
//   #/c/<category>     one category
//   #/<name>           one item
// ?item=<name>,<name> shows a fixed few, which is handy for screenshots.
// ?example=app is the sample staff app (src/example-app), full screen.
const { categories, items } = catalog;
type Item = (typeof items)[number];

const only = new URLSearchParams(location.search).get('item');
const pinned = only ? items.filter((item) => only.split(',').includes(item.name)) : items;

const MODES: { mode: ColorMode; label: string }[] = [
  { mode: 'light', label: 'Light' },
  { mode: 'dark', label: 'Dark' },
  { mode: 'system', label: 'System' },
];

type Route = { kind: 'all' } | { kind: 'category'; id: string } | { kind: 'item'; name: string };

function routeFromHash(): Route {
  const path = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
  const category = path.match(/^c\/(.+)$/)?.[1];
  if (category && categories.some((c) => c.id === category)) return { kind: 'category', id: category };
  if (items.some((item) => item.name === path)) return { kind: 'item', name: path };
  return { kind: 'all' };
}

function useRoute() {
  const [route, setRoute] = useState(routeFromHash);
  useEffect(() => {
    const onHashChange = () => {
      setRoute(routeFromHash());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  return route;
}

function ItemSection({ item }: { item: Item }) {
  const Demo = DEMOS[item.name];
  return (
    <section id={item.name} className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 border-t border-border pt-6">
        <span className="eyebrow-type text-muted-foreground">{item.type.replace('registry:', '')}</span>
        <h3 className="text-4xl">
          <a href={`#/${item.name}`}>{item.title}</a>
        </h3>
        <p className="max-w-prose text-muted-foreground">{item.description}</p>
      </div>
      {Demo && (
        // a block, so a lone trigger button keeps its own width
        <div>
          <Demo />
        </div>
      )}
    </section>
  );
}

function Preview() {
  const [mode, setMode] = useColorMode();
  const route = useRoute();

  // what the main column shows, already grouped by category
  const shown =
    route.kind === 'item'
      ? items.filter((item) => item.name === route.name)
      : route.kind === 'category'
        ? items.filter((item) => item.category === route.id)
        : pinned;
  const groups = categories
    .map((category) => ({ ...category, items: shown.filter((item) => item.category === category.id) }))
    .filter((group) => group.items.length > 0);
  // a single item doesn't need its category spelled out above it
  const showCategoryHeads = route.kind !== 'item';

  const activeCategory =
    route.kind === 'category' ? route.id : route.kind === 'item' ? items.find((i) => i.name === route.name)?.category : undefined;

  const navLink = (active: boolean) =>
    cn(
      'block border-l-2 px-3 py-1 hover:text-foreground',
      active ? 'border-primary font-normal text-foreground' : 'border-transparent text-muted-foreground',
    );

  return (
    <div className="min-h-screen">
      {/* the site's own header: Slate, the white logo, plain links */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-slate px-6 py-4 text-white">
        <a href="#/" aria-label="GovWell UI, all components" className="flex items-center gap-3">
          {/* the logo SVG is GovWell's own, drawn in currentColor */}
          <span className="block w-32 [&_svg]:block [&_svg]:h-auto [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: logo }} />
          <span className="text-sm text-cement">UI</span>
        </a>
        <div className="flex flex-wrap items-center gap-4">
          <a href="?example=app#/insights" className="text-sm text-cement underline-offset-4 hover:text-white hover:underline">
            Sample app
          </a>
          <div role="group" aria-label="Colour mode" className="flex gap-1">
            {MODES.map((m) => (
              <button
                key={m.mode}
                type="button"
                aria-pressed={mode === m.mode}
                onClick={() => setMode(m.mode)}
                className={cn(
                  'h-8 px-3 text-sm outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-hope',
                  mode === m.mode ? 'bg-hope text-slate' : 'text-cement hover:text-white',
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-6xl gap-12 px-6 py-12">
        {/* scrolls on its own: the list is taller than most windows */}
        <nav
          aria-label="Components"
          className="sticky top-6 hidden max-h-[calc(100vh-3rem)] w-52 shrink-0 flex-col gap-6 self-start overflow-y-auto pb-6 text-sm md:flex"
        >
          <a href="#/" aria-current={route.kind === 'all' ? 'page' : undefined} className={navLink(route.kind === 'all')}>
            All components
          </a>
          {categories.map((category) => {
            const members = items.filter((item) => item.category === category.id);
            const isCurrent = route.kind === 'category' && route.id === category.id;
            return (
              <div key={category.id} className="flex flex-col gap-0.5">
                <a
                  href={`#/c/${category.id}`}
                  aria-current={isCurrent ? 'page' : undefined}
                  className={cn(
                    'eyebrow-type mb-1 flex items-baseline justify-between px-3 py-1 text-xs hover:text-foreground',
                    isCurrent || activeCategory === category.id ? 'text-foreground' : 'text-muted-foreground',
                    isCurrent && 'bg-hope-tint text-tint-foreground',
                  )}
                >
                  {category.title}
                  <span className="tabular-nums">{members.length}</span>
                </a>
                {members.map((item) => (
                  <a
                    key={item.name}
                    href={`#/${item.name}`}
                    aria-current={route.kind === 'item' && route.name === item.name ? 'page' : undefined}
                    className={navLink(route.kind === 'item' && route.name === item.name)}
                  >
                    {item.title}
                  </a>
                ))}
              </div>
            );
          })}
        </nav>
        <main className="flex min-w-0 flex-1 flex-col gap-24">
          {groups.map((group) => (
            <Fragment key={group.id}>
              <div className="flex flex-col gap-20">
                {showCategoryHeads && (
                  // the category as a page heading: an eyebrow with the count over a large title
                  <header className="flex flex-col gap-3">
                    <span className="eyebrow-type w-fit bg-hope-tint px-2.5 py-1.5 text-xs text-tint-foreground">
                      {group.items.length} {group.items.length === 1 ? 'item' : 'items'}
                    </span>
                    <h2 className="text-6xl leading-none tracking-tight">
                      <a href={`#/c/${group.id}`}>{group.title}</a>
                    </h2>
                  </header>
                )}
                {group.items.map((item) => (
                  <ItemSection key={item.name} item={item} />
                ))}
              </div>
            </Fragment>
          ))}
        </main>
      </div>
    </div>
  );
}

// before React renders, so a dark reload doesn't flash light
applyColorMode();

const example = new URLSearchParams(location.search).get('example') === 'app';

createRoot(document.getElementById('root')!).render(<StrictMode>{example ? <ExampleApp /> : <Preview />}</StrictMode>);
