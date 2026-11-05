import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { ChevronRight, CircleHelp, Menu, PanelLeftClose, PanelLeftOpen, Search, Settings, Sparkles } from 'lucide-react';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { FlagMark, GovWellLogo } from '@/components/ui/flag-mark';
import { Kbd } from '@/components/ui/kbd';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import { ME, TOWN } from './data';

// The staff app's frame, laid out like GovWell's app today (SidebarLayout):
// a 230px sidebar standing on a Slate ground — logo and collapse button,
// Search (⌘K) and the AI assistant, then the nav in collapsible groups, then
// the town, the signed-in person, help and settings — beside one white,
// bordered content panel inset from the top and right. The assistant opens
// as a 400px panel beside it. ⌘\ collapses the sidebar to a 48px rail; under
// md it's a top bar and a drawer.

export type NavLeaf = { href: string; label: string; icon?: ComponentType<{ className?: string }>; count?: number };
export type NavGroup = { label: string; icon: ComponentType<{ className?: string }>; href?: string; items?: NavLeaf[] };

type ShellProps = {
  nav: NavGroup[];
  path: string;
  onSearch: () => void;
  assistant: ReactNode | null;
  onAssistant: () => void;
  children: ReactNode;
};

// on Slate the theme's Slate focus ring would vanish; Hope reads on it (as in the app-shell block)
const ring = 'outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-solid focus-visible:outline-hope';
const row = cn('flex h-9 w-full shrink-0 items-center gap-3 px-3 text-sm font-light text-ash hover:bg-white/5 hover:text-white', ring);

const isActive = (href: string, path: string) => path === href || path.startsWith(`${href}/`);

