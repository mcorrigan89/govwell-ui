import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { applyColorMode, useColorMode, type ColorMode } from '@/hooks/use-color-mode';
import { DEMOS } from '@/docs/demos';
import items from '@/docs/items.generated.json';
import { cn } from '@/lib/utils';
import logo from '../assets/govwell-logo.svg?raw';
import './styles.css';

// A plain preview: every registry item with its demo. Not a docs site; just
// enough to look at things while building them. The sidebar opens one item
// at #/<name> (#/ or no hash shows them all). ?item=<name>,<name> shows a
// fixed few, which is handy for screenshots.
const only = new URLSearchParams(location.search).get('item');
const pinned = only ? items.filter((item) => only.split(',').includes(item.name)) : items;

const MODES: { mode: ColorMode; label: string }[] = [
  { mode: 'light', label: 'Light' },
  { mode: 'dark', label: 'Dark' },
  { mode: 'system', label: 'System' },
];

/** the item named by the #/<name> hash, or null for all of them */
function routeFromHash(): string | null {
  const name = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
  return items.some((item) => item.name === name) ? name : null;
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

function Preview() {
  const [mode, setMode] = useColorMode();
  const route = useRoute();
  const shown = route ? items.filter((item) => item.name === route) : pinned;
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
      </header>
      <div className="mx-auto flex max-w-6xl gap-12 px-6 py-12">
        {/* scrolls on its own: the list is taller than most windows */}
        <nav
          aria-label="Components"
          className="sticky top-6 hidden max-h-[calc(100vh-3rem)] w-48 shrink-0 flex-col gap-0.5 self-start overflow-y-auto text-sm md:flex"
        >
          <a href="#/" aria-current={route ? undefined : 'page'} className={cn(navLink(!route), 'mb-3')}>
            All components
          </a>
          {items.map((item) => (
            <a
              key={item.name}
              href={`#/${item.name}`}
              aria-current={route === item.name ? 'page' : undefined}
              className={navLink(route === item.name)}
            >
              {item.title}
            </a>
          ))}
        </nav>
        <main className="flex min-w-0 flex-1 flex-col gap-20">
          {shown.map((item) => {
            const Demo = DEMOS[item.name];
            return (
              <section key={item.name} id={item.name} className="flex flex-col gap-6">
                <div className="flex flex-col gap-3 border-t border-border pt-6">
                  <span className="eyebrow-type text-muted-foreground">{item.type.replace('registry:', '')}</span>
                  <h2 className="text-4xl">
                    <a href={`#/${item.name}`}>{item.title}</a>
                  </h2>
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
          })}
        </main>
      </div>
    </div>
  );
}

// before React renders, so a dark reload doesn't flash light
applyColorMode();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Preview />
  </StrictMode>,
);
