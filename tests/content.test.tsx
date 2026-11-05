import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-button';
import { DescriptionDetails, DescriptionItem, DescriptionList, DescriptionTerm } from '@/components/ui/description-list';
import { DownloadLink, formatBytes } from '@/components/ui/download-link';
import { Highlight, SearchHit, snippetAround } from '@/components/ui/highlight';
import { Lightbox, type LightboxImage } from '@/components/ui/lightbox';
import { Markdown } from '@/components/ui/markdown';
import { Tree, type TreeNode } from '@/components/ui/tree';

// jsdom lacks a few things Base UI reaches for
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
Element.prototype.scrollIntoView ??= function () {};
globalThis.matchMedia ??= ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener() {},
  removeListener() {},
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent: () => false,
})) as typeof globalThis.matchMedia;

describe('DescriptionList', () => {
  it('renders a semantic dl with terms and details, and an em dash for empty values', () => {
    const { container } = render(
      <DescriptionList layout="inline" divided>
        <DescriptionItem>
          <DescriptionTerm>Lot area</DescriptionTerm>
          <DescriptionDetails>6,016 sq ft</DescriptionDetails>
        </DescriptionItem>
        <DescriptionItem>
          <DescriptionTerm>Historic district</DescriptionTerm>
          <DescriptionDetails>{null}</DescriptionDetails>
        </DescriptionItem>
      </DescriptionList>,
    );
    const dl = container.querySelector('dl')!;
    expect(dl).toHaveAttribute('data-layout', 'inline');
    expect(
      within(dl)
        .getAllByRole('term')
        .map((t) => t.textContent),
    ).toEqual(['Lot area', 'Historic district']);
    const details = within(dl).getAllByRole('definition');
    expect(details[0]).toHaveTextContent('6,016 sq ft');
    expect(details[0]).toHaveClass('tabular-nums');
    expect(details[1]).toHaveTextContent('—None');
    expect(container.querySelectorAll('[data-slot=description-item]')[0]).toHaveClass('border-b');
  });

  it('shows a source as a second line or behind a help button', async () => {
    render(
      <DescriptionList>
        <DescriptionItem>
          <DescriptionTerm>Zoning</DescriptionTerm>
          <DescriptionDetails source="Zoning layer · adopted 2025">R-1</DescriptionDetails>
        </DescriptionItem>
        <DescriptionItem>
          <DescriptionTerm>Valuation</DescriptionTerm>
          <DescriptionDetails source="Applicant, on the application" sourceDisplay="line">
            $48,200
          </DescriptionDetails>
        </DescriptionItem>
      </DescriptionList>,
    );
    expect(screen.getByText('Applicant, on the application')).toBeInTheDocument();
    expect(screen.queryByText('Zoning layer · adopted 2025')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Source' }));
    expect(await screen.findByText('Zoning layer · adopted 2025')).toBeInTheDocument();
  });
});

describe('CopyButton', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('copies, says Copied, announces it and reverts', async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText');
    const onCopy = vi.fn();
    render(
      <CopyButton value="BLD-2026-01482" onCopy={onCopy} timeout={50}>
        Copy number
      </CopyButton>,
    );
    await user.click(screen.getByRole('button', { name: 'Copy number' }));
    expect(writeText).toHaveBeenCalledWith('BLD-2026-01482');
    expect(onCopy).toHaveBeenCalledWith('BLD-2026-01482');
    expect(await screen.findByRole('button', { name: 'Copied' })).toHaveAttribute('data-state', 'copied');
    expect(screen.getByRole('status')).toHaveTextContent('Copied');
    await act(() => new Promise((r) => setTimeout(r, 80)));
    expect(screen.getByRole('button', { name: 'Copy number' })).toHaveAttribute('data-state', 'idle');
    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  it('is icon-only without children and reports a failure', async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValueOnce(new Error('denied'));
    const onError = vi.fn();
    render(<CopyButton value="K7Q-4M2" label="Copy invite code" onError={onError} />);
    const button = screen.getByRole('button', { name: 'Copy invite code' });
    await user.click(button);
    expect(onError).toHaveBeenCalled();
    expect(button).toHaveAttribute('data-state', 'error');
    expect(screen.getByRole('status')).toHaveTextContent("Couldn't copy");
  });

  it('accepts an async value', async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText');
    render(<CopyButton value={async () => 'token-123'}>Copy token</CopyButton>);
    await user.click(screen.getByRole('button', { name: 'Copy token' }));
    expect(writeText).toHaveBeenCalledWith('token-123');
  });
});

