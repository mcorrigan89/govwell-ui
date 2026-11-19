import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { ExampleApp } from '@/docs/example-app/app';
import { SampleLogin } from '@/docs/example-app/login';
import { SamplePortal } from '@/docs/example-app/portal';
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

describe('sample sign-in', () => {
  it('offers Google, Microsoft or an email, and switches to a phone number', async () => {
    render(<SampleLogin />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Sign in to GovWell');
    expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue with Microsoft' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toHaveAttribute('type', 'email');
    await userEvent.click(screen.getByRole('button', { name: 'Use phone' }));
    expect(screen.getByLabelText('Phone number')).toHaveAttribute('type', 'tel');
  });

  it('sends nothing on Continue', async () => {
    render(<SampleLogin />);
    await userEvent.type(screen.getByLabelText('Email address'), 'staff@example.gov');
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByRole('status')).toHaveTextContent('nothing was sent');
  });
});

describe('icon mapping page', () => {
  it('lists each swapped icon with its before and after', () => {
    goTo('#/icons');
    render(<ExampleApp />);
    expect(screen.getByRole('heading', { level: 1, name: 'Icon Mapping' })).toBeInTheDocument();
    const row = screen.getByRole('row', { name: /^Building Permits/ });
    expect(within(row).getByText('Construction')).toBeInTheDocument();
    expect(within(row).getByText('Construction Sign')).toBeInTheDocument();
  });
});

describe('chat page', () => {
  it('greets you, takes an idea as a question and answers it in place of the greeting', async () => {
    goTo('#/chat');
    render(<ExampleApp />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Good (morning|afternoon|evening), Maya/);
    await userEvent.click(screen.getByRole('button', { name: 'Find permits waiting on applicants' }));
    const log = await screen.findByRole('log', { name: 'Conversation' });
    expect(within(log).getByText('Find permits waiting on applicants')).toBeInTheDocument();
    expect(await within(log).findByText(/permits are waiting on applicants/, {}, { timeout: 2000 })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
  });

  it('sends with Enter', async () => {
    goTo('#/chat');
    render(<ExampleApp />);
    await userEvent.type(screen.getByRole('textbox', { name: 'Message' }), 'what is overdue?{Enter}');
    expect(await screen.findByText(/past due/, {}, { timeout: 2000 })).toBeInTheDocument();
  });
});

describe('sample community portal', () => {
  it('lists the online services and who to call', () => {
    render(<SamplePortal />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('City of Twinsburg, OH');
    expect(screen.getByRole('heading', { level: 2, name: 'What can we help with?' })).toBeInTheDocument();
    for (const service of [
      'Building Permits',
      'Business Licenses',
      'Code Complaint',
      'Contractor Registration',
      'Planning & Zoning Applications',
      'Public Dashboards',
    ]) {
      expect(screen.getByRole('link', { name: new RegExp(`^${service.replace('&', '\\&')}`) })).toBeInTheDocument();
    }
    expect(screen.getByRole('link', { name: 'Back' })).toHaveAttribute('href', '?example=app#/insights');
    expect(screen.getByText('Building Department')).toBeInTheDocument();
  });

  it('answers a suggested question with a note that nothing is sent', async () => {
    render(<SamplePortal />);
    await userEvent.click(screen.getByRole('button', { name: 'Look up a record' }));
    expect(screen.getByRole('status')).toHaveTextContent('doesn’t send anything');
  });
});

describe('permits map', () => {
  it('maps Building Permits’ list, follows its search, and folds away', async () => {
    goTo('#/records/building');
    render(<ExampleApp />);
    const map = screen.getByRole('region', { name: /permits on the map/ });
    expect(map).toBeInTheDocument();
    await userEvent.type(screen.getByRole('textbox', { name: 'Search' }), 'zzz-no-match');
    expect(screen.getByRole('region', { name: '0 permits on the map' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Hide map' }));
    expect(screen.queryByRole('region', { name: /permits on the map/ })).toBeNull();
    expect(screen.getByRole('button', { name: 'Show map' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('isn’t on Zoning Permits', () => {
    goTo('#/records/zoning');
    render(<ExampleApp />);
    expect(screen.queryByRole('region', { name: /permits on the map/ })).toBeNull();
  });
});
