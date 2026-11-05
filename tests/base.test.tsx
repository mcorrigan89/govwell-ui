import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';

describe('Separator', () => {
  it('is decorative by default and can run down', () => {
    const { container } = render(<Separator orientation="vertical" />);
    expect(container.querySelector('[data-slot=separator]')).toHaveAttribute('data-orientation', 'vertical');
  });
});

describe('InputGroup', () => {
  it('focuses its input when the addon is clicked', async () => {
    render(
      <InputGroup>
        <InputGroupAddon>$</InputGroupAddon>
        <InputGroupInput aria-label="Amount" />
      </InputGroup>,
    );
    await userEvent.click(screen.getByText('$'));
    expect(screen.getByLabelText('Amount')).toHaveFocus();
  });
});

describe('Popover', () => {
  it('opens from its trigger and closes on Escape', async () => {
    render(
      <Popover>
        <PopoverTrigger render={<Button />}>Accessibility</PopoverTrigger>
        <PopoverContent>
          <PopoverTitle>Elevators</PopoverTitle>
        </PopoverContent>
      </Popover>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Accessibility' }));
    expect(await screen.findByText('Elevators')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByText('Elevators')).not.toBeInTheDocument();
  });
});

describe('Dialog', () => {
  it('opens a labelled modal with a close button', async () => {
    render(
      <Dialog>
        <DialogTrigger render={<Button />}>Save trip</DialogTrigger>
        <DialogContent>
          <DialogTitle>Save this trip</DialogTitle>
          <DialogDescription>We will tell you about delays.</DialogDescription>
        </DialogContent>
      </Dialog>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save trip' }));
    const dialog = await screen.findByRole('dialog', { name: 'Save this trip' });
    expect(dialog).toHaveAttribute('data-slot', 'dialog-content');
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
