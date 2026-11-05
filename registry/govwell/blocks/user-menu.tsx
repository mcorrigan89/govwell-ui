'use client';

import type { ComponentType, ReactNode } from 'react';
import { ChevronsUpDownIcon, ChevronDownIcon, LogOutIcon } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

// Who you are and where: the signed-in person (avatar, name, email), the
// organization you're working in and your role there, switching to another
// of your organizations, your own links (account, help) and signing out.
//
// Two triggers for the same menu. `top-bar` (default) is a quiet ghost
// button for the app shell's white top bar: the avatar, your name (from
// small screens up) and a chevron. `sidebar` sits at the foot of the Slate
// sidebar: the avatar, your name and the organization on two lines in white
// and Cement, opening upwards; `collapsed` shrinks it to the avatar for the
// icon rail. Switching organization changes what's visible everywhere, so
// the caller usually restarts the app in `onSwitchOrganization`. No auth
// logic lives in here; it's all props.
//
//   <UserMenu
//     user={{ name: 'Dana Ruiz', email: 'dana@springfield.gov' }}
//     organizations={orgs}
//     activeOrganizationId="springfield"
//     onSwitchOrganization={switchTo}
//     links={[{ label: 'Your account', href: '/account', icon: Settings }]}
//     onSignOut={signOut}
//   />

export type UserMenuUser = {
  name: string;
  email?: string;
  /** a photo; initials show until (or unless) it loads */
  avatarUrl?: string;
};

export type UserMenuOrganization = {
  id: string;
  name: string;
  /** your role there, e.g. "admin" or "Permit technician" */
  role?: string;
};

export type UserMenuLink = {
  label: string;
  /** a link… */
  href?: string;
  /** …or an action */
  onSelect?: () => void;
  icon?: ComponentType<{ className?: string }>;
};

/** "Dana Ruiz" → "DR" */
export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0]![0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]![0] ?? '') : '';
  return (first + last).toUpperCase();
}

