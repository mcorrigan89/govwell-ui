import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge } from '@/components/ui/badge';
import { Eyebrow } from '@/components/ui/eyebrow';
import { FlagMark, GovWellLogo } from '@/components/ui/flag-mark';
import { GridPanel } from '@/components/ui/grid-panel';
import { NodeFrame } from '@/components/ui/node-frame';
import { Stat, StatLabel, StatValue } from '@/components/ui/stat';

describe('Eyebrow', () => {
  it('shows its label on a tint, with the icon tile only when given an icon', () => {
    const { container, rerender } = render(<Eyebrow tone="sky">Key features</Eyebrow>);
    expect(screen.getByText('Key features')).toHaveClass('bg-sky-tint', 'eyebrow-type');
    expect(container.querySelector('[aria-hidden]')).toBeNull();
    rerender(
      <Eyebrow tone="sky" icon={<svg data-testid="icon" />}>
        Key features
      </Eyebrow>,
    );
    const tile = screen.getByTestId('icon').parentElement!;
    expect(tile).toHaveAttribute('aria-hidden');
    expect(tile).toHaveClass('bg-sky-tint');
  });
});

describe('FlagMark and GovWellLogo', () => {
  it('are hidden from assistive tech unless titled', () => {
    const { container } = render(<FlagMark />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    render(<GovWellLogo title="GovWell" />);
    expect(screen.getByRole('img', { name: 'GovWell' })).toBeInTheDocument();
  });
});

describe('NodeFrame', () => {
  it('wraps its content with four decorative corner nodes', () => {
    const { container } = render(<NodeFrame>AutoCheck</NodeFrame>);
    expect(screen.getByText('AutoCheck')).toBeInTheDocument();
    expect(container.querySelectorAll('span[aria-hidden]')).toHaveLength(4);
  });
});

describe('Stat', () => {
  it('shows a figure and its caption', () => {
    render(
      <Stat>
        <StatValue>98%</StatValue>
        <StatLabel>Customer satisfaction</StatLabel>
      </Stat>,
    );
    expect(screen.getByText('98%')).toHaveClass('tabular-nums');
    expect(screen.getByText('Customer satisfaction')).toBeInTheDocument();
  });
});

describe('GridPanel', () => {
  it('titles the panel and places the media and the flag mark', () => {
    const { container } = render(<GridPanel tone="hope" eyebrow="Now on GovWell" title="Twinsburg, OH" media={<img alt="Town green" />} />);
    expect(screen.getByRole('heading', { name: 'Twinsburg, OH' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Town green' })).toBeInTheDocument();
    expect(container.querySelector('[data-slot=flag-mark]')).toBeInTheDocument();
    expect(container.querySelector('.bg-hope')).toBeInTheDocument();
  });
});

describe('Badge', () => {
  it('renders a status in its colour', () => {
    render(<Badge variant="warning">Needs info</Badge>);
    expect(screen.getByText('Needs info')).toHaveClass('bg-warning', 'text-warning-foreground');
  });
});
