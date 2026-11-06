import { useState, type ReactNode } from 'react';
import { BellRing, CalendarDays, Hammer, Mail, MessageSquareText, Plus, Search, Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from '@/components/ui/button-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOptGroup, NativeSelectOption } from '@/components/ui/native-select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Toggle } from '@/components/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

// Demos for the form controls, keyed by registry item name.

function CheckboxDemo() {
  return (
    <div className="flex flex-col gap-4">
      <Label>
        <Checkbox defaultChecked />
        Site plan attached
      </Label>
      <Label>
        <Checkbox />
        Contractor licence number on file
      </Label>
      <Label>
        <Checkbox aria-invalid />I confirm the information in this application is accurate
      </Label>
      <Label>
        <Checkbox disabled />
        Expedited review (not offered for this permit type)
      </Label>
    </div>
  );
}

function RadioGroupDemo() {
  return (
    <RadioGroup defaultValue="card" aria-label="Payment method" className="max-w-xs">
      <Label>
        <RadioGroupItem value="card" />
        Credit or debit card, 2.9% fee
      </Label>
      <Label>
        <RadioGroupItem value="ach" />
        Bank transfer (ACH), $1.50
      </Label>
      <Label>
        <RadioGroupItem value="counter" />
        Pay in person at City Hall
      </Label>
      <Label>
        <RadioGroupItem value="escrow" disabled />
        Escrow account (contractors only)
      </Label>
    </RadioGroup>
  );
}

function SwitchDemo() {
  return (
    <div className="flex flex-col gap-4">
      <Label>
        <Switch defaultChecked />
        Email me when my application status changes
      </Label>
      <Label>
        <Switch />
        Inspection reminders the day before
      </Label>
      <Label>
        <Switch size="sm" defaultChecked />
        Weekly fee summary
      </Label>
      <Label>
        <Switch disabled />
        Text messages (no phone number on file)
      </Label>
    </div>
  );
}

function SliderDemo() {
  const [radius, setRadius] = useState(300);
  return (
    <div className="flex max-w-sm flex-col gap-8">
      <div className="flex flex-col gap-3">
        <div className="flex justify-between text-sm">
          <span id="radius-label" className="font-normal">
            Notify neighbours within
          </span>
          <span className="text-muted-foreground tabular-nums">{radius} ft</span>
        </div>
        <Slider
          aria-labelledby="radius-label"
          value={radius}
          onValueChange={(v) => setRadius(v as number)}
          min={100}
          max={1000}
          step={50}
        />
      </div>
      <div className="flex flex-col gap-3">
        <span className="text-sm font-normal">Inspection window</span>
        <Slider defaultValue={[9, 13]} min={7} max={17} getAriaLabel={(i) => (i === 0 ? 'Earliest hour' : 'Latest hour')} />
      </div>
    </div>
  );
}

function ToggleDemo() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Toggle aria-label="Follow this application" defaultPressed>
        <BellRing />
      </Toggle>
      <Toggle variant="outline">
        <CalendarDays data-icon="inline-start" />
        Scheduled only
      </Toggle>
      <Toggle size="sm">Overdue</Toggle>
      <Toggle disabled>Archived</Toggle>
    </div>
  );
}

