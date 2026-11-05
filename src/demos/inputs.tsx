import { useState, type ReactNode } from 'react';
import { AlignCenter, AlignLeft, AlignRight, CalendarDays, ClipboardCheck, List, MapIcon, Printer, Share2, Table2 } from 'lucide-react';

import { ColorPicker } from '@/components/ui/color-picker';
import { DateRangePicker, type DateRangeValue } from '@/components/ui/date-range-picker';
import { FileUpload, type FileUploadFile } from '@/components/ui/file-upload';
import { Label } from '@/components/ui/label';
import { NumberInput } from '@/components/ui/number-input';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { SegmentedControl, SegmentedControlItem } from '@/components/ui/segmented-control';
import { TimeInput } from '@/components/ui/time-input';
import {
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarLink,
  ToolbarSeparator,
  ToolbarToggle,
  ToolbarToggleGroup,
} from '@/components/ui/toolbar';

// Demos for the richer inputs, keyed by registry item name.

function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function NumberInputDemo() {
  const [fee, setFee] = useState<number | null>(150);
  const [area, setArea] = useState<number | null>(null);
  return (
    <div className="flex flex-col gap-6">
      <Field label="Plan review fee" htmlFor="demo-fee">
        <NumberInput id="demo-fee" value={fee} onValueChange={setFee} prefix="$" precision={2} min={0} step={25} />
      </Field>
      <Field label="Floor area" htmlFor="demo-area">
        <NumberInput
          id="demo-area"
          value={area}
          onValueChange={setArea}
          suffix="sq ft"
          min={0}
          max={100000}
          step={50}
          placeholder="e.g. 1,200"
        />
      </Field>
      <Field label="Dwelling units" htmlFor="demo-units">
        <NumberInput id="demo-units" defaultValue={1} min={1} max={12} />
      </Field>
      <Field label="Reinspections (locked)" htmlFor="demo-reinspections">
        <NumberInput id="demo-reinspections" defaultValue={2} disabled />
      </Field>
    </div>
  );
}

function TimeInputDemo() {
  const [start, setStart] = useState<string | null>('09:00');
  const [cutoff, setCutoff] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-6">
      <Field label="Inspection window opens" htmlFor="demo-start">
        <TimeInput id="demo-start" value={start} onValueChange={setStart} min="07:00" max="17:00" />
      </Field>
      <Field label="Same-day request cutoff (24-hour)" htmlFor="demo-cutoff">
        <TimeInput id="demo-cutoff" value={cutoff} onValueChange={setCutoff} hourCycle={24} step={30} />
      </Field>
      <p className="text-sm text-muted-foreground">
        Stored as {start ?? 'nothing'} and {cutoff ?? 'nothing'}. Try “2p”, “1430” or the arrow keys.
      </p>
    </div>
  );
}

function DateRangePickerDemo() {
  const [range, setRange] = useState<DateRangeValue>({ type: 'last-7-days' });
  const [issued, setIssued] = useState<DateRangeValue | undefined>();
  return (
    <div className="flex flex-col gap-6">
      <Field label="Permits submitted">
        <DateRangePicker value={range} onValueChange={setRange} aria-label="Permits submitted" />
      </Field>
      <Field label="Licences issued">
        <DateRangePicker value={issued} onValueChange={setIssued} aria-label="Licences issued" placeholder="Any time" />
      </Field>
    </div>
  );
}

function SegmentedControlDemo() {
  const [view, setView] = useState('list');
  const [period, setPeriod] = useState('month');
  return (
    <div className="flex flex-col gap-6">
      <SegmentedControl aria-label="Inspections view" value={view} onValueChange={setView}>
        <SegmentedControlItem value="list">
          <List /> List
        </SegmentedControlItem>
        <SegmentedControlItem value="calendar">
          <CalendarDays /> Calendar
        </SegmentedControlItem>
        <SegmentedControlItem value="map">
          <MapIcon /> Map
        </SegmentedControlItem>
      </SegmentedControl>
      <SegmentedControl aria-label="Reporting period" value={period} onValueChange={setPeriod} size="sm" fitContent>
        <SegmentedControlItem value="week">Week</SegmentedControlItem>
        <SegmentedControlItem value="month">Month</SegmentedControlItem>
        <SegmentedControlItem value="quarter">Quarter</SegmentedControlItem>
        <SegmentedControlItem value="year" disabled>
          Year
        </SegmentedControlItem>
      </SegmentedControl>
      <SegmentedControl aria-label="Decision" defaultValue="approve" fitContent>
        <SegmentedControlItem value="approve" highlighted>
          Approve
        </SegmentedControlItem>
        <SegmentedControlItem value="conditions">With conditions</SegmentedControlItem>
        <SegmentedControlItem value="deny">Deny</SegmentedControlItem>
      </SegmentedControl>
    </div>
  );
}

