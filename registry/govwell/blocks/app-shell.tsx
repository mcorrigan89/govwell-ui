'use client';

import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { ChevronsLeft, ChevronsRight, Menu, XIcon } from 'lucide-react';

import { FlagMark, GovWellLogo } from '@/components/ui/flag-mark';
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// The staff app's frame, in GovWell's look: a Slate sidebar (like
// govwell.com's dark header) with the GovWell logo at the top and the
// navigation grouped by the kind of work — casework, insight, setup — rather
// than a crowded top bar. The current page is marked with a Hope bar on its
// left edge; counts sit in small Hope squares. The page itself stays white,
// under a white top bar for your own things (search, the signed-in person).
//
// The sidebar collapses to an icon rail (remembered per browser), each icon
// naming itself in a tooltip; on a phone it's a drawer. The nav is data: hide
// what this person shouldn't be offered (a module the organization hasn't
// enabled, setup for non-admins) with `hidden`, and a section with nothing
// left in it disappears. No auth or organization logic lives in here.
//
// Router-agnostic: links render as <a> unless you pass `renderLink` — e.g.
//   renderLink={({ href, children, ...props }) => <Link to={href} {...props}>{children}</Link>}

export type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  /** a count to show beside the label (e.g. inspections due); hidden when 0 or missing */
  badge?: number;
  /** what the count means, for screen readers (e.g. "3 overdue"); default the number */
  badgeLabel?: string;
  /** leave it out of the nav (the caller decides: module not enabled, not an admin…) */
  hidden?: boolean;
  /** active only on this exact href, not on pages under it */
  exact?: boolean;
  /** extra attributes for the link (data-*, aria-*) */
  attrs?: Record<string, string>;
};
export type NavSection = { title: string; items: NavItem[] };

export type AppShellLinkProps = {
  href: string;
  className: string;
  /** "page" on the current page's link */
  'aria-current'?: 'page' | undefined;
  onClick?: (() => void) | undefined;
  children: ReactNode;
  attrs?: Record<string, string> | undefined;
};

const defaultLink = ({ href, className, onClick, children, attrs, ...rest }: AppShellLinkProps) => (
  <a href={href} className={className} onClick={onClick} aria-current={rest['aria-current']} {...attrs}>
    {children}
  </a>
);

/** whether `item` is the current page: an exact match, or a page under it unless `exact` */
export function isNavItemActive(item: Pick<NavItem, 'href' | 'exact'>, activeHref: string | undefined) {
  if (!activeHref) return false;
  if (activeHref === item.href) return true;
  if (item.exact) return false;
  const base = item.href.endsWith('/') ? item.href : `${item.href}/`;
  return activeHref.startsWith(base);
}

const visible = (sections: NavSection[]) =>
  sections.map((s) => ({ ...s, items: s.items.filter((i) => !i.hidden) })).filter((s) => s.items.length > 0);

const DEFAULT_STORAGE_KEY = 'govwell.sidebar.collapsed';

// on Slate the theme's Slate focus ring would vanish; Hope reads on it
const sidebarFocus =
  'outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-solid focus-visible:outline-hope';

const countText = (n: number) => (n > 99 ? '99+' : String(n));

type Brand = {
  /** where the logo goes; default "/" */
  href?: string;
  /** the accessible name of the logo link; default "GovWell" */
  name?: string;
  /** a line under the logo, e.g. the organization's name */
  caption?: ReactNode;
};

function SidebarBrand({ brand, narrow, close }: { brand: Brand; narrow: boolean; close?: ReactNode }) {
  const name = brand.name ?? 'GovWell';
  return (
    <div className={cn('flex h-16 shrink-0 items-center gap-2 border-b border-white/10 px-5', narrow && 'justify-center px-0')}>
      <a href={brand.href ?? '/'} aria-label={name} className={cn('flex min-w-0 flex-col gap-1 text-white', sidebarFocus)}>
        {narrow ? <FlagMark className="h-5" /> : <GovWellLogo className="h-5" />}
        {!narrow && brand.caption && <span className="truncate text-xs text-cement">{brand.caption}</span>}
      </a>
      {close}
    </div>
  );
}

