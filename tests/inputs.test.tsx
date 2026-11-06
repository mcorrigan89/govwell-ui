import { useState } from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ColorPicker, normalizeHexColor } from '@/components/ui/color-picker';
import { DateRangePicker, formatDateRange, resolveDateRange, type DateRangeValue } from '@/components/ui/date-range-picker';
import { FileUpload, fileMatchesAccept, type FileUploadFile } from '@/components/ui/file-upload';
import { NumberInput } from '@/components/ui/number-input';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { SegmentedControl, SegmentedControlItem } from '@/components/ui/segmented-control';
import { parseTime, TimeInput } from '@/components/ui/time-input';
import { Toolbar, ToolbarButton, ToolbarSeparator, ToolbarToggle, ToolbarToggleGroup } from '@/components/ui/toolbar';

// jsdom lacks a few things Base UI's popups and ProseMirror reach for
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
if (typeof Element !== 'undefined') Element.prototype.scrollIntoView ??= function () {};
if (typeof Range !== 'undefined') {
  const rect = { x: 0, y: 0, top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0, toJSON() {} } as DOMRect;
  Range.prototype.getBoundingClientRect ??= () => rect;
  Range.prototype.getClientRects ??= () =>
    ({ length: 0, item: () => null, [Symbol.iterator]: [][Symbol.iterator] }) as unknown as DOMRectList;
}
if (typeof document !== 'undefined') document.elementFromPoint ??= () => null;

describe('NumberInput', () => {
  function Controlled(props: Partial<React.ComponentProps<typeof NumberInput>>) {
    const [value, setValue] = useState<number | null>(props.defaultValue ?? null);
    return (
      <>
        <NumberInput aria-label="Fee" {...props} defaultValue={undefined} value={value} onValueChange={setValue} />
        <output data-testid="value">{value === null ? 'empty' : String(value)}</output>
      </>
    );
  }

  it('steps with the buttons and the arrow keys, within min and max', async () => {
    render(<Controlled defaultValue={9} min={0} max={10} />);
    const input = screen.getByRole('textbox', { name: 'Fee' });
    await userEvent.click(screen.getByRole('button', { name: 'Increase' }));
    expect(screen.getByTestId('value')).toHaveTextContent('10');
    expect(screen.getByRole('button', { name: 'Increase' })).toBeDisabled();
    await userEvent.click(input);
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    expect(screen.getByTestId('value')).toHaveTextContent('8');
  });

  it('clamps on blur and allows an empty box', async () => {
    render(<Controlled min={1} max={12} />);
    const input = screen.getByRole('textbox', { name: 'Fee' });
    await userEvent.type(input, '40');
    await userEvent.tab();
    expect(screen.getByTestId('value')).toHaveTextContent('12');
    expect(input).toHaveValue('12');
    await userEvent.clear(input);
    await userEvent.tab();
    expect(screen.getByTestId('value')).toHaveTextContent('empty');
  });

  it('shows a prefix and suffix and keeps the precision', () => {
    render(<NumberInput aria-label="Fee" defaultValue={150} prefix="$" suffix="USD" precision={2} />);
    expect(screen.getByRole('textbox', { name: 'Fee' })).toHaveValue('150.00');
    expect(screen.getByText('$')).toHaveAttribute('data-slot', 'number-input-prefix');
    expect(screen.getByText('USD')).toHaveAttribute('data-slot', 'number-input-suffix');
  });
});

