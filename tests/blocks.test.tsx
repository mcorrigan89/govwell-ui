import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Box, Home } from 'lucide-react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppShell, isNavItemActive } from '@/components/blocks/app-shell';
import { DataTable, dataTableColumns } from '@/components/blocks/data-table';
import { SignIn } from '@/components/blocks/sign-in';
import { PermitsTable, RouteTable, staffNav } from '@/docs/demos/blocks';

// ── app shell ────────────────────────────────────────────────────────────────

const shell = (props: Partial<Parameters<typeof AppShell>[0]> = {}) => (
  <AppShell
    brand={{ name: 'GovWell' }}
    sections={[
      {
        title: 'Casework',
        items: [
          { href: '#/home', label: 'Home', icon: Home, exact: true },
          { href: '#/box', label: 'Box', icon: Box, badge: 7 },
        ],
      },
    ]}
    activeHref="#/box"
    {...props}
  >
    <p>content</p>
  </AppShell>
);

describe('AppShell', () => {
  beforeEach(() => window.localStorage.clear());

  it('collapses to an icon rail and remembers it', async () => {
    const { unmount } = render(shell());
    await userEvent.click(screen.getByRole('button', { name: 'Collapse the sidebar' }));
    expect(screen.getByRole('button', { name: 'Expand the sidebar' })).toBeInTheDocument();
    expect(window.localStorage.getItem('govwell.sidebar.collapsed')).toBe('1');
    unmount();

    render(shell());
    expect(await screen.findByRole('button', { name: 'Expand the sidebar' })).toBeInTheDocument();
  });

  it('on the rail, names each icon for screen readers and in a tooltip on hover', async () => {
    window.localStorage.setItem('govwell.sidebar.collapsed', '1');
    render(shell());
    await screen.findByRole('button', { name: 'Expand the sidebar' });
    const [home] = screen.getAllByRole('link', { name: 'Home' });
    expect(home).not.toHaveAttribute('title');
    await userEvent.hover(home!);
    expect(await screen.findByText('Home', { selector: '[data-slot=tooltip-content]' })).toBeInTheDocument();
  });

  it('marks the active link with aria-current and the Hope bar, including on pages under it', () => {
    render(shell({ activeHref: '#/box/42' }));
    const box = screen.getByRole('link', { name: /Box/ });
    const home = screen.getByRole('link', { name: 'Home' });
    expect(box).toHaveAttribute('aria-current', 'page');
    expect(box.className).toContain('border-hope');
    expect(home).not.toHaveAttribute('aria-current');
    expect(home.className).not.toContain('border-hope');
  });

  it('matches exact items only on their own href', () => {
    expect(isNavItemActive({ href: '#/home', exact: true }, '#/home/x')).toBe(false);
    expect(isNavItemActive({ href: '#/home' }, '#/home/x')).toBe(true);
    expect(isNavItemActive({ href: '#/home' }, '#/homes')).toBe(false);
  });

  it('shows badge counts, capped at 99+', () => {
    render(shell({ sections: staffNav({ admin: true, inspections: true }), activeHref: '#/' }));
    expect(screen.getByRole('link', { name: 'Code cases, 3 overdue' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Inspections, 99+' })).toBeInTheDocument();
  });

  it('leaves out hidden items, and sections with nothing left', () => {
    render(shell({ sections: staffNav({ admin: false, inspections: false }), activeHref: '#/' }));
    expect(screen.queryByRole('link', { name: /Inspections/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Audit' })).not.toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Setup' })).not.toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Insight' })).toBeInTheDocument();
  });

  it('keeps the brand mounted across re-renders', () => {
    const { rerender } = render(shell());
    const brand = screen.getByRole('link', { name: 'GovWell' });
    rerender(shell({ topBar: <span>search</span> }));
    expect(screen.getByRole('link', { name: 'GovWell' })).toBe(brand);
  });

  it('renders links through renderLink', () => {
    render(
      shell({
        renderLink: ({ href, children }) => (
          <a href={href} data-router="yes">
            {children}
          </a>
        ),
      }),
    );
    for (const link of screen.getAllByRole('link', { name: 'Home' })) expect(link).toHaveAttribute('data-router', 'yes');
  });

  it('opens the nav in a drawer from the menu button, and closes it on navigating', async () => {
    render(shell());
    await userEvent.click(screen.getByRole('button', { name: 'Open navigation' }));
    const drawer = await screen.findByRole('dialog');
    await userEvent.click(within(drawer).getByRole('link', { name: 'Home' }));
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});

// ── data table ───────────────────────────────────────────────────────────────

const table = () => screen.getAllByRole('table')[0]!;
const bodyRows = () => within(table()).getAllByRole('row').slice(1);
// the permit column: after the checkbox and the open/close button
const permitAt = (i: number) => within(bodyRows()[i]!).getAllByRole('cell')[2]!.textContent;

describe('DataTable', () => {
  it('pages its rows', async () => {
    render(<PermitsTable />);
    expect(bodyRows()).toHaveLength(5);
    expect(screen.getByText('10 rows · page 1 of 2')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: '2' }));
    expect(screen.getByText('10 rows · page 2 of 2')).toBeInTheDocument();
    expect(permitAt(0)).toBe('BP-2026-0436');
  });

  it('sorts numbers biggest-first and text A–Z on the first click, flips on the next, and says so', async () => {
    render(<PermitsTable />);
    const fees = screen.getByRole('button', { name: 'Fees' });
    await userEvent.click(fees);
    expect(fees.closest('th')).toHaveAttribute('aria-sort', 'descending');
    expect(permitAt(0)).toBe('BP-2026-0423'); // $4,820
    await userEvent.click(fees);
    expect(fees.closest('th')).toHaveAttribute('aria-sort', 'ascending');
    expect(permitAt(0)).toBe('BP-2026-0452'); // $60

    const type = screen.getByRole('button', { name: 'Type' });
    await userEvent.click(type);
    expect(type.closest('th')).toHaveAttribute('aria-sort', 'ascending');
    expect(fees.closest('th')).not.toHaveAttribute('aria-sort');
    expect(permitAt(0)).toBe('BP-2026-0431'); // Accessory dwelling unit
  });

  it('filters across columns and recounts, with an empty state that clears the filter', async () => {
    render(<PermitsTable />);
    const box = screen.getByRole('textbox', { name: 'Filter permits' });
    await userEvent.type(box, 'okafor');
    expect(bodyRows().map((_, i) => permitAt(i))).toEqual(['BP-2026-0418', 'BP-2026-0423', 'BP-2026-0452']);
    expect(screen.getByText('3 rows')).toBeInTheDocument();
    await userEvent.clear(box);
    await userEvent.type(box, 'zzz');
    expect(screen.getByText('Nothing matches.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Clear the filter' }));
    expect(screen.getByText('10 rows · page 1 of 2')).toBeInTheDocument();
  });

  it('hides a column from the Columns menu, and from its own header menu', async () => {
    render(<PermitsTable />);
    expect(screen.getByRole('columnheader', { name: /Type/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Columns/ }));
    await userEvent.click(await screen.findByRole('menuitemcheckbox', { name: 'Type' }));
    expect(screen.queryByRole('columnheader', { name: /Type/ })).not.toBeInTheDocument();
    await userEvent.keyboard('{Escape}');

    await userEvent.click(screen.getByRole('button', { name: 'Reviewer column options' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Hide column' }));
    expect(screen.queryByRole('columnheader', { name: /Reviewer/ })).not.toBeInTheDocument();
  });

  it('sorts from a header menu', async () => {
    render(<PermitsTable />);
    await userEvent.click(screen.getByRole('button', { name: 'Fees column options' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Sort ascending' }));
    expect(screen.getByRole('button', { name: 'Fees' }).closest('th')).toHaveAttribute('aria-sort', 'ascending');
    expect(permitAt(0)).toBe('BP-2026-0452');
  });

  it('selects the selectable rows on the page from the header checkbox and shows the bulk-action bar', async () => {
    render(<PermitsTable />);
    expect(screen.queryByRole('toolbar', { name: 'Bulk actions' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select all rows on this page' }));
    // the issued permits on page one (0419, 0427) can't be selected
    expect(screen.getByText(/3 of 10 selected/)).toBeInTheDocument();
    expect(bodyRows()[0]).toHaveAttribute('data-state', 'selected');
    expect(screen.getByRole('checkbox', { name: 'Select BP-2026-0419' })).toHaveAttribute('aria-disabled', 'true');
    const bar = screen.getByRole('toolbar', { name: 'Bulk actions' });
    expect(within(bar).getByText('3 selected')).toBeInTheDocument();
    await userEvent.click(within(bar).getByRole('button', { name: 'Assign reviewer' }));
    expect(screen.getByText('Assigned 3 to D. Okafor')).toBeInTheDocument();
    expect(screen.queryByRole('toolbar', { name: 'Bulk actions' })).not.toBeInTheDocument();
  });

  it('selects a row by clicking it, and clears the selection with the clear button or Esc', async () => {
    render(<PermitsTable />);
    await userEvent.click(within(bodyRows()[0]!).getByText('12 Elm Street'));
    expect(bodyRows()[0]).toHaveAttribute('data-state', 'selected');
    await userEvent.click(screen.getByRole('button', { name: /Clear selection/ }));
    expect(bodyRows()[0]).not.toHaveAttribute('data-state');

    await userEvent.click(within(bodyRows()[2]!).getByText('4 Harbor Lane'));
    expect(screen.getByRole('toolbar', { name: 'Bulk actions' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('toolbar', { name: 'Bulk actions' })).not.toBeInTheDocument();
  });

  it('opens a row to show more', async () => {
    render(<PermitsTable />);
    const open = screen.getByRole('button', { name: 'Expand BP-2026-0423' });
    expect(open).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(open);
    expect(screen.getByRole('button', { name: 'Collapse BP-2026-0423' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('$4,820.00', { selector: 'dd' })).toBeInTheDocument();
    // opening a row doesn't select it
    expect(screen.queryByRole('toolbar', { name: 'Bulk actions' })).not.toBeInTheDocument();
  });

  it('calls onRowClick on a click or Enter', async () => {
    const onRowClick = vi.fn();
    const c = dataTableColumns<{ id: string }>();
    render(
      <DataTable
        columns={c.columns([c.accessor('id', { header: 'ID' })])}
        data={[{ id: 'CE-1' }, { id: 'CE-2' }]}
        getRowId={(r) => r.id}
        onRowClick={onRowClick}
      />,
    );
    await userEvent.click(screen.getByText('CE-2'));
    expect(onRowClick).toHaveBeenCalledWith({ id: 'CE-2' });
    bodyRows()[0]!.focus();
    await userEvent.keyboard('{Enter}');
    expect(onRowClick).toHaveBeenLastCalledWith({ id: 'CE-1' });
  });

  it('shows the empty state with its action, and a loading state', () => {
    const c = dataTableColumns<{ id: string }>();
    const columns = c.columns([c.accessor('id', { header: 'ID' })]);
    const { rerender } = render(
      <DataTable columns={columns} data={[]} emptyTitle="No permits yet" emptyAction={<button type="button">New permit</button>} />,
    );
    expect(screen.getByText('No permits yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New permit' })).toBeInTheDocument();

    rerender(<DataTable columns={columns} data={[]} loading />);
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
    expect(screen.queryByText('No permits yet')).not.toBeInTheDocument();

    rerender(<DataTable columns={columns} data={[{ id: 'a' }]} loading />);
    expect(table()).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('pins the header and the first column when asked', () => {
    render(<PermitsTable />);
    // the checkbox and open/close columns, then Permit, stick to the left
    const header = within(table()).getAllByRole('columnheader');
    expect(header[0]).toHaveStyle({ position: 'sticky', left: '0px' });
    expect(header[2]).toHaveStyle({ position: 'sticky', left: '88px' });
    expect(header[3]).not.toHaveStyle({ position: 'sticky' });

    const c = dataTableColumns<{ id: string }>();
    render(<DataTable columns={c.columns([c.accessor('id', { header: 'ID' })])} data={[{ id: 'a' }]} maxHeight={200} />);
    const last = screen.getAllByRole('table').at(-1)!;
    expect(within(last).getByRole('columnheader', { name: 'ID' })).toHaveStyle({ position: 'sticky', top: '0px' });
  });

  it('reorders rows from the keyboard', async () => {
    // jsdom lays nothing out; give each row a place so dnd-kit can find its neighbours
    const rect = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      const tr = this.closest('tr');
      const index = tr ? [...(tr.parentElement?.children ?? [])].indexOf(tr) : 0;
      const top = index * 40;
      return { x: 0, y: top, top, left: 0, bottom: top + 40, right: 600, width: 600, height: 40, toJSON: () => ({}) } as DOMRect;
    });
    try {
      render(<RouteTable />);
      const ids = () => bodyRows().map((r) => within(r).getAllByRole('cell')[1]!.textContent);
      expect(ids()).toEqual(['INS-5521', 'INS-5524', 'INS-5530', 'INS-5533']);
      const handle = screen.getByRole('button', { name: 'Reorder INS-5521, 12 Elm Street' });
      handle.focus();
      const tick = () => act(() => new Promise((r) => setTimeout(r, 20)));
      fireEvent.keyDown(handle, { code: 'Space', key: ' ' });
      await tick();
      fireEvent.keyDown(document, { code: 'ArrowDown', key: 'ArrowDown' });
      await tick();
      fireEvent.keyDown(document, { code: 'Space', key: ' ' });
      await tick();
      await vi.waitFor(() => expect(ids()).toEqual(['INS-5524', 'INS-5521', 'INS-5530', 'INS-5533']));
    } finally {
      rect.mockRestore();
    }
  });
});

// ── sign in ──────────────────────────────────────────────────────────────────

describe('SignIn', () => {
  it('signs in with email and password', async () => {
    const onPassword = vi.fn().mockResolvedValue(undefined);
    render(<SignIn onPassword={onPassword} />);
    await userEvent.type(screen.getByLabelText('Email'), 'a@ashford.gov');
    await userEvent.type(screen.getByLabelText('Password'), 'hunter2');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(onPassword).toHaveBeenCalledWith('a@ashford.gov', 'hunter2');
  });

  it('shows what onPassword throws', async () => {
    render(<SignIn onPassword={() => Promise.reject(new Error('Wrong password'))} />);
    await userEvent.type(screen.getByLabelText('Email'), 'a@ashford.gov');
    await userEvent.type(screen.getByLabelText('Password'), 'nope');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Wrong password');
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled();
    expect(screen.getByLabelText('Password')).toHaveAttribute('aria-invalid', 'true');
  });

  it('switches to an emailed link and shows what onEmailLink returns', async () => {
    const onEmailLink = vi.fn().mockResolvedValue('Sent to a@ashford.gov');
    render(<SignIn onPassword={vi.fn()} onEmailLink={onEmailLink} />);
    await userEvent.click(screen.getByRole('button', { name: 'Email me a link instead' }));
    expect(screen.queryByLabelText('Password')).not.toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Email'), 'a@ashford.gov');
    await userEvent.click(screen.getByRole('button', { name: 'Email me a sign-in link' }));
    expect(onEmailLink).toHaveBeenCalledWith('a@ashford.gov');
    expect(await screen.findByText('Sent to a@ashford.gov')).toBeInTheDocument();
  });

  it('offers only the link when there is no onPassword, with a default message', async () => {
    render(<SignIn onEmailLink={() => Promise.resolve()} />);
    expect(screen.queryByLabelText('Password')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /instead/ })).not.toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Email'), 'a@ashford.gov');
    await userEvent.click(screen.getByRole('button', { name: 'Email me a sign-in link' }));
    expect(await screen.findByText('Check your email for a sign-in link.')).toBeInTheDocument();
  });

  it('shows the GovWell logo, the organization and a titled form', () => {
    render(<SignIn organization="City of Ashford" onPassword={vi.fn()} />);
    expect(screen.getByRole('img', { name: 'GovWell' })).toBeInTheDocument();
    expect(screen.getByText('City of Ashford')).toBeInTheDocument();
    expect(screen.getByRole('form', { name: 'Sign in' })).toBeInTheDocument();
  });
});