describe('Markdown', () => {
  it('renders GitHub-flavoured Markdown in govwell-prose', () => {
    const { container } = render(
      <Markdown>
        {'## Fees\n\n| Item | Amount |\n| --- | --- |\n| Permit | $635 |\n\n~~Parking~~ waived, see [guide](https://example.gov).'}
      </Markdown>,
    );
    expect(container.firstChild).toHaveClass('govwell-prose');
    expect(screen.getByRole('heading', { level: 2, name: 'Fees' })).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(container.querySelector('del')).toHaveTextContent('Parking');
    expect(screen.getByRole('link', { name: 'guide' })).toHaveAttribute('href', 'https://example.gov');
  });

  it('drops raw HTML and unsafe links', () => {
    const { container } = render(<Markdown>{'Hello <script>alert(1)</script><b>bold</b> [x](javascript:alert(1))'}</Markdown>);
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('b')).toBeNull();
    expect(screen.getByText('x').closest('a')?.getAttribute('href') ?? '').not.toContain('javascript');
  });

  it('passes components overrides through', () => {
    render(<Markdown components={{ h1: ({ children }) => <h1 data-testid="custom">{children}</h1> }}>{'# Title'}</Markdown>);
    expect(screen.getByTestId('custom')).toHaveTextContent('Title');
  });
});

describe('Highlight', () => {
  it('marks every term, ignoring case, longest first', () => {
    const { container } = render(
      <Highlight text="Fire separation at the GARAGE; fire doors too." terms={['fire', 'fire separation', 'garage']} />,
    );
    expect([...container.querySelectorAll('mark')].map((m) => m.textContent)).toEqual(['Fire separation', 'GARAGE', 'fire']);
  });

  it('treats terms as text, not patterns', () => {
    const { container } = render(<Highlight text="Section R302.6 (a)" terms={['R302.6 (a)', '.*']} />);
    expect([...container.querySelectorAll('mark')].map((m) => m.textContent)).toEqual(['R302.6 (a)']);
  });

  it('trims to a snippet with ellipses', () => {
    const long = `${'lorem '.repeat(40)}the garage wall ${'ipsum '.repeat(40)}`;
    const s = snippetAround(long, 'garage', 30);
    expect(s.startsWith('…')).toBe(true);
    expect(s.endsWith('…')).toBe(true);
    expect(s).toContain('garage');
    expect(s.length).toBeLessThan(80);
  });

  it('SearchHit marks delimited snippets and is clickable', async () => {
    const onClick = vi.fn();
    render(
      <SearchHit citation="R309.1" title="Garage floors" snippet="sloped toward the **garage** door" delimiter="**" onClick={onClick} />,
    );
    const hit = screen.getByRole('button', { name: /R309.1 Garage floors/ });
    expect(within(hit).getByText('garage', { selector: 'mark' })).toBeInTheDocument();
    await userEvent.click(hit);
    expect(onClick).toHaveBeenCalled();
  });
});

const NODES: TreeNode[] = [
  {
    id: 'building',
    label: 'Building',
    children: [
      { id: 'permit', label: 'Permit fee' },
      { id: 'review', label: 'Plan review', children: [{ id: 'expedite', label: 'Expedited review' }] },
    ],
  },
  { id: 'fire', label: 'Fire', children: [{ id: 'sprinkler', label: 'Sprinkler review' }] },
  { id: 'tech', label: 'Technology surcharge' },
];