describe('TimeInput', () => {
  it('reads times however they are typed', () => {
    expect(parseTime('2:30 pm')).toBe('14:30');
    expect(parseTime('2p')).toBe('14:00');
    expect(parseTime('1430')).toBe('14:30');
    expect(parseTime('12am')).toBe('00:00');
    expect(parseTime('9')).toBe('09:00');
    expect(parseTime('25:00')).toBeNull();
    expect(parseTime('13pm')).toBeNull();
  });

  it('settles typed text on blur and steps with the arrow keys', async () => {
    const onValueChange = vi.fn();
    function Demo() {
      const [value, setValue] = useState<string | null>(null);
      return (
        <TimeInput
          aria-label="Opens"
          value={value}
          onValueChange={(v) => {
            setValue(v);
            onValueChange(v);
          }}
        />
      );
    }
    render(<Demo />);
    const input = screen.getByRole('textbox', { name: 'Opens' });
    await userEvent.type(input, '2p');
    await userEvent.tab();
    expect(onValueChange).toHaveBeenLastCalledWith('14:00');
    expect(input).toHaveValue('2:00 PM');
    await userEvent.click(input);
    await userEvent.keyboard('{ArrowUp}');
    expect(onValueChange).toHaveBeenLastCalledWith('14:15');
    expect(input).toHaveValue('2:15 PM');
  });

  it('emits null when cleared, puts back nonsense, and shows 24-hour time', async () => {
    const onValueChange = vi.fn();
    render(<TimeInput aria-label="Cutoff" value="14:30" onValueChange={onValueChange} hourCycle={24} />);
    const input = screen.getByRole('textbox', { name: 'Cutoff' });
    expect(input).toHaveValue('14:30');
    await userEvent.clear(input);
    expect(onValueChange).toHaveBeenCalledWith(null);
    onValueChange.mockClear();
    await userEvent.type(input, 'lunch');
    await userEvent.tab();
    expect(onValueChange).not.toHaveBeenCalled();
    expect(input).toHaveValue('14:30');
  });

  it('clamps to min and max', async () => {
    const onValueChange = vi.fn();
    render(<TimeInput aria-label="Window" min="07:00" max="17:00" onValueChange={onValueChange} />);
    await userEvent.type(screen.getByRole('textbox', { name: 'Window' }), '6am{Enter}');
    expect(onValueChange).toHaveBeenLastCalledWith('07:00');
  });
});

