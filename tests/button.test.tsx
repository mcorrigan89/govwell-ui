import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('is a button that clicks', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Plan a trip</Button>);
    await userEvent.click(screen.getByRole('button', { name: 'Plan a trip' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('applies its variant', () => {
    render(<Button variant="secondary">Status</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-secondary');
  });

  it('does not click when disabled', async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Go
      </Button>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });
});
