import * as React from 'react';
import { Bot, Cog, Workflow, type LucideIcon } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

// Who did it, in the audit log, a timeline or an explain tree: a square chip
// with an Ash hairline and the actor's name in Light. A person shows their
// initials in a round avatar (avatars are one of the few circles); the
// system, an automation and the AI assistant each show an icon on a square
// brand tint — Ash, Sky and Hope — so a glance down a log tells people from
// machines. The kind is also spoken before the name for screen readers.
//
//   <ActorBadge type="person" name="Dana Whitfield" />
//   <ActorBadge type="automation" name="Fee reminder" />

type ActorType = 'person' | 'system' | 'automation' | 'ai';

const ACTORS: Record<ActorType, { word: string; icon?: LucideIcon; tile: string }> = {
  person: { word: 'Person', tile: '' },
  system: { word: 'System', icon: Cog, tile: 'bg-ash-tint' },
  automation: { word: 'Automation', icon: Workflow, tile: 'bg-sky-tint' },
  ai: { word: 'AI assistant', icon: Bot, tile: 'bg-hope-tint' },
};

/** "Dana Whitfield" → "DW"; one word gives one letter */
function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  const first = words[0]![0] ?? '';
  const last = words.length > 1 ? (words[words.length - 1]![0] ?? '') : '';
  return (first + last).toUpperCase();
}

type ActorBadgeProps = Omit<React.ComponentProps<'span'>, 'children'> & {
  type: ActorType;
  /** who: a person's name, or the automation's / system's name; defaults to the kind ("System") */
  name?: string;
  /** a person's photo; the initials show until (or unless) it loads */
  avatarSrc?: string;
  /** override the derived initials */
  initials?: string;
  /** show only the avatar / icon, with the name as its accessible label and tooltip */
  iconOnly?: boolean;
};

function ActorBadge({ type, name, avatarSrc, initials, iconOnly = false, className, ...props }: ActorBadgeProps) {
  const actor = ACTORS[type];
  const label = name ?? actor.word;
  const Icon = actor.icon;
  // the kind is said before the name unless the name already is the kind
  const spokenKind = name ? `${actor.word}: ` : '';
  return (
    <span
      data-slot="actor-badge"
      data-actor={type}
      title={iconOnly ? `${spokenKind}${label}` : undefined}
      className={cn(
        'inline-flex h-7 w-fit max-w-full shrink-0 items-center gap-2 border border-border bg-card text-sm font-light text-foreground',
        iconOnly ? 'border-transparent bg-transparent' : 'pr-2.5',
        className,
      )}
      {...props}
    >
      {type === 'person' ? (
        <Avatar size="sm" className="ml-0.5" aria-hidden>
          {avatarSrc && <AvatarImage src={avatarSrc} alt="" />}
          <AvatarFallback>{initials ?? initialsOf(label)}</AvatarFallback>
        </Avatar>
      ) : (
        <span
          aria-hidden
          data-slot="actor-badge-icon"
          className={cn(
            'flex size-7 shrink-0 items-center justify-center self-stretch text-tint-foreground',
            actor.tile,
            !iconOnly && '-my-px -ml-px',
          )}
        >
          {Icon && <Icon className="size-3.5" />}
        </span>
      )}
      <span className={cn('truncate', iconOnly && 'sr-only')}>
        {spokenKind && <span className="sr-only">{spokenKind}</span>}
        {label}
      </span>
    </span>
  );
}

export { ActorBadge, type ActorType };
