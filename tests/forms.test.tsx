import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Button } from '@/components/ui/button';
import { ButtonGroup, ButtonGroupText } from '@/components/ui/button-group';
import { Checkbox } from '@/components/ui/checkbox';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Toggle } from '@/components/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

// jsdom lacks a few things Base UI's popups and sliders reach for
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
if (typeof Element !== 'undefined') Element.prototype.scrollIntoView ??= function () {};

describe('Checkbox', () => {
  it('checks and unchecks by click and by its label', async () => {
    const onCheckedChange = vi.fn();
    render(
      <Label>
        <Checkbox onCheckedChange={onCheckedChange} />
        Site plan attached
      </Label>,
    );
    const box = screen.getByRole('checkbox', { name: 'Site plan attached' });
    expect(box).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(box);
    expect(box).toHaveAttribute('aria-checked', 'true');
    expect(box).toHaveAttribute('data-slot', 'checkbox');
    expect(onCheckedChange).toHaveBeenLastCalledWith(true, expect.anything());
    await userEvent.click(screen.getByText('Site plan attached'));
    expect(box).toHaveAttribute('aria-checked', 'false');
  });

  it('toggles with the space bar and ignores clicks when disabled', async () => {
    render(
      <>
        <Checkbox aria-label="Email updates" />
        <Checkbox aria-label="Expedited review" disabled />
      </>,
    );
    await userEvent.tab();
    expect(screen.getByRole('checkbox', { name: 'Email updates' })).toHaveFocus();
    await userEvent.keyboard(' ');
    expect(screen.getByRole('checkbox', { name: 'Email updates' })).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(screen.getByRole('checkbox', { name: 'Expedited review' }));
    expect(screen.getByRole('checkbox', { name: 'Expedited review' })).toHaveAttribute('aria-checked', 'false');
  });
});