describe('Tree', () => {
  it('exposes the tree roles and levels', () => {
    render(<Tree aria-label="Fees" items={NODES} defaultExpanded={['building']} />);
    const tree = screen.getByRole('tree', { name: 'Fees' });
    const building = within(tree).getByRole('treeitem', { name: /^Building/ });
    expect(building).toHaveAttribute('aria-expanded', 'true');
    expect(building).toHaveAttribute('aria-level', '1');
    expect(within(tree).getByRole('treeitem', { name: 'Permit fee' })).toHaveAttribute('aria-level', '2');
    expect(within(tree).getByRole('treeitem', { name: /^Fire/ })).toHaveAttribute('aria-expanded', 'false');
    expect(within(tree).queryByRole('treeitem', { name: 'Sprinkler review' })).toBeNull();
    // one tab stop
    expect(
      within(tree)
        .getAllByRole('treeitem')
        .filter((i) => i.tabIndex === 0),
    ).toHaveLength(1);
  });

  it('moves and opens with the arrow keys', async () => {
    const user = userEvent.setup();
    render(<Tree aria-label="Fees" items={NODES} />);
    await user.tab();
    const building = screen.getByRole('treeitem', { name: /^Building/ });
    expect(building).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(building).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('treeitem', { name: 'Permit fee' })).toHaveFocus();
    await user.keyboard('{ArrowDown}{ArrowRight}{ArrowRight}');
    expect(screen.getByRole('treeitem', { name: 'Expedited review' })).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('treeitem', { name: /^Plan review/ })).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('treeitem', { name: /^Plan review/ })).toHaveAttribute('aria-expanded', 'false');
    await user.keyboard('{End}');
    expect(screen.getByRole('treeitem', { name: 'Technology surcharge' })).toHaveFocus();
    await user.keyboard('{Home}');
    expect(building).toHaveFocus();
    await user.keyboard('f');
    expect(screen.getByRole('treeitem', { name: /^Fire/ })).toHaveFocus();
  });

  it('opens every sibling with * and selects with Enter or a click', async () => {
    const user = userEvent.setup();
    const onSelectedChange = vi.fn();
    render(<Tree aria-label="Fees" items={NODES} selectionMode="single" onSelectedChange={onSelectedChange} />);
    await user.tab();
    await user.keyboard('*');
    expect(screen.getByRole('treeitem', { name: /^Building/ })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('treeitem', { name: /^Fire/ })).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onSelectedChange).toHaveBeenLastCalledWith('permit');
    expect(screen.getByRole('treeitem', { name: 'Permit fee' })).toHaveAttribute('aria-selected', 'true');
    await user.click(screen.getByText('Sprinkler review'));
    expect(onSelectedChange).toHaveBeenLastCalledWith('sprinkler');
  });

  it('toggles a branch from its square toggle', async () => {
    const user = userEvent.setup();
    const { container } = render(<Tree aria-label="Fees" items={NODES} />);
    await user.click(container.querySelectorAll('[data-slot=tree-toggle]')[1]!);
    expect(screen.getByRole('treeitem', { name: /^Fire/ })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('treeitem', { name: 'Sprinkler review' })).toBeInTheDocument();
  });
});

const PAGES: LightboxImage[] = [
  {
    src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"/>',
    alt: 'Site plan',
    caption: 'plot-plan.pdf · p. 1',
    regions: [{ x: 0.1, y: 0.2, width: 0.3, height: 0.1, label: 'Lot area' }],
  },
  {
    src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"/>',
    alt: 'Floor plan',
    caption: 'plan-set.pdf · p. 4',
  },
];

