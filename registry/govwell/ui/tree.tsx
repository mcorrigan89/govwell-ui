'use client';

import * as React from 'react';
import { Minus, Plus } from 'lucide-react';

import { cn } from '@/lib/utils';

// A hierarchy to browse — a causal chain of events, a fee schedule, a code
// book's chapters — as a WAI-ARIA tree. Each branch has a small square
// toggle with a + or −, and its children hang off an Ash guide line. The
// tree is one tab stop; the arrow keys move through it (Down/Up, Right opens
// or steps in, Left closes or steps out, Home/End, * opens every sibling,
// typing a letter jumps to the next label starting with it), and Enter or
// Space selects. A selected row is a Slate fill, as everywhere else; the
// hovered and focused rows get the accent.
//
//   <Tree aria-label="Fee schedule" items={nodes} defaultExpanded={['building']} />

type TreeNode = {
  id: string;
  label: React.ReactNode;
  /** what typeahead matches; defaults to `label` when it's a string */
  textValue?: string;
  children?: TreeNode[];
  disabled?: boolean;
};

type TreeProps = Omit<React.ComponentProps<'ul'>, 'onSelect'> & {
  items: TreeNode[];
  expanded?: string[];
  defaultExpanded?: string[];
  onExpandedChange?: (expanded: string[]) => void;
  /** `single` makes rows selectable (aria-selected); `none` (default) is browse-only */
  selectionMode?: 'none' | 'single';
  selected?: string | null;
  defaultSelected?: string | null;
  onSelectedChange?: (id: string | null) => void;
  /** Enter, Space or a click on a row (whatever the selection mode) */
  onAction?: (node: TreeNode) => void;
  /** draw a row's content; defaults to the label */
  renderItem?: (node: TreeNode, state: { expanded: boolean; level: number }) => React.ReactNode;
};

type Visible = { node: TreeNode; level: number; parentId: string | null };

function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (v: T) => void) {
  const [inner, setInner] = React.useState(defaultValue);
  const current = value !== undefined ? value : inner;
  const set = React.useCallback(
    (v: T) => {
      if (value === undefined) setInner(v);
      onChange?.(v);
    },
    [value, onChange],
  );
  return [current, set] as const;
}

const textOf = (node: TreeNode) => (node.textValue ?? (typeof node.label === 'string' ? node.label : '')).toLowerCase();