export function AppShell({
  sections,
  footer = [],
  activeHref,
  brand = {},
  topBar,
  renderLink = defaultLink,
  storageKey = DEFAULT_STORAGE_KEY,
  fullBleed = false,
  className,
  children,
}: {
  /** the nav, grouped by the kind of work */
  sections: NavSection[];
  /** links pinned to the bottom of the sidebar (public portal, API docs…) */
  footer?: NavItem[];
  /** the current page's href; an item is active on it, or on pages under it unless `exact` */
  activeHref?: string;
  brand?: Brand;
  /** the top bar's content, right of the menu button */
  topBar?: ReactNode;
  renderLink?: (props: AppShellLinkProps) => ReactNode;
  /** the localStorage key that remembers the collapsed rail */
  storageKey?: string;
  /** give the page the whole width and height, without the centred column (a review workspace, a map) */
  fullBleed?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  // read after mount, not in useState's initializer, so a server render and
  // the first client render agree
  useEffect(() => {
    try {
      // oxlint-disable-next-line react/set-state-in-effect
      setCollapsed(window.localStorage.getItem(storageKey) === '1');
    } catch {
      // no storage: start expanded
    }
  }, [storageKey]);
  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      window.localStorage.setItem(storageKey, next ? '1' : '0');
    } catch {
      // not remembered this time
    }
  };

  const shown = visible(sections);
  const shownFooter = footer.filter((i) => !i.hidden);

  const nav = (narrow: boolean, onNavigate?: () => void) => {
    const link = (item: NavItem) => {
      const active = isNavItemActive(item, activeHref);
      const count = item.badge && item.badge > 0 ? item.badge : 0;
      return renderLink({
        href: item.href,
        onClick: onNavigate,
        attrs: item.attrs,
        'aria-current': active ? 'page' : undefined,
        className: cn(
          'relative flex h-10 items-center gap-3 border-l-4 border-transparent pr-3 pl-4 text-sm font-light text-ash transition-colors hover:bg-white/5 hover:text-white',
          sidebarFocus,
          active && 'border-hope bg-white/10 font-normal text-white',
          narrow && 'justify-center px-0 pr-1',
        ),
        children: (
          <>
            <item.icon className="size-4 shrink-0" />
            {/* on the rail the label is only for screen readers; the tooltip shows it */}
            <span className={narrow ? 'sr-only' : 'min-w-0 flex-1 truncate'}>{item.label}</span>
            {count > 0 && (
              <>
                {/* read as "Code cases, 3 overdue"; the square is only for the eye */}
                <span className="sr-only">, {item.badgeLabel ?? countText(count)}</span>
                {narrow ? (
                  <span aria-hidden className="absolute top-1.5 right-2.5 size-2 bg-hope" />
                ) : (
                  <span
                    aria-hidden
                    data-slot="app-shell-badge"
                    className="flex h-5 min-w-5 items-center justify-center bg-hope px-1.5 text-xs font-normal text-slate tabular-nums"
                  >
                    {countText(count)}
                  </span>
                )}
              </>
            )}
          </>
        ),
      });
    };
    // on the rail each icon names itself in a tooltip, on hover or focus
    const row = (item: NavItem) =>
      narrow ? (
        <Tooltip key={item.href}>
          <TooltipTrigger render={<div />}>{link(item)}</TooltipTrigger>
          <TooltipContent side="right">
            {item.label}
            {item.badge ? ` · ${countText(item.badge)}` : null}
          </TooltipContent>
        </Tooltip>
      ) : (
        <div key={item.href}>{link(item)}</div>
      );
    return (
      <nav aria-label="Main" className="flex flex-1 flex-col gap-6 overflow-y-auto py-5">
        {shown.map((section) => (
          <div key={section.title} role="group" aria-label={section.title} className="space-y-0.5">
            {narrow ? (
              <div aria-hidden className="mx-4 mb-2 h-px bg-white/10 first:hidden" />
            ) : (
              <div aria-hidden className="eyebrow-type px-5 pb-2 text-xs text-cement">
                {section.title}
              </div>
            )}
            {section.items.map(row)}
          </div>
        ))}
        {shownFooter.length > 0 && <div className="mt-auto space-y-0.5 border-t border-white/10 pt-4">{shownFooter.map(row)}</div>}
      </nav>
    );
  };

  return (
    <TooltipProvider>
      <div data-slot="app-shell" className={cn('flex min-h-screen bg-background text-foreground', className)}>
        <aside
          data-slot="app-shell-sidebar"
          data-collapsed={collapsed || undefined}
          className={cn(
            'sticky top-0 hidden h-screen shrink-0 flex-col border-r border-white/10 bg-slate text-white transition-[width] duration-150 md:flex print:hidden',
            collapsed ? 'w-16' : 'w-60',
          )}
        >
          <SidebarBrand brand={brand} narrow={collapsed} />
          {nav(collapsed)}
          <button
            type="button"
            onClick={toggle}
            className={cn(
              'flex h-12 shrink-0 items-center justify-center gap-2 border-t border-white/10 text-sm text-cement transition-colors hover:text-white',
              sidebarFocus,
            )}
            aria-label={collapsed ? 'Expand the sidebar' : 'Collapse the sidebar'}
          >
            {collapsed ? (
              <ChevronsRight className="size-4" />
            ) : (
              <>
                <ChevronsLeft className="size-4" /> Collapse
              </>
            )}
          </button>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header
            data-slot="app-shell-top-bar"
            className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background px-4 md:px-6 print:hidden"
          >
            <Sheet open={drawer} onOpenChange={setDrawer}>
              <SheetTrigger
                className="flex size-10 items-center justify-center border border-input text-foreground transition-colors outline-none hover:border-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring md:hidden"
                aria-label="Open navigation"
              >
                <Menu className="size-4" />
              </SheetTrigger>
              <SheetContent side="left" showCloseButton={false} className="w-72 gap-0 border-r-0 bg-slate p-0 text-white">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <SidebarBrand
                  brand={brand}
                  narrow={false}
                  close={
                    <SheetClose
                      aria-label="Close navigation"
                      className={cn('ml-auto flex size-10 items-center justify-center text-cement hover:text-white', sidebarFocus)}
                    >
                      <XIcon className="size-4" />
                    </SheetClose>
                  }
                />
                {nav(false, () => setDrawer(false))}
              </SheetContent>
            </Sheet>
            {topBar}
          </header>
          <main
            data-slot="app-shell-main"
            className={fullBleed ? 'flex min-h-0 w-full flex-1 flex-col' : 'mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-6'}
          >
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