/** "permit-technician" → "Permit technician" */
const roleLabel = (role: string) => role.replace(/[-_]/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

// the menu item renders as the link and fills it with its label
// oxlint-disable-next-line jsx-a11y/anchor-has-content, jsx-a11y/control-has-associated-label
const anchor = (href: string) => <a href={href} />;

// past this many, the organizations move into a submenu so the menu stays short
const INLINE_ORGANIZATIONS = 5;

// on Slate the theme's Slate focus ring would vanish; Hope reads on it
const sidebarFocus =
  'outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-solid focus-visible:outline-hope';

function UserAvatar({ user, size = 'default' }: { user: UserMenuUser; size?: 'default' | 'sm' | 'lg' }) {
  return (
    <Avatar size={size}>
      {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
      <AvatarFallback>{initials(user.name)}</AvatarFallback>
    </Avatar>
  );
}

export function UserMenu({
  user,
  organizations = [],
  activeOrganizationId,
  onSwitchOrganization,
  links = [],
  onSignOut,
  signOutLabel = 'Sign out',
  variant = 'top-bar',
  collapsed = false,
  extra,
  className,
}: {
  user: UserMenuUser;
  /** your organizations; with more than one, the menu offers to switch */
  organizations?: UserMenuOrganization[];
  activeOrganizationId?: string;
  /** called with the chosen organization's id (never the active one) */
  onSwitchOrganization?: (organizationId: string) => void;
  /** your own places: account, help, the public portal */
  links?: UserMenuLink[];
  onSignOut?: () => void;
  signOutLabel?: string;
  /** `top-bar` for the white top bar; `sidebar` for the foot of the Slate sidebar */
  variant?: 'top-bar' | 'sidebar';
  /** sidebar only: just the avatar, for the collapsed icon rail */
  collapsed?: boolean;
  /** more items, before sign out (staff-only tools, "New organization…") */
  extra?: ReactNode;
  className?: string;
}) {
  const active = organizations.find((o) => o.id === activeOrganizationId);
  const canSwitch = organizations.length > 1 && onSwitchOrganization;
  const sidebar = variant === 'sidebar';
  const where = active ? [active.name, active.role && roleLabel(active.role)].filter(Boolean).join(' · ') : null;

  const trigger = sidebar ? (
    <DropdownMenuTrigger
      aria-label={collapsed ? `${user.name}, account menu` : undefined}
      className={cn(
        'flex h-16 w-full min-w-0 items-center gap-3 border-t border-white/10 px-4 text-left text-white transition-colors hover:bg-white/5 data-popup-open:bg-white/10',
        sidebarFocus,
        collapsed && 'justify-center px-0',
        className,
      )}
    >
      <UserAvatar user={user} />
      {!collapsed && (
        <>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-normal">{user.name}</span>
            {active && <span className="truncate text-xs text-cement">{active.name}</span>}
          </span>
          <ChevronsUpDownIcon aria-hidden className="size-4 shrink-0 text-cement" />
        </>
      )}
    </DropdownMenuTrigger>
  ) : (
    <DropdownMenuTrigger
      aria-label={`${user.name}, account menu`}
      className={cn(
        'flex h-10 max-w-60 min-w-0 items-center gap-2 px-2 text-foreground transition-colors outline-none hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring data-popup-open:bg-accent',
        className,
      )}
    >
      <UserAvatar user={user} size="sm" />
      <span className="hidden truncate text-sm font-normal sm:inline">{user.name}</span>
      <ChevronDownIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
    </DropdownMenuTrigger>
  );

  const organizationItems = (
    <DropdownMenuRadioGroup
      value={activeOrganizationId ?? ''}
      onValueChange={(id: string) => {
        if (id && id !== activeOrganizationId) onSwitchOrganization?.(id);
      }}
    >
      {organizations.map((org) => (
        // switching moves you to another organization, so the menu closes with it
        <DropdownMenuRadioItem key={org.id} value={org.id} closeOnClick>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate">{org.name}</span>
            {org.role && <span className="truncate text-xs text-muted-foreground">{roleLabel(org.role)}</span>}
          </span>
        </DropdownMenuRadioItem>
      ))}
    </DropdownMenuRadioGroup>
  );

  return (
    <DropdownMenu>
      {trigger}
      <DropdownMenuContent
        data-slot="user-menu"
        align={sidebar ? 'start' : 'end'}
        side={sidebar ? (collapsed ? 'right' : 'top') : 'bottom'}
        className={cn('w-72', sidebar && !collapsed && 'w-(--anchor-width) min-w-60')}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-3 px-3 py-2">
            <UserAvatar user={user} size="lg" />
            <span className="flex min-w-0 flex-col">
              <span data-slot="user-menu-name" className="truncate text-base text-foreground">
                {user.name}
              </span>
              {user.email && <span className="truncate text-sm text-muted-foreground">{user.email}</span>}
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        {where && !canSwitch && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel className="eyebrow-type">Organization</DropdownMenuLabel>
              <div data-slot="user-menu-organization" className="px-3 pb-2 text-sm">
                {where}
              </div>
            </DropdownMenuGroup>
          </>
        )}

        {canSwitch && (
          <>
            <DropdownMenuSeparator />
            {organizations.length > INLINE_ORGANIZATIONS ? (
              <DropdownMenuGroup>
                <DropdownMenuLabel className="eyebrow-type">Organization</DropdownMenuLabel>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate">{active?.name ?? 'Choose an organization'}</span>
                      {active?.role && <span className="truncate text-xs text-muted-foreground">{roleLabel(active.role)}</span>}
                    </span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="max-h-80 w-64">{organizationItems}</DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuGroup>
            ) : (
              <DropdownMenuGroup>
                <DropdownMenuLabel className="eyebrow-type">Switch organization</DropdownMenuLabel>
                {organizationItems}
              </DropdownMenuGroup>
            )}
          </>
        )}

        {(links.length > 0 || extra) && (
          <>
            <DropdownMenuSeparator />
            {links.map((link) => {
              const Icon = link.icon;
              const content = (
                <>
                  {Icon && <Icon />}
                  {link.label}
                </>
              );
              return link.href ? (
                <DropdownMenuItem key={link.label} render={anchor(link.href)} onClick={link.onSelect}>
                  {content}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem key={link.label} onClick={link.onSelect}>
                  {content}
                </DropdownMenuItem>
              );
            })}
            {extra}
          </>
        )}

        {onSignOut && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onSignOut}>
              <LogOutIcon />
              {signOutLabel}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
