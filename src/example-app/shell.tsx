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
// a 230px sidebar standing on the grey ground — logo and collapse button,
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

const ring = 'outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring';
const row = cn('flex h-9 w-full shrink-0 items-center gap-3 px-3 text-sm font-light text-foreground hover:bg-background', ring);

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
      <div className="flex h-dvh flex-col bg-muted text-foreground md:flex-row">
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
          <SheetContent side="left" className="w-[280px] bg-muted p-0">
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
          <main id="main" tabIndex={-1} className="min-w-0 flex-1 overflow-y-auto border-border bg-background outline-none md:border">
            {children}
          </main>
          {assistant && (
            <aside
              aria-label="AI assistant"
              className="hidden w-[400px] shrink-0 flex-col border border-border bg-background duration-200 animate-in slide-in-from-right-4 lg:flex"
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
                className={cn('grid size-8 place-items-center text-muted-foreground hover:bg-background hover:text-foreground', ring)}
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
              'flex h-9 items-center gap-3 border border-border bg-background text-sm font-light text-muted-foreground hover:border-foreground hover:text-foreground',
              collapsed ? 'w-8 justify-center self-center' : 'px-3',
              ring,
            )}
          >
            <Search className="size-4 shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">Search</span>
                <Kbd>⌘K</Kbd>
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
              'flex h-9 items-center gap-3 bg-secondary text-sm font-light text-secondary-foreground hover:bg-secondary/85',
              collapsed ? 'w-8 justify-center self-center' : 'px-3',
              ring,
            )}
          >
            <Sparkles className="size-4 shrink-0 text-primary" />
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
                <ChevronRight className="size-3.5 shrink-0 text-muted-foreground group-data-[panel-open]/trigger:rotate-90" />
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

      <div className="flex flex-col gap-px border-t border-border p-2">
        {!collapsed && <div className="px-3 pt-1 pb-2 text-xs text-muted-foreground">{TOWN.name}</div>}
        <Hint label={collapsed ? ME.name : null} side="right">
          <a href="#/profile" className={cn(row, collapsed && 'justify-center px-0')} aria-label={collapsed ? ME.name : undefined}>
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-secondary text-[0.625rem] text-secondary-foreground">
              {ME.name
                .split(' ')
                .map((w) => w[0])
                .join('')}
            </span>
            {!collapsed && <span className="truncate">{ME.name}</span>}
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
        active && 'bg-background font-normal before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-primary',
      )}
    >
      {Icon && !indent && <Icon className="size-4 shrink-0" />}
      {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
      {!collapsed && item.count ? (
        <span className="min-w-5 bg-hope-tint px-1.5 text-center text-xs text-tint-foreground tabular-nums">{item.count}</span>
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