function ToolbarDemo() {
  const [align, setAlign] = useState<string[]>(['left']);
  return (
    <div className="flex flex-col gap-6">
      <Toolbar aria-label="Permit actions">
        <ToolbarGroup>
          <ToolbarButton size="sm">
            <ClipboardCheck data-icon="inline-start" /> Schedule inspection
          </ToolbarButton>
          <ToolbarButton tooltip="Print permit card">
            <Printer />
          </ToolbarButton>
          <ToolbarButton tooltip="Share with applicant">
            <Share2 />
          </ToolbarButton>
        </ToolbarGroup>
        <ToolbarSeparator />
        <ToolbarToggle tooltip="Show as table" size="icon">
          <Table2 />
        </ToolbarToggle>
        <ToolbarSeparator />
        <ToolbarLink href="#fees">View fee schedule</ToolbarLink>
      </Toolbar>
      <Toolbar aria-label="Notice layout" variant="floating">
        <ToolbarToggleGroup value={align} onValueChange={(v) => v.length && setAlign(v)} aria-label="Alignment">
          <ToolbarToggle value="left" tooltip="Align left">
            <AlignLeft />
          </ToolbarToggle>
          <ToolbarToggle value="center" tooltip="Align centre">
            <AlignCenter />
          </ToolbarToggle>
          <ToolbarToggle value="right" tooltip="Align right">
            <AlignRight />
          </ToolbarToggle>
        </ToolbarToggleGroup>
      </Toolbar>
    </div>
  );
}

function ColorPickerDemo() {
  const [status, setStatus] = useState('#41aaeb');
  const [label, setLabel] = useState('#feaf0e');
  return (
    <div className="flex flex-col gap-6">
      <Field label="Colour for “Under review” on the dashboard">
        <ColorPicker value={status} onValueChange={setStatus} aria-label="Under review colour" />
      </Field>
      <div className="flex items-center gap-3">
        <ColorPicker value={label} onValueChange={setLabel} showValue={false} size="sm" aria-label="Zoning layer colour" />
        <span className="text-sm">Zoning layer on the parcel map</span>
      </div>
    </div>
  );
}

function FileUploadDemo() {
  const [files, setFiles] = useState<FileUploadFile[]>([
    { uid: 'site-plan', name: 'site-plan-412-maple.pdf', size: 2_400_000, status: 'done', url: '#site-plan' },
    { uid: 'survey', name: 'boundary-survey.pdf', size: 5_100_000, status: 'uploading', percent: 64 },
    {
      uid: 'photo',
      name: 'front-elevation.heic',
      size: 3_800_000,
      status: 'error',
      error: 'HEIC photos aren’t accepted. Export it as JPG.',
    },
  ]);
  const [rejected, setRejected] = useState<string | null>(null);
  return (
    <div className="flex max-w-xl flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Label>Plans and supporting documents</Label>
        <FileUpload
          multiple
          accept=".pdf,.png,.jpg"
          maxSize={25 * 1024 * 1024}
          maxCount={10}
          files={files}
          onFilesChange={setFiles}
          onReject={(r) =>
            setRejected(
              r
                .map(
                  ({ file, reason }) => `${file.name} (${reason === 'size' ? 'too big' : reason === 'accept' ? 'wrong type' : 'too many'})`,
                )
                .join(', '),
            )
          }
        />
        {rejected && <p className="text-sm text-error">Not added: {rejected}</p>}
      </div>
      <div className="flex flex-col gap-2">
        <Label>Photos of the violation</Label>
        <FileUpload multiple accept="image/*" listType="picture-card" label="Drop photos here or browse" />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Contractor licence</Label>
        <FileUpload variant="button" accept=".pdf" label="Upload licence" />
      </div>
    </div>
  );
}

const NOTICE = `<h2>Notice of violation</h2><p>An inspection on <strong>October 14</strong> found the following at 412 Maple Street:</p><ul><li><p>Tall grass and weeds over 10 inches</p></li><li><p>An inoperable vehicle in the driveway</p></li></ul><p>Please correct these within <em>14 days</em>. Questions? See the <a href="https://example.gov/code">property maintenance code</a>.</p>`;

function RichTextEditorDemo() {
  const [notice, setNotice] = useState(NOTICE);
  const [email, setEmail] = useState('');
  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Label>Notice text</Label>
        <RichTextEditor aria-label="Notice text" value={notice} onChange={setNotice} />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Approval email</Label>
        <RichTextEditor
          aria-label="Approval email"
          value={email}
          onChange={setEmail}
          placeholder="Write the message the applicant receives…"
          mergeFields={[
            { value: 'applicant_name', label: 'Applicant name' },
            { value: 'permit_number', label: 'Permit number' },
            { value: 'site_address', label: 'Site address' },
            { value: 'inspector_name', label: 'Inspector' },
          ]}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Condition of approval (read-only)</Label>
        <RichTextEditor
          aria-label="Condition of approval"
          value="<p>Final inspection required <strong>before occupancy</strong>.</p>"
          readOnly
        />
      </div>
    </div>
  );
}

export const INPUTS_DEMOS: Record<string, () => ReactNode> = {
  'number-input': NumberInputDemo,
  'time-input': TimeInputDemo,
  'date-range-picker': DateRangePickerDemo,
  'segmented-control': SegmentedControlDemo,
  toolbar: ToolbarDemo,
  'color-picker': ColorPickerDemo,
  'file-upload': FileUploadDemo,
  'rich-text-editor': RichTextEditorDemo,
};