describe('DateRangePicker', () => {
  it('formats ranges like the reference', () => {
    const today = new Date(2026, 10, 5);
    expect(formatDateRange(new Date(2026, 2, 3), new Date(2026, 2, 14), today)).toBe('March 3 – 14');
    expect(formatDateRange(new Date(2026, 2, 3), new Date(2026, 3, 2), today)).toBe('March 3 – April 2');
    expect(formatDateRange(new Date(2026, 2, 3), new Date(2026, 2, 3), today)).toBe('March 3');
    expect(formatDateRange(new Date(2025, 11, 28), new Date(2026, 0, 4), today)).toBe('December 28, 2025 – January 4, 2026');
    expect(formatDateRange(new Date(2025, 2, 3), new Date(2025, 2, 14), today)).toBe('March 3 – 14, 2025');
  });

  it('works presets out again from today', () => {
    const { from, to } = resolveDateRange({ type: 'last-7-days' }, undefined, new Date(2026, 10, 5, 15));
    expect(from).toEqual(new Date(2026, 9, 29));
    expect(to).toEqual(new Date(2026, 10, 5, 23, 59, 59, 999));
    const mtd = resolveDateRange({ type: 'month-to-date' }, undefined, new Date(2026, 10, 5));
    expect(mtd.from).toEqual(new Date(2026, 10, 1));
  });

  it('picks a preset from the popover and closes', async () => {
    const onValueChange = vi.fn();
    render(<DateRangePicker aria-label="Submitted" onValueChange={onValueChange} />);
    const trigger = screen.getByRole('button', { name: /^Submitted: / });
    expect(trigger).toHaveTextContent('Pick a date range');
    await userEvent.click(trigger);
    await userEvent.click(await screen.findByRole('button', { name: 'Today' }));
    const value = onValueChange.mock.calls[0]![0] as DateRangeValue;
    expect(value.type).toBe('today');
    expect(value.from?.getHours()).toBe(0);
    expect(value.to?.getHours()).toBe(23);
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Today' })).not.toBeInTheDocument());
  });

  it('takes a typed custom range and moves the end up to a later start', async () => {
    function Demo() {
      const [value, setValue] = useState<DateRangeValue>({
        type: 'custom',
        from: new Date(2026, 2, 3),
        to: new Date(2026, 2, 14, 23, 59, 59, 999),
      });
      return <DateRangePicker aria-label="Issued" value={value} onValueChange={setValue} />;
    }
    render(<Demo />);
    const trigger = screen.getByRole('button', { name: /^Issued: / });
    expect(trigger).toHaveTextContent('March 3 – 14');
    await userEvent.click(trigger);
    // a custom value opens on the custom pane
    const end = await screen.findByRole('textbox', { name: 'End date' });
    expect(end).toHaveValue('3/14/2026');
    await userEvent.clear(end);
    await userEvent.type(end, '3/20/2026');
    expect(trigger).toHaveTextContent('March 3 – 20');
    const start = screen.getByRole('textbox', { name: 'Start date' });
    await userEvent.clear(start);
    await userEvent.type(start, '4/2/2026');
    await userEvent.tab();
    expect(trigger).toHaveTextContent('April 2');
    expect(screen.getByRole('button', { name: /Custom range/ })).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('SegmentedControl', () => {
  it('chooses one option and never none', async () => {
    const onValueChange = vi.fn();
    function Demo() {
      const [value, setValue] = useState('list');
      return (
        <SegmentedControl
          aria-label="View"
          value={value}
          onValueChange={(v) => {
            setValue(v);
            onValueChange(v);
          }}
        >
          <SegmentedControlItem value="list">List</SegmentedControlItem>
          <SegmentedControlItem value="map">Map</SegmentedControlItem>
          <SegmentedControlItem value="calendar" disabled>
            Calendar
          </SegmentedControlItem>
        </SegmentedControl>
      );
    }
    render(<Demo />);
    const list = screen.getByRole('button', { name: 'List' });
    const map = screen.getByRole('button', { name: 'Map' });
    expect(list).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(list);
    expect(onValueChange).not.toHaveBeenCalled();
    expect(list).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(map);
    expect(onValueChange).toHaveBeenCalledWith('map');
    expect(map).toHaveAttribute('aria-pressed', 'true');
    expect(list).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(screen.getByRole('button', { name: 'Calendar' }));
    expect(onValueChange).toHaveBeenCalledTimes(1);
  });

  it('moves focus with the arrow keys and sizes to fit on request', async () => {
    render(
      <SegmentedControl aria-label="Period" defaultValue="week" fitContent size="sm">
        <SegmentedControlItem value="week">Week</SegmentedControlItem>
        <SegmentedControlItem value="month" highlighted>
          Month
        </SegmentedControlItem>
      </SegmentedControl>,
    );
    const group = screen.getByRole('group', { name: 'Period' });
    expect(group).toHaveClass('w-fit', 'h-10');
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Week' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    const month = screen.getByRole('button', { name: 'Month' });
    expect(month).toHaveFocus();
    expect(month).toHaveAttribute('data-highlighted');
    await userEvent.keyboard(' ');
    expect(month).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('Toolbar', () => {
  it('is one tab stop with arrow-key focus between its items', async () => {
    const onPrint = vi.fn();
    render(
      <Toolbar aria-label="Permit actions">
        <ToolbarButton onClick={onPrint} aria-label="Print">
          P
        </ToolbarButton>
        <ToolbarSeparator />
        <ToolbarButton aria-label="Share">S</ToolbarButton>
        <ToolbarToggle aria-label="Table view">T</ToolbarToggle>
      </Toolbar>,
    );
    expect(screen.getByRole('toolbar', { name: 'Permit actions' })).toHaveAttribute('data-slot', 'toolbar');
    expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'vertical');
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Print' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Share' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    const toggle = screen.getByRole('button', { name: 'Table view' });
    expect(toggle).toHaveFocus();
    await userEvent.keyboard(' ');
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await userEvent.keyboard('{ArrowRight}{Enter}');
    expect(onPrint).toHaveBeenCalledTimes(1);
  });

  it('runs a toggle group and names icon items by their tooltip', async () => {
    const onValueChange = vi.fn();
    render(
      <Toolbar aria-label="Layout">
        <ToolbarToggleGroup defaultValue={['left']} onValueChange={onValueChange}>
          <ToolbarToggle value="left" tooltip="Align left">
            L
          </ToolbarToggle>
          <ToolbarToggle value="right" tooltip="Align right">
            R
          </ToolbarToggle>
        </ToolbarToggleGroup>
      </Toolbar>,
    );
    const left = screen.getByRole('button', { name: 'Align left' });
    expect(left).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Align right' }));
    expect(onValueChange).toHaveBeenLastCalledWith(['right'], expect.anything());
    expect(left).toHaveAttribute('aria-pressed', 'false');
  });
});

describe('ColorPicker', () => {
  it('normalizes hex colours', () => {
    expect(normalizeHexColor('#F00')).toBe('#ff0000');
    expect(normalizeHexColor('41AAEB')).toBe('#41aaeb');
    expect(normalizeHexColor('blue')).toBeNull();
  });

  it('picks a brand preset and commits once when it closes', async () => {
    const onValueCommit = vi.fn();
    function Demo() {
      const [value, setValue] = useState('#41aaeb');
      return <ColorPicker aria-label="Status colour" value={value} onValueChange={setValue} onValueCommit={onValueCommit} />;
    }
    render(<Demo />);
    const trigger = screen.getByRole('button', { name: 'Status colour: #41aaeb' });
    await userEvent.click(trigger);
    const presets = await screen.findByRole('group', { name: 'Preset colours' });
    expect(within(presets).getByRole('button', { name: 'Sky' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(within(presets).getByRole('button', { name: 'Hope' }));
    expect(screen.getByRole('button', { name: 'Status colour: #feaf0e' })).toBeInTheDocument();
    expect(onValueCommit).not.toHaveBeenCalled();
    await userEvent.keyboard('{Escape}');
    expect(onValueCommit).toHaveBeenCalledExactlyOnceWith('#feaf0e');
  });

  it('takes a typed hex, three digits on blur', async () => {
    const onValueChange = vi.fn();
    render(<ColorPicker aria-label="Layer" value="#202020" onValueChange={onValueChange} presets={[]} />);
    await userEvent.click(screen.getByRole('button', { name: 'Layer: #202020' }));
    const hex = await screen.findByRole('textbox', { name: 'Layer hex' });
    await userEvent.clear(hex);
    await userEvent.type(hex, '39c25e');
    expect(onValueChange).toHaveBeenLastCalledWith('#39c25e');
    onValueChange.mockClear();
    await userEvent.clear(hex);
    await userEvent.type(hex, 'f00');
    expect(onValueChange).not.toHaveBeenCalled();
    fireEvent.blur(hex);
    expect(onValueChange).toHaveBeenLastCalledWith('#ff0000');
    expect(screen.queryByRole('group', { name: 'Preset colours' })).not.toBeInTheDocument();
  });
});

describe('FileUpload', () => {
  const pdf = (name = 'site-plan.pdf', size = 1000) => new File(['x'.repeat(size)], name, { type: 'application/pdf' });

  it('matches files against accept', () => {
    expect(fileMatchesAccept(pdf(), '.pdf')).toBe(true);
    expect(fileMatchesAccept(pdf(), 'application/pdf')).toBe(true);
    expect(fileMatchesAccept(new File([''], 'a.png', { type: 'image/png' }), 'image/*')).toBe(true);
    expect(fileMatchesAccept(new File([''], 'a.png', { type: 'image/png' }), '.pdf')).toBe(false);
    expect(fileMatchesAccept(pdf(), '*')).toBe(true);
  });

  it('opens the file dialog from the zone and lists chosen files', async () => {
    const onFilesChange = vi.fn();
    const { container } = render(<FileUpload multiple onFilesChange={onFilesChange} />);
    const input = container.querySelector('input[type=file]') as HTMLInputElement;
    const click = vi.spyOn(input, 'click');
    const zone = screen.getByRole('button', { name: /^Drop files here/ });
    await userEvent.click(zone);
    expect(click).toHaveBeenCalledTimes(1);
    zone.focus();
    await userEvent.keyboard('{Enter}');
    expect(click).toHaveBeenCalledTimes(2);
    await userEvent.upload(input, [pdf('a.pdf'), pdf('b.pdf')]);
    await waitFor(() => expect(onFilesChange).toHaveBeenCalled());
    expect(screen.getByText('a.pdf')).toBeInTheDocument();
    expect(screen.getByText('b.pdf')).toBeInTheDocument();
  });

  it('turns away the wrong type, too big and too many, and says why', async () => {
    const onReject = vi.fn();
    const onFilesChange = vi.fn();
    render(
      <FileUpload
        multiple
        accept=".pdf"
        maxSize={2000}
        maxCount={2}
        defaultFiles={[{ uid: '1', name: 'old.pdf' }]}
        onReject={onReject}
        onFilesChange={onFilesChange}
      />,
    );
    const zone = screen.getByRole('button', { name: /^Drop files here/ });
    const files = [pdf('ok.pdf'), new File(['x'], 'photo.png', { type: 'image/png' }), pdf('huge.pdf', 5000), pdf('extra.pdf')];
    fireEvent.dragEnter(zone, { dataTransfer: { files } });
    expect(zone).toHaveAttribute('data-dragging');
    fireEvent.drop(zone, { dataTransfer: { files } });
    expect(zone).not.toHaveAttribute('data-dragging');
    await waitFor(() => expect(onFilesChange).toHaveBeenCalled());
    expect(onReject.mock.calls[0]![0].map((r: { file: File; reason: string }) => `${r.file.name}:${r.reason}`)).toEqual([
      'photo.png:accept',
      'huge.pdf:size',
      'extra.pdf:count',
    ]);
    expect(onFilesChange.mock.calls[0]![0].map((f: FileUploadFile) => f.name)).toEqual(['old.pdf', 'ok.pdf']);
  });

  it('skips files beforeUpload returns false for, and replaces in single mode', async () => {
    const onFilesChange = vi.fn();
    const beforeUpload = vi.fn((file: File) => file.name !== 'skip.pdf');
    const { container } = render(
      <FileUpload defaultFiles={[{ uid: '1', name: 'old.pdf' }]} beforeUpload={beforeUpload} onFilesChange={onFilesChange} />,
    );
    const input = container.querySelector('input[type=file]') as HTMLInputElement;
    await userEvent.upload(input, pdf('skip.pdf'));
    await act(async () => {});
    expect(onFilesChange).not.toHaveBeenCalled();
    await userEvent.upload(input, pdf('new.pdf'));
    await waitFor(() => expect(onFilesChange).toHaveBeenCalled());
    expect(onFilesChange.mock.calls[0]![0].map((f: FileUploadFile) => f.name)).toEqual(['new.pdf']);
    expect(screen.queryByText('old.pdf')).not.toBeInTheDocument();
  });

  it('shows progress and errors, and removes unless onRemove says no', async () => {
    const onRemove = vi.fn((f: FileUploadFile) => f.uid !== 'keep');
    render(
      <FileUpload
        onRemove={onRemove}
        defaultFiles={[
          { uid: 'up', name: 'survey.pdf', status: 'uploading', percent: 40 },
          { uid: 'bad', name: 'photo.heic', status: 'error', error: 'HEIC isn’t accepted' },
          { uid: 'keep', name: 'permit.pdf', status: 'done' },
        ]}
      />,
    );
    expect(screen.getByRole('progressbar', { name: 'Uploading survey.pdf' })).toHaveAttribute('aria-valuenow', '40');
    expect(screen.getByText('HEIC isn’t accepted')).toHaveClass('text-error');
    await userEvent.click(screen.getByRole('button', { name: 'Remove photo.heic' }));
    await waitFor(() => expect(screen.queryByText('photo.heic')).not.toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Remove permit.pdf' }));
    await act(async () => {});
    expect(screen.getByText('permit.pdf')).toBeInTheDocument();
  });

  it('does nothing when disabled, and has a button variant', async () => {
    const { container } = render(
      <>
        <FileUpload disabled />
        <FileUpload variant="button" label="Upload licence" />
      </>,
    );
    const inputs = container.querySelectorAll<HTMLInputElement>('input[type=file]');
    const click = vi.spyOn(inputs[0]!, 'click');
    await userEvent.click(screen.getByRole('button', { name: /^Drop a file here/ }));
    expect(click).not.toHaveBeenCalled();
    const click2 = vi.spyOn(inputs[1]!, 'click');
    await userEvent.click(screen.getByRole('button', { name: 'Upload licence' }));
    expect(click2).toHaveBeenCalledTimes(1);
  });
});

describe('RichTextEditor', () => {
  it('renders the HTML it is given in GovWell prose, with a toolbar', async () => {
    render(<RichTextEditor aria-label="Notice" value="<p>Grass over <strong>10 inches</strong></p>" />);
    const editor = await screen.findByRole('textbox', { name: 'Notice' });
    expect(editor).toHaveAttribute('contenteditable', 'true');
    expect(within(editor).getByText('10 inches').tagName).toBe('STRONG');
    const toolbar = screen.getByRole('toolbar', { name: 'Formatting' });
    for (const name of ['Bold', 'Italic', 'Underline', 'Strikethrough', 'Bulleted list', 'Numbered list', 'Link']) {
      expect(within(toolbar).getByRole('button', { name })).toBeInTheDocument();
    }
  });

  it('formats with the toolbar and reports HTML through onChange', async () => {
    const onChange = vi.fn();
    function Demo() {
      const [value, setValue] = useState('<p>Final inspection</p>');
      return (
        <RichTextEditor
          aria-label="Condition"
          value={value}
          onChange={(html) => {
            setValue(html);
            onChange(html);
          }}
        />
      );
    }
    render(<Demo />);
    await screen.findByRole('textbox', { name: 'Condition' });
    await userEvent.click(screen.getByRole('button', { name: 'Bulleted list' }));
    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith('<ul><li><p>Final inspection</p></li></ul>'));
    expect(screen.getByRole('button', { name: 'Bulleted list' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('replaces its text when the value changes from outside, and empties to ""', async () => {
    const onChange = vi.fn();
    const { rerender } = render(<RichTextEditor aria-label="Body" value="<p>One</p>" onChange={onChange} />);
    const editor = await screen.findByRole('textbox', { name: 'Body' });
    rerender(<RichTextEditor aria-label="Body" value="<p>Two</p>" onChange={onChange} />);
    await waitFor(() => expect(editor).toHaveTextContent('Two'));
    expect(onChange).not.toHaveBeenCalled();
    rerender(<RichTextEditor aria-label="Body" value="" onChange={onChange} placeholder="Write the notice…" />);
    await waitFor(() => expect(editor.textContent).toBe(''));
  });

  it('is read-only without a toolbar, and disabled with one', async () => {
    const { unmount } = render(<RichTextEditor aria-label="Read" value="<p>Fixed</p>" readOnly />);
    const read = await screen.findByRole('textbox', { name: 'Read' });
    expect(read).toHaveAttribute('contenteditable', 'false');
    expect(read).toHaveAttribute('aria-readonly', 'true');
    expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
    unmount();
    render(<RichTextEditor aria-label="Off" value="<p>Off</p>" disabled />);
    const off = await screen.findByRole('textbox', { name: 'Off' });
    expect(off).toHaveAttribute('contenteditable', 'false');
    expect(screen.getByRole('button', { name: 'Bold' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('keeps merge fields as chips and stores them as data-field spans', async () => {
    render(
      <RichTextEditor
        aria-label="Email"
        value='<p>Permit <span data-field="permit_number"></span> is approved.</p>'
        mergeFields={[{ value: 'permit_number', label: 'Permit number' }]}
      />,
    );
    const editor = await screen.findByRole('textbox', { name: 'Email' });
    const chip = within(editor).getByText('Permit number');
    expect(chip).toHaveAttribute('data-field', 'permit_number');
    expect(screen.getByRole('button', { name: /Insert field/ })).toBeInTheDocument();
  });
});