function Tree({
  items,
  expanded: expandedProp,
  defaultExpanded = [],
  onExpandedChange,
  selectionMode = 'none',
  selected: selectedProp,
  defaultSelected = null,
  onSelectedChange,
  onAction,
  renderItem,
  className,
  ...props
}: TreeProps) {
  const [expandedList, setExpandedList] = useControllable(expandedProp, defaultExpanded, onExpandedChange);
  const [selected, setSelected] = useControllable(selectedProp, defaultSelected, onSelectedChange);
  const expanded = React.useMemo(() => new Set(expandedList), [expandedList]);
  const [focusedId, setFocusedId] = React.useState<string | null>(null);
  const refs = React.useRef(new Map<string, HTMLLIElement>());

  // the rows a person can reach, in order: every node whose ancestors are open
  const visible = React.useMemo(() => {
    const out: Visible[] = [];
    const walk = (nodes: TreeNode[], level: number, parentId: string | null) => {
      for (const node of nodes) {
        out.push({ node, level, parentId });
        if (node.children?.length && expanded.has(node.id)) walk(node.children, level + 1, node.id);
      }
    };
    walk(items, 1, null);
    return out;
  }, [items, expanded]);

  // the one tab stop: the focused row, else the selected one, else the first
  const tabStop =
    visible.find((v) => v.node.id === focusedId)?.node.id ??
    visible.find((v) => v.node.id === selected)?.node.id ??
    visible.find((v) => !v.node.disabled)?.node.id;

  const focus = (id: string) => {
    setFocusedId(id);
    refs.current.get(id)?.focus();
  };
  const setOpen = (id: string, open: boolean) => {
    if (open === expanded.has(id)) return;
    setExpandedList(open ? [...expandedList, id] : expandedList.filter((e) => e !== id));
  };
  const activate = (node: TreeNode) => {
    if (node.disabled) return;
    if (selectionMode === 'single') setSelected(node.id);
    onAction?.(node);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLLIElement>, at: number) => {
    const { node, parentId } = visible[at]!;
    const branch = !!node.children?.length;
    const isOpen = expanded.has(node.id);
    const step = (from: number, dir: 1 | -1) => {
      for (let i = from + dir; i >= 0 && i < visible.length; i += dir) if (!visible[i]!.node.disabled) return visible[i]!.node.id;
      return null;
    };
    let target: string | null = null;
    switch (event.key) {
      case 'ArrowDown':
        target = step(at, 1);
        break;
      case 'ArrowUp':
        target = step(at, -1);
        break;
      case 'ArrowRight':
        if (branch && !isOpen) setOpen(node.id, true);
        else if (branch) target = visible[at + 1]?.node.id ?? null;
        break;
      case 'ArrowLeft':
        if (branch && isOpen) setOpen(node.id, false);
        else target = parentId;
        break;
      case 'Home':
        target = step(-1, 1);
        break;
      case 'End':
        target = step(visible.length, -1);
        break;
      case 'Enter':
      case ' ':
        activate(node);
        break;
      case '*': {
        const siblings = visible.filter((v) => v.parentId === parentId && v.node.children?.length).map((v) => v.node.id);
        setExpandedList([...new Set([...expandedList, ...siblings])]);
        break;
      }
      default:
        if (event.key.length === 1 && /\S/.test(event.key) && !event.ctrlKey && !event.metaKey && !event.altKey) {
          const ch = event.key.toLowerCase();
          for (let n = 1; n <= visible.length; n++) {
            const v = visible[(at + n) % visible.length]!;
            if (!v.node.disabled && textOf(v.node).startsWith(ch)) {
              target = v.node.id;
              break;
            }
          }
          if (!target) return;
          break;
        }
        return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (target) focus(target);
  };

  const indexOf = new Map(visible.map((v, i) => [v.node.id, i]));

  const renderNodes = (nodes: TreeNode[], level: number): React.ReactNode =>
    nodes.map((node, i) => {
      const branch = !!node.children?.length;
      const isOpen = branch && expanded.has(node.id);
      const isSelected = selectionMode === 'single' && selected === node.id;
      return (
        <li
          key={node.id}
          ref={(el) => {
            if (el) refs.current.set(node.id, el);
            else refs.current.delete(node.id);
          }}
          role="treeitem"
          data-slot="tree-item"
          aria-level={level}
          aria-setsize={nodes.length}
          aria-posinset={i + 1}
          aria-expanded={branch ? isOpen : undefined}
          aria-selected={selectionMode === 'single' ? isSelected : undefined}
          aria-disabled={node.disabled || undefined}
          tabIndex={node.id === tabStop ? 0 : -1}
          onFocus={(event) => {
            if (event.target === event.currentTarget) setFocusedId(node.id);
          }}
          onKeyDown={(event) => {
            if (event.target === event.currentTarget) onKeyDown(event, indexOf.get(node.id)!);
          }}
          // the ring goes round this row only, not the open branch under it
          className="outline-none focus-visible:[&>[data-slot=tree-row]]:outline-2 focus-visible:[&>[data-slot=tree-row]]:-outline-offset-2 focus-visible:[&>[data-slot=tree-row]]:outline-solid focus-visible:[&>[data-slot=tree-row]]:outline-ring"
        >
          {/* a mouse shortcut: the keyboard acts on the treeitem itself */}
          {/* oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
          <div
            data-slot="tree-row"
            data-selected={isSelected || undefined}
            className={cn(
              'flex min-h-10 cursor-pointer items-center gap-2 py-1 pr-3 pl-1 text-base font-light',
              isSelected ? 'bg-secondary text-secondary-foreground' : 'hover:bg-accent',
              node.disabled && 'pointer-events-none opacity-40',
            )}
            onClick={() => {
              focus(node.id);
              activate(node);
            }}
          >
            {branch ? (
              <span
                aria-hidden
                data-slot="tree-toggle"
                className="flex size-5 shrink-0 items-center justify-center border border-input bg-background text-foreground hover:border-foreground [&_svg]:size-3"
                onClick={(event) => {
                  event.stopPropagation();
                  focus(node.id);
                  setOpen(node.id, !isOpen);
                }}
              >
                {isOpen ? <Minus /> : <Plus />}
              </span>
            ) : (
              <span aria-hidden className="size-5 shrink-0" />
            )}
            <div className="min-w-0 flex-1">{renderItem ? renderItem(node, { expanded: isOpen, level }) : node.label}</div>
          </div>
          {isOpen && (
            // the guide line runs down from the centre of the toggle above
            <ul role="group" data-slot="tree-group" className="ml-[13px] border-l border-border pl-3">
              {renderNodes(node.children!, level + 1)}
            </ul>
          )}
        </li>
      );
    });

  return (
    <ul role="tree" data-slot="tree" className={cn('flex flex-col text-foreground', className)} {...props}>
      {renderNodes(items, 1)}
    </ul>
  );
}

export { Tree, type TreeNode, type TreeProps };