describe('Lightbox', () => {
  it('opens from its trigger with the caption and regions', async () => {
    const user = userEvent.setup();
    render(<Lightbox images={PAGES} trigger={<Button>View page</Button>} />);
    await user.click(screen.getByRole('button', { name: 'View page' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('plot-plan.pdf · p. 1')).toBeInTheDocument();
    expect(within(dialog).getByText('1 of 2')).toBeInTheDocument();
    fireEvent.load(within(dialog).getByRole('img', { name: 'Site plan' }));
    const region = dialog.querySelector('[data-slot=lightbox-region]') as HTMLElement;
    expect(region).toHaveStyle({ left: '10%', top: '20%', width: '30%', height: '10%' });
    expect(region).toHaveTextContent('Lot area');
  });

  it('steps through the set with buttons and arrow keys', async () => {
    const user = userEvent.setup();
    const onIndexChange = vi.fn();
    render(<Lightbox images={PAGES} defaultOpen onIndexChange={onIndexChange} />);
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('button', { name: 'Previous' })).toBeDisabled();
    await user.click(within(dialog).getByRole('button', { name: 'Next' }));
    expect(within(dialog).getByText('plan-set.pdf · p. 4')).toBeInTheDocument();
    expect(onIndexChange).toHaveBeenLastCalledWith(1);
    expect(within(dialog).getByRole('button', { name: 'Next' })).toBeDisabled();
    fireEvent.keyDown(within(dialog).getByRole('button', { name: 'Zoom in' }), { key: 'ArrowLeft' });
    expect(within(dialog).getByText('plot-plan.pdf · p. 1')).toBeInTheDocument();
  });

  it('zooms between fit, 100% and steps', async () => {
    const user = userEvent.setup();
    render(<Lightbox images={[PAGES[0]!]} defaultOpen />);
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).queryByRole('button', { name: 'Next' })).toBeNull();
    expect(within(dialog).getByRole('button', { name: 'Fit' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(within(dialog).getByRole('button', { name: '100%' }));
    expect(within(dialog).getByRole('button', { name: '100%' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(within(dialog).getByRole('button', { name: 'Zoom in' }));
    expect(within(dialog).getByText('150%')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Zoom out' }));
    await user.click(within(dialog).getByRole('button', { name: 'Zoom out' }));
    expect(within(dialog).getByText('75%')).toBeInTheDocument();
  });
});

describe('DownloadLink', () => {
  it('formats sizes', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(184_320)).toBe('180 KB');
    expect(formatBytes(2_500_000)).toBe('2.4 MB');
  });

  it('goes from preparing to a link with the file name and size', () => {
    function Harness() {
      const [ready, setReady] = useState(false);
      return (
        <>
          <DownloadLink state={ready ? 'ready' : 'preparing'} href="/permit.pdf" filename="permit.pdf" size={184_320} />
          <button type="button" onClick={() => setReady(true)}>
            finish
          </button>
        </>
      );
    }
    const { container } = render(<Harness />);
    const live = container.querySelector('[data-slot=download-link]')!;
    expect(live).toHaveAttribute('aria-live', 'polite');
    expect(live).toHaveTextContent('Preparing permit.pdf…');
    expect(screen.queryByRole('link')).toBeNull();
    fireEvent.click(screen.getByText('finish'));
    const link = screen.getByRole('link', { name: /permit\.pdf.*180 KB/ });
    expect(link).toHaveAttribute('href', '/permit.pdf');
    expect(link).toHaveAttribute('download', 'permit.pdf');
  });

  it('shows an error with a retry', async () => {
    const onRetry = vi.fn();
    render(<DownloadLink state="error" filename="export.csv" onRetry={onRetry} />);
    expect(screen.getByText("Couldn't prepare export.csv.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('as a button, is disabled while preparing', () => {
    render(<DownloadLink state="preparing" variant="button" filename="permit.pdf" />);
    expect(screen.getByRole('button', { name: /Preparing/ })).toBeDisabled();
  });
});
