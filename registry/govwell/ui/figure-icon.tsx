import type { ComponentType } from 'react';
import { cn } from '@/lib/utils';

// A figure's icon on a square brand tint, as GovWell UI's Tile draws its icon:
// colour that says what kind of figure it is (money, work, time) without
// colouring the number itself.

const TINT = {
  hope: 'bg-hope-tint',
  sky: 'bg-sky-tint',
  field: 'bg-field-tint',
  amber: 'bg-amber-tint',
  teal: 'bg-teal-tint',
  ash: 'bg-ash-tint',
} as const;

export type FigureTint = keyof typeof TINT;

export function FigureIcon({
  icon: Icon,
  tint,
  className,
}: {
  icon: ComponentType<{ className?: string }>;
  tint: FigureTint;
  className?: string;
}) {
  return (
    <span aria-hidden className={cn('grid size-9 shrink-0 place-items-center text-tint-foreground', TINT[tint], className)}>
      <Icon className="size-4" />
    </span>
  );
}