export function Shell({ nav, path, onSearch, assistant, onAssistant, children }: ShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  // the drawer remembers the page it was opened on, so moving to another page closes it
  const [drawerAt, setDrawerAt] = useState<string | null>(null);
  const drawer = drawerAt === path;
  const setDrawer = (open: boolean) => setDrawerAt(open ? path : null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault();
        setCollapsed((c) => !c);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <TooltipProvider>
      <div className="flex h-dvh flex-col bg-slate text-white md:flex-row">
        {/* the first stop for the keyboard, as GovWell's SkipToContent (WCAG 2.4.1) */}
        <a
          href="#main"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById('main')?.focus();
          }}
          className={
            'sr-only z-50 bg-primary px-4 py-3 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:outline-2 focus:outline-offset-2 focus:outline-solid focus:outline-hope'
          }
        >
          Skip to content
        </a>
        {/* phone: a top bar with the logo and a menu button */}
        <header className="flex h-14 shrink-0 items-center justify-between px-4 md:hidden">
          <GovWellLogo className="h-5" title="GovWell" />
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setDrawer(true)}
            className={cn('grid size-10 place-items-center', ring)}
          >
            <Menu className="size-5" />
          </button>
        </header>
        <Sheet open={drawer} onOpenChange={setDrawer}>
          <SheetContent side="left" className="w-[280px] border-r-0 bg-slate p-0 text-white">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <Sidebar nav={nav} path={path} collapsed={false} onSearch={onSearch} onAssistant={onAssistant} />
          </SheetContent>
        </Sheet>

        <div
          className={cn('hidden shrink-0 transition-[width] duration-200 ease-out md:flex', collapsed ? 'w-12' : 'w-[230px]')}
          data-collapsed={collapsed || undefined}
        >
          <Sidebar
            nav={nav}
            path={path}
            collapsed={collapsed}
            onToggle={() => setCollapsed((c) => !c)}
            onSearch={onSearch}
            onAssistant={onAssistant}
          />
        </div>

        {/* the content panel, inset from the top and right edges on wide screens */}
        <div className="flex min-h-0 min-w-0 flex-1 gap-2.5 md:mt-2.5 md:mr-2.5">
          <main
            id="main"
            tabIndex={-1}
            className="min-w-0 flex-1 overflow-y-auto border-border bg-background text-foreground outline-none md:border"
          >
            {children}
          </main>
          {assistant && (
            <aside
              aria-label="AI assistant"
              className="hidden w-[400px] shrink-0 flex-col border border-border bg-background text-foreground duration-200 animate-in slide-in-from-right-4 lg:flex"
            >
              {assistant}
            </aside>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

type SidebarProps = {
  nav: NavGroup[];
  path: string;
  collapsed: boolean;
  onToggle?: () => void;
  onSearch: () => void;
  onAssistant: () => void;
};

function Sidebar({ nav, path, collapsed, onToggle, onSearch, onAssistant }: SidebarProps) {
  // groups start open when they hold the current page; the rest stay as left
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const isOpen = (g: NavGroup) => open[g.label] ?? !!g.items?.some((i) => isActive(i.href.replace(/^#/, ''), path));

  return (
    <nav aria-label="Main" className="flex h-full w-full flex-col overflow-hidden">
      <div className="flex flex-col gap-2 p-2">
        <div className={cn('flex items-center', collapsed ? 'flex-col gap-1' : 'justify-between')}>
          <a
            href="#/insights"
            aria-label="GovWell, home"
            className={cn('flex h-10 items-center', collapsed ? 'justify-center' : 'pl-2', ring)}
          >
            {collapsed ? <FlagMark className="h-4" /> : <GovWellLogo className="h-5" />}
          </a>
          {onToggle && (
            <Hint label={`${collapsed ? 'Expand' : 'Collapse'} sidebar · ⌘\\`} side="right">
              <button
                type="button"
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                onClick={onToggle}
                className={cn('grid size-8 place-items-center text-cement hover:bg-white/10 hover:text-white', ring)}
              >
                {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
              </button>
            </Hint>
          )}
        </div>
        <Hint label={collapsed ? 'Search · ⌘K' : null} side="right">
          <button
            type="button"
            aria-label={collapsed ? 'Search' : undefined}
            onClick={onSearch}
            className={cn(
              'flex h-9 items-center gap-3 border border-white/15 bg-white/5 text-sm font-light text-cement hover:border-white/60 hover:text-white',
              collapsed ? 'w-8 justify-center self-center' : 'px-3',
              ring,
            )}
          >
            <Search className="size-4 shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">Search</span>
                <Kbd className="bg-white/10 text-cement">⌘K</Kbd>
              </>
            )}
          </button>
        </Hint>
        <Hint label={collapsed ? 'AI assistant' : null} side="right">
          <button
            type="button"
            aria-label={collapsed ? 'AI assistant' : undefined}
            onClick={onAssistant}
            className={cn(
              'flex h-9 items-center gap-3 bg-white text-sm font-light text-slate hover:bg-ash',
              collapsed ? 'w-8 justify-center self-center' : 'px-3',
              ring,
            )}
          >
            <Sparkles className="size-4 shrink-0" />
            {!collapsed && <span>Ask the assistant</span>}
          </button>
        </Hint>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-px overflow-x-hidden overflow-y-auto px-2 pt-1.5 pb-2">
        {nav.map((group) =>
          group.items && !collapsed ? (
            <Collapsible key={group.label} open={isOpen(group)} onOpenChange={(o) => setOpen((s) => ({ ...s, [group.label]: o }))}>
              <CollapsibleTrigger className={cn(row, 'group/trigger')}>
                <group.icon className="size-4 shrink-0" />
                <span className="flex-1 truncate text-left">{group.label}</span>
                <ChevronRight className="size-3.5 shrink-0 text-cement group-data-[panel-open]/trigger:rotate-90" />
              </CollapsibleTrigger>
              <CollapsibleContent className="flex flex-col gap-px pb-1">
                {group.items.map((item) => (
                  <NavLink key={item.href} item={item} path={path} indent />
                ))}
              </CollapsibleContent>
            </Collapsible>
          ) : (
            <NavLink
              key={group.label}
              item={{ href: group.href ?? group.items![0]!.href, label: group.label, icon: group.icon }}
              path={path}
              collapsed={collapsed}
              activeFor={group.items?.map((i) => i.href)}
            />
          ),
        )}
      </div>

      <div className="flex flex-col gap-px border-t border-white/10 p-2">
        {!collapsed && <div className="px-3 pt-1 pb-2 text-xs text-cement">{TOWN.name}</div>}
        <Hint label={collapsed ? ME.name : null} side="right">
          <a href="#/profile" className={cn(row, collapsed && 'justify-center px-0')}>
            <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-full bg-hope text-[0.625rem] text-slate">
              {ME.name
                .split(' ')
                .map((w) => w[0])
                .join('')}
            </span>
            {/* named by its text: an aria-label would leave out the visible initials */}
            <span className={collapsed ? 'sr-only' : 'truncate'}>{ME.name}</span>
          </a>
        </Hint>
        <NavLink item={{ href: '#/help', label: 'Get help', icon: CircleHelp }} path={path} collapsed={collapsed} />
        <NavLink item={{ href: '#/settings', label: 'Settings', icon: Settings }} path={path} collapsed={collapsed} />
      </div>
    </nav>
  );
}

function NavLink({
  item,
  path,
  indent,
  collapsed,
  activeFor,
}: {
  item: NavLeaf;
  path: string;
  indent?: boolean;
  collapsed?: boolean;
  activeFor?: string[];
}) {
  const href = item.href.replace(/^#/, '');
  const active = (activeFor ?? [item.href]).some((h) => isActive(h.replace(/^#/, ''), path)) || isActive(href, path);
  const Icon = item.icon;
  const link = (
    <a
      href={item.href}
      aria-current={active ? 'page' : undefined}
      aria-label={collapsed ? item.label : undefined}
      className={cn(
        row,
        'relative',
        indent && 'pl-10',
        collapsed && 'justify-center px-0',
        active && 'bg-white/10 font-normal text-white before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-primary',
      )}
    >
      {Icon && !indent && <Icon className="size-4 shrink-0" />}
      {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
      {!collapsed && item.count ? (
        <span className="min-w-5 bg-hope px-1.5 text-center text-xs text-slate tabular-nums">{item.count}</span>
      ) : null}
    </a>
  );
  return collapsed ? (
    <Hint label={item.label} side="right">
      {link}
    </Hint>
  ) : (
    link
  );
}

function Hint({ label, side, children }: { label: string | null; side: 'right'; children: React.ReactElement }) {
  if (!label) return children;
  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
  );
}
