import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { ExampleApp } from '@/docs/example-app/app';
import { RECORDS, recordsOfType } from '@/docs/example-app/data';

// jsdom has no ResizeObserver (cmdk and recharts measure with one) or scrollIntoView
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;
Element.prototype.scrollIntoView ??= function () {};

const goTo = (hash: string) => {
  act(() => {
    location.hash = hash;
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
};

afterEach(() => {
  location.hash = '';
});

describe('example app', () => {
  it('numbers each type’s records in the order they came in', () => {
    for (const typeId of ['building', 'zoning']) {
      const oldestFirst = recordsOfType(typeId)
        .slice()
        .sort((a, b) => a.submitted.getTime() - b.submitted.getTime());
      expect(oldestFirst.map((r) => r.number)).toEqual(
        oldestFirst
          .map((r) => r.number)
          .slice()
          .sort(),
      );
    }
    expect(new Set(RECORDS.map((r) => r.id)).size).toBe(RECORDS.length);
  });

  it('opens on Insights with the sidebar groups', () => {
    location.hash = '#/insights';
    render(<ExampleApp />);
    expect(screen.getByRole('heading', { level: 1, name: 'Insights' })).toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(within(nav).getByRole('link', { name: 'Overview' })).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('button', { name: 'Building Permits' })).toBeInTheDocument();
  });

  it('lists permits in saved views and opens one', async () => {
    location.hash = '#/records/building';
    render(<ExampleApp />);
    expect(screen.getByRole('heading', { level: 1, name: 'Building Permits' })).toBeInTheDocument();
    // the Building Permits group is open, with Permits current
    expect(screen.getByRole('link', { name: /^Permits/ })).toHaveAttribute('aria-current', 'page');

    await userEvent.click(screen.getByRole('tab', { name: /^All/ }));
    const first = recordsOfType('building')[0]!;
    const link = screen.getByRole('link', { name: first.number });
    expect(link).toHaveAttribute('href', `#/records/building/${first.id}`);

    goTo(`#/records/building/${first.id}`);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(first.number);
    expect(screen.getByRole('complementary', { name: 'Workflow' })).toBeInTheDocument();
  });

  it('moves a record along its workflow', async () => {
    const record = RECORDS.find((r) => r.typeId === 'building' && r.statusKey === 'submitted')!;
    location.hash = `#/records/building/${record.id}`;
    render(<ExampleApp />);
    const workflow = screen.getByRole('complementary', { name: 'Workflow' });
    await userEvent.click(within(workflow).getByRole('button', { name: 'Accept application' }));
    expect(within(workflow).getByRole('button', { name: 'Complete review' })).toBeInTheDocument();
  });

  it('finds a record from ⌘K search', async () => {
    location.hash = '#/insights';
    render(<ExampleApp />);
    const record = RECORDS[3]!;
    await userEvent.keyboard('{Meta>}k{/Meta}');
    const input = await screen.findByPlaceholderText(/Search records/);
    await userEvent.type(input, record.number);
    await userEvent.keyboard('{Enter}');
    expect(location.hash).toBe(`#/records/${record.typeId}/${record.id}`);
  });

  it('answers in the assistant panel', async () => {
    location.hash = '#/insights';
    render(<ExampleApp />);
    await userEvent.click(screen.getByRole('button', { name: 'Ask the assistant' }));
    const panel = screen.getByRole('complementary', { name: 'AI assistant' });
    await userEvent.type(within(panel).getByRole('textbox'), "what's overdue?{Enter}");
    expect(await within(panel).findByText(/past due/, {}, { timeout: 2000 })).toBeInTheDocument();
  });

  it('shows a placeholder for pages the sample leaves out', () => {
    location.hash = '#/payments/invoices';
    render(<ExampleApp />);
    expect(screen.getByText('Not in this sample')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Payments: Invoices');
  });
});