describe('RadioGroup', () => {
  function PaymentMethods({ onValueChange }: { onValueChange?: (v: unknown) => void }) {
    return (
      <RadioGroup defaultValue="card" aria-label="Payment method" onValueChange={onValueChange}>
        <Label>
          <RadioGroupItem value="card" />
          Card
        </Label>
        <Label>
          <RadioGroupItem value="ach" />
          Bank transfer
        </Label>
        <Label>
          <RadioGroupItem value="counter" />
          In person
        </Label>
      </RadioGroup>
    );
  }

  it('chooses one at a time', async () => {
    const onValueChange = vi.fn();
    render(<PaymentMethods onValueChange={onValueChange} />);
    expect(screen.getByRole('radio', { name: 'Card' })).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(screen.getByRole('radio', { name: 'In person' }));
    expect(screen.getByRole('radio', { name: 'In person' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Card' })).toHaveAttribute('aria-checked', 'false');
    expect(onValueChange).toHaveBeenLastCalledWith('counter', expect.anything());
  });

  it('moves the choice with the arrow keys', async () => {
    render(<PaymentMethods />);
    await userEvent.tab();
    expect(screen.getByRole('radio', { name: 'Card' })).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('radio', { name: 'Bank transfer' })).toHaveFocus();
    expect(screen.getByRole('radio', { name: 'Bank transfer' })).toHaveAttribute('aria-checked', 'true');
  });
});

describe('Switch', () => {
  it('turns on and off, by click and keyboard', async () => {
    render(<Switch aria-label="Status emails" />);
    const sw = screen.getByRole('switch', { name: 'Status emails' });
    expect(sw).toHaveAttribute('aria-checked', 'false');
    expect(sw).toHaveAttribute('data-size', 'default');
    await userEvent.click(sw);
    expect(sw).toHaveAttribute('aria-checked', 'true');
    expect(sw).toHaveAttribute('data-checked');
    await userEvent.keyboard(' ');
    expect(sw).toHaveAttribute('aria-checked', 'false');
  });
});

// jsdom has no layout, so Base UI keeps the thumbs visibility: hidden until it
// can measure them, and Testing Library won't name a hidden element: find the
// thumbs' inputs by their aria-label instead
function thumb(name: string) {
  const found = screen.getAllByRole('slider', { hidden: true }).find((el) => el.getAttribute('aria-label') === name);
  if (!found) throw new Error(`no slider thumb named ${name}`);
  return found;
}

describe('Slider', () => {
  it('names its thumb and steps with the arrow keys', async () => {
    const onValueChange = vi.fn();
    render(<Slider aria-label="Notify radius" defaultValue={10} max={30} onValueChange={onValueChange} />);
    const input = thumb('Notify radius');
    expect(input).toHaveAttribute('aria-valuenow', '10');
    // the input sits inside the thumb; focus it directly (jsdom has no layout to click on)
    input.focus();
    fireEvent.keyDown(input, { key: 'ArrowRight' });
    expect(input).toHaveAttribute('aria-valuenow', '11');
    expect(onValueChange).toHaveBeenLastCalledWith(11, expect.anything());
  });

  it('draws a thumb per value in a range, each with its own name', () => {
    render(<Slider defaultValue={[7, 10]} min={5} max={24} getAriaLabel={(i) => (i === 0 ? 'Earliest hour' : 'Latest hour')} />);
    expect(thumb('Earliest hour')).toHaveAttribute('aria-valuenow', '7');
    expect(thumb('Latest hour')).toHaveAttribute('aria-valuenow', '10');
  });
});

describe('Toggle', () => {
  it('latches when pressed', async () => {
    const onPressedChange = vi.fn();
    render(<Toggle onPressedChange={onPressedChange}>Overdue</Toggle>);
    const t = screen.getByRole('button', { name: 'Overdue' });
    expect(t).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(t);
    expect(t).toHaveAttribute('aria-pressed', 'true');
    expect(onPressedChange).toHaveBeenLastCalledWith(true, expect.anything());
  });
});

describe('ToggleGroup', () => {
  it('allows one pressed at a time by default', async () => {
    render(
      <ToggleGroup defaultValue={['day']} aria-label="Period">
        <ToggleGroupItem value="day">Day</ToggleGroupItem>
        <ToggleGroupItem value="week">Week</ToggleGroupItem>
      </ToggleGroup>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Week' }));
    expect(screen.getByRole('button', { name: 'Week' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Day' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('allows several with multiple, and passes variant to its items', async () => {
    const onValueChange = vi.fn();
    render(
      <ToggleGroup multiple variant="outline" spacing={0} onValueChange={onValueChange} aria-label="Permit types">
        <ToggleGroupItem value="building">Building</ToggleGroupItem>
        <ToggleGroupItem value="zoning">Zoning</ToggleGroupItem>
      </ToggleGroup>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Building' }));
    await userEvent.click(screen.getByRole('button', { name: 'Zoning' }));
    expect(onValueChange).toHaveBeenLastCalledWith(['building', 'zoning'], expect.anything());
    expect(screen.getByRole('button', { name: 'Zoning' })).toHaveAttribute('data-variant', 'outline');
    expect(screen.getByRole('group', { name: 'Permit types' })).toHaveAttribute('data-spacing', '0');
  });

  it('moves focus along the row with the arrow keys', async () => {
    render(
      <ToggleGroup aria-label="Period">
        <ToggleGroupItem value="day">Day</ToggleGroupItem>
        <ToggleGroupItem value="week">Week</ToggleGroupItem>
      </ToggleGroup>,
    );
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Day' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Week' })).toHaveFocus();
  });
});

describe('Textarea', () => {
  it('takes typed text', async () => {
    render(<Textarea aria-label="Describe the issue" />);
    const box = screen.getByRole('textbox', { name: 'Describe the issue' });
    await userEvent.type(box, 'Streetlight out on Elm St');
    expect(box).toHaveValue('Streetlight out on Elm St');
    expect(box).toHaveAttribute('data-slot', 'textarea');
  });
});

describe('NativeSelect', () => {
  it('is a real select that changes value', async () => {
    const onChange = vi.fn();
    render(
      <NativeSelect aria-label="Zoning district" defaultValue="r-2" onChange={onChange}>
        <NativeSelectOption value="r-1">R-1 Single-family</NativeSelectOption>
        <NativeSelectOption value="r-2">R-2 Two-family</NativeSelectOption>
      </NativeSelect>,
    );
    const select = screen.getByRole('combobox', { name: 'Zoning district' });
    expect(select).toHaveValue('r-2');
    await userEvent.selectOptions(select, 'r-1');
    expect(select).toHaveValue('r-1');
    expect(onChange).toHaveBeenCalled();
  });
});

describe('Select', () => {
  const items = [
    { value: 'footing', label: 'Footing' },
    { value: 'framing', label: 'Framing' },
  ];

  it('opens a list and picks an option', async () => {
    const onValueChange = vi.fn();
    render(
      <Select items={items} onValueChange={onValueChange}>
        <SelectTrigger aria-label="Inspection">
          <SelectValue placeholder="Choose an inspection" />
        </SelectTrigger>
        <SelectContent>
          {items.map((i) => (
            <SelectItem key={i.value} value={i.value}>
              {i.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>,
    );
    const trigger = screen.getByRole('combobox', { name: 'Inspection' });
    expect(trigger).toHaveTextContent('Choose an inspection');
    await userEvent.click(trigger);
    const listbox = await screen.findByRole('listbox');
    expect(listbox.closest('[data-slot=select-content]')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('option', { name: 'Framing' }));
    expect(onValueChange).toHaveBeenLastCalledWith('framing', expect.anything());
    expect(trigger).toHaveTextContent('Framing');
  });
});

describe('InputOTP', () => {
  it('fills one character per slot and reports the code', async () => {
    const onValueChange = vi.fn();
    render(
      <InputOTP length={4} onValueChange={onValueChange} aria-label="Code">
        <InputOTPGroup>
          <InputOTPSlot />
          <InputOTPSlot />
          <InputOTPSlot />
          <InputOTPSlot />
        </InputOTPGroup>
      </InputOTP>,
    );
    const slots = screen.getAllByRole('textbox');
    expect(slots).toHaveLength(4);
    await userEvent.click(slots[0]!);
    await userEvent.keyboard('2468');
    expect(onValueChange).toHaveBeenLastCalledWith('2468', expect.anything());
    expect(slots.map((s) => (s as HTMLInputElement).value).join('')).toBe('2468');
  });
});

describe('ButtonGroup', () => {
  it('is a labelled group of its controls', () => {
    render(
      <ButtonGroup aria-label="Fee">
        <ButtonGroupText>$</ButtonGroupText>
        <Button>Add</Button>
        <Button>Waive</Button>
      </ButtonGroup>,
    );
    const group = screen.getByRole('group', { name: 'Fee' });
    expect(group).toHaveAttribute('data-slot', 'button-group');
    expect(screen.getByText('$')).toHaveAttribute('data-slot', 'button-group-text');
    expect(group.querySelectorAll('button')).toHaveLength(2);
  });
});