function ToggleGroupDemo() {
  return (
    <div className="flex flex-col items-start gap-4">
      <ToggleGroup multiple defaultValue={['building', 'electrical']} aria-label="Permit types">
        <ToggleGroupItem value="building">
          <Hammer data-icon="inline-start" />
          Building
        </ToggleGroupItem>
        <ToggleGroupItem value="electrical">
          <Zap data-icon="inline-start" />
          Electrical
        </ToggleGroupItem>
        <ToggleGroupItem value="zoning">
          <Search data-icon="inline-start" />
          Zoning
        </ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup variant="outline" spacing={0} defaultValue={['week']} aria-label="Period">
        <ToggleGroupItem value="day">Day</ToggleGroupItem>
        <ToggleGroupItem value="week">Week</ToggleGroupItem>
        <ToggleGroupItem value="month">Month</ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}

function TextareaDemo() {
  return (
    <div className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="textarea-request">Describe the issue</Label>
        <Textarea id="textarea-request" placeholder="Pothole, streetlight out, missed pickup… include the address" />
      </div>
      <Textarea aria-label="Inspector notes" disabled defaultValue="Comments are closed: this request was resolved on 3 November." />
    </div>
  );
}

function NativeSelectDemo() {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="native-select-zone">Zoning district</Label>
        <NativeSelect id="native-select-zone" defaultValue="r-2">
          <NativeSelectOption value="r-1">R-1 Single-family</NativeSelectOption>
          <NativeSelectOption value="r-2">R-2 Two-family</NativeSelectOption>
          <NativeSelectOption value="c-1">C-1 Neighbourhood commercial</NativeSelectOption>
          <NativeSelectOption value="i-1">I-1 Light industrial</NativeSelectOption>
        </NativeSelect>
      </div>
      <NativeSelect size="sm" aria-label="Licence type" defaultValue="food">
        <NativeSelectOptGroup label="Business">
          <NativeSelectOption value="general">General business licence</NativeSelectOption>
          <NativeSelectOption value="food">Food service</NativeSelectOption>
        </NativeSelectOptGroup>
        <NativeSelectOptGroup label="Trade">
          <NativeSelectOption value="contractor">Contractor registration</NativeSelectOption>
          <NativeSelectOption value="plumber">Plumbing</NativeSelectOption>
        </NativeSelectOptGroup>
      </NativeSelect>
    </div>
  );
}

const INSPECTIONS = [
  { value: 'footing', label: 'Footing' },
  { value: 'framing', label: 'Framing' },
  { value: 'rough-electrical', label: 'Rough electrical' },
  { value: 'insulation', label: 'Insulation' },
  { value: 'final', label: 'Final' },
];

function SelectDemo() {
  return (
    <div className="flex flex-wrap items-start gap-4">
      <Select items={INSPECTIONS} defaultValue="framing">
        <SelectTrigger className="w-64" aria-label="Inspection">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Residential inspections</SelectLabel>
            {INSPECTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Select>
        <SelectTrigger size="sm" aria-label="Status">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="submitted">Submitted</SelectItem>
          <SelectItem value="in-review">In review</SelectItem>
          <SelectItem value="approved">Approved</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function InputOTPDemo() {
  return (
    <div className="flex flex-col gap-2">
      <Label id="otp-label">Verification code from your email</Label>
      <InputOTP length={6} aria-labelledby="otp-label">
        <InputOTPGroup>
          <InputOTPSlot />
          <InputOTPSlot />
          <InputOTPSlot />
        </InputOTPGroup>
        <InputOTPSeparator />
        <InputOTPGroup>
          <InputOTPSlot />
          <InputOTPSlot />
          <InputOTPSlot />
        </InputOTPGroup>
      </InputOTP>
    </div>
  );
}

function ButtonGroupDemo() {
  return (
    <div className="flex flex-col items-start gap-4">
      <ButtonGroup aria-label="Contact applicant">
        <Button variant="outline">
          <Mail data-icon="inline-start" />
          Email
        </Button>
        <Button variant="outline">
          <MessageSquareText data-icon="inline-start" />
          Comment
        </Button>
        <Button variant="outline">Reassign</Button>
      </ButtonGroup>
      <ButtonGroup aria-label="Find a permit">
        <Input aria-label="Permit number" placeholder="BLD-2026-0412" className="w-56" />
        <Button variant="secondary" size="icon" aria-label="Search">
          <Search />
        </Button>
      </ButtonGroup>
      <ButtonGroup aria-label="Add a fee">
        <ButtonGroupText>$</ButtonGroupText>
        <Input aria-label="Amount" defaultValue="125.00" className="w-32" />
        <ButtonGroupSeparator />
        <Button>
          <Plus data-icon="inline-start" />
          Add fee
        </Button>
      </ButtonGroup>
    </div>
  );
}

export const FORMS_DEMOS: Record<string, () => ReactNode> = {
  checkbox: CheckboxDemo,
  'radio-group': RadioGroupDemo,
  switch: SwitchDemo,
  slider: SliderDemo,
  toggle: ToggleDemo,
  'toggle-group': ToggleGroupDemo,
  textarea: TextareaDemo,
  'native-select': NativeSelectDemo,
  select: SelectDemo,
  'input-otp': InputOTPDemo,
  'button-group': ButtonGroupDemo,
};
