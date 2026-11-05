'use client';

import * as React from 'react';
import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

// A card you click, like the cards in govwell.com's mega menu: an icon on a
// square brand tint, a Regular title and one Light line of description, in a
// square box with an Ash hairline that turns grey (accent) on hover. A
// selected tile gets a Slate edge and a Slate rail down its left side. It is
// a button by default; give it `href` for a link, or `render` for a router
// link (`render={<RouterLink to="/permits" />}`).
//
//   <Tile icon={<FileText />} title="Building permit" description="New builds, additions and alterations" />

const tileIconVariants = cva(
  "flex size-10 shrink-0 items-center justify-center text-tint-foreground [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      tone: {
        hope: 'bg-hope-tint',
        sky: 'bg-sky-tint',
        field: 'bg-field-tint',
        ash: 'bg-ash-tint',
      },
    },
    defaultVariants: { tone: 'hope' },
  },
);

type TileProps = Omit<useRender.ComponentProps<'button'>, 'title'> &
  VariantProps<typeof tileIconVariants> & {
    /** a lucide icon or similar, shown on the tint tile */
    icon?: React.ReactNode;
    title: React.ReactNode;
    /** one line; longer text is cut with an ellipsis */
    description?: React.ReactNode;
    /** a link instead of a button */
    href?: string;
    target?: string;
    rel?: string;
    selected?: boolean;
    disabled?: boolean;
  };

function Tile({
  icon,
  title,
  description,
  tone,
  selected,
  disabled = false,
  href,
  target,
  rel,
  render,
  className,
  children,
  onClick,
  ...props
}: TileProps) {
  const isButton = !href && !render;
  const content = (
    <>
      {icon && (
        <span aria-hidden data-slot="tile-icon" className={tileIconVariants({ tone })}>
          {icon}
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span data-slot="tile-title" className="text-lg leading-tight font-normal tracking-tight text-foreground">
          {title}
        </span>
        {description && (
          <span data-slot="tile-description" className="truncate text-sm font-light text-muted-foreground">
            {description}
          </span>
        )}
        {children}
      </span>
    </>
  );
  const ownProps: Record<string, unknown> = {
    'data-slot': 'tile',
    'data-selected': selected ? '' : undefined,
    'data-disabled': disabled ? '' : undefined,
    className: cn(
      'group/tile relative flex w-full items-start gap-4 rounded-none border border-border bg-card p-5 text-left text-card-foreground transition-colors outline-none hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring',
      'data-selected:border-secondary data-selected:before:absolute data-selected:before:inset-y-[-1px] data-selected:before:left-[-1px] data-selected:before:w-1 data-selected:before:bg-secondary',
      'data-disabled:pointer-events-none data-disabled:opacity-40',
      className,
    ),
    children: content,
  };
  if (isButton) {
    ownProps.type = 'button';
    ownProps.disabled = disabled;
    // a selectable tile says whether it is selected
    if (selected !== undefined) ownProps['aria-pressed'] = selected;
    ownProps.onClick = onClick;
  } else {
    if (href !== undefined) ownProps.href = disabled ? undefined : href;
    ownProps.target = target;
    ownProps.rel = rel ?? (target === '_blank' ? 'noreferrer' : undefined);
    if (selected) ownProps['aria-current'] = 'page';
    if (disabled) {
      ownProps['aria-disabled'] = true;
      ownProps.tabIndex = -1;
    }
    ownProps.onClick = (event: React.MouseEvent<HTMLElement>) => {
      if (disabled) return event.preventDefault();
      onClick?.(event as React.MouseEvent<HTMLButtonElement>);
    };
  }
  return useRender({
    defaultTagName: isButton ? 'button' : 'a',
    render,
    props: mergeProps<'button'>(ownProps as React.ComponentProps<'button'>, props),
  });
}

export { Tile, tileIconVariants };
