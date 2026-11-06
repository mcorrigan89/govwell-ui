import type { ReactNode } from 'react';
import { ArrowRight, ArrowUpRight, ClipboardCheck, FileText, Quote, Search, Settings, ShieldCheck, Workflow } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field';
import { FlagMark, GovWellLogo } from '@/components/ui/flag-mark';
import { GridPanel } from '@/components/ui/grid-panel';
import { Input } from '@/components/ui/input';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupText } from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';
import { NodeFrame } from '@/components/ui/node-frame';
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Stat, StatLabel, StatValue } from '@/components/ui/stat';

function ButtonDemo() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button>Request a demo</Button>
        <Button variant="secondary">Get Demo</Button>
        <Button variant="outline">Explore product</Button>
        <Button variant="ghost">Check our demo</Button>
        <Button variant="destructive">Withdraw application</Button>
        <Button variant="link">
          Read case study
          <ArrowUpRight data-icon="inline-end" />
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button size="xs">Extra small</Button>
        <Button size="sm">Small</Button>
        <Button>Default</Button>
        <Button size="lg">
          Start application
          <ArrowRight data-icon="inline-end" />
        </Button>
        <Button size="icon" variant="outline" aria-label="Search">
          <Search />
        </Button>
        <Button disabled>Disabled</Button>
      </div>
    </div>
  );
}

function EyebrowDemo() {
  return (
    <div className="flex flex-wrap items-start gap-10">
      <Eyebrow icon={<Workflow />}>Work smarter</Eyebrow>
      <Eyebrow tone="field" icon={<ClipboardCheck />}>
        Restore trust
      </Eyebrow>
      <Eyebrow tone="sky" icon={<FileText />}>
        Key features
      </Eyebrow>
      <Eyebrow tone="ash" icon={<Settings />}>
        Settings
      </Eyebrow>
      <Eyebrow>Now on GovWell</Eyebrow>
    </div>
  );
}

function FlagMarkDemo() {
  return (
    <div className="flex flex-wrap items-center gap-10">
      <GovWellLogo title="GovWell" className="h-8" />
      <FlagMark title="GovWell" className="h-8" />
      <div className="flex items-center gap-4 bg-slate p-6 text-white">
        <GovWellLogo title="GovWell" className="h-6" />
      </div>
      <div className="bg-hope p-6 text-slate">
        <FlagMark className="h-6" />
      </div>
    </div>
  );
}

function NodeFrameDemo() {
  return (
    <div className="flex flex-wrap items-center gap-12">
      <NodeFrame>
        <ShieldCheck className="size-16 stroke-1" />
      </NodeFrame>
      <NodeFrame className="p-6">
        <div className="flex max-w-56 flex-col gap-1">
          <p className="text-lg">AutoCheck</p>
          <p className="text-sm text-muted-foreground">Catches submission errors before a reviewer opens the file.</p>
        </div>
      </NodeFrame>
    </div>
  );
}

function StatDemo() {
  return (
    <div className="flex flex-wrap gap-16">
      <Stat>
        <StatValue>7000+</StatValue>
        <StatLabel>Permits and licences processed every week</StatLabel>
      </Stat>
      <Stat>
        <StatValue>200+</StatValue>
        <StatLabel>Communities on GovWell</StatLabel>
      </Stat>
      <Stat>
        <StatValue>98%</StatValue>
        <StatLabel>Customer satisfaction</StatLabel>
      </Stat>
    </div>
  );
}

function GridPanelDemo() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <GridPanel tone="sky" eyebrow="Now on GovWell" title="Twinsburg, OH" media={<div className="bg-field-tint" />} />
      <GridPanel tone="hope" eyebrow="Now on GovWell" title="Carpinteria, CA" media={<div className="bg-sky-tint" />} />
    </div>
  );
}

function CardDemo() {
  return (
    <div className="grid max-w-4xl gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <Eyebrow tone="field" icon={<ClipboardCheck />}>
            Permit
          </Eyebrow>
          <CardTitle>Residential deck addition</CardTitle>
          <CardDescription>1428 Elm Street · Submitted March 3</CardDescription>
        </CardHeader>
        <CardContent>Plan review is complete. One inspection is left before the permit can be finalised.</CardContent>
        <CardFooter>
          <Button size="sm">Schedule inspection</Button>
          <Button size="sm" variant="ghost">
            View file
          </Button>
        </CardFooter>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Business licence renewal</CardTitle>
          <CardDescription>Due April 30</CardDescription>
          <CardAction>
            <Badge>Due soon</Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          Renew online in about five minutes. Your details carry over from last year.
        </CardContent>
      </Card>
    </div>
  );
}

function BadgeDemo() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge>Case study</Badge>
        <Badge variant="sky">Insights</Badge>
        <Badge variant="field">Guides</Badge>
        <Badge variant="ash">20,903 population</Badge>
        <Badge variant="outline">Draft</Badge>
        <Badge variant="solid">New</Badge>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="ok">Approved</Badge>
        <Badge variant="info">In review</Badge>
        <Badge variant="warning">Needs info</Badge>
        <Badge variant="destructive">Denied</Badge>
      </div>
    </div>
  );
}

function InputDemo() {
  return (
    <div className="flex max-w-sm flex-col gap-3">
      <Input placeholder="Enter your work email" aria-label="Work email" />
      <Input defaultValue="Twinsburg, OH" aria-label="Community" />
      <Input disabled placeholder="Disabled" aria-label="Disabled" />
    </div>
  );
}

function LabelDemo() {
  return (
    <div className="flex max-w-sm flex-col gap-2">
      <Label htmlFor="label-demo">Parcel number</Label>
      <Input id="label-demo" placeholder="15-024-0031" />
    </div>
  );
}

function FieldDemo() {
  return (
    <form className="max-w-md" onSubmit={(e) => e.preventDefault()}>
      <FieldSet>
        <FieldLegend>Apply for a permit</FieldLegend>
        <FieldDescription>It takes about ten minutes. You can save and come back.</FieldDescription>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="permit-address">Project address</FieldLabel>
            <Input id="permit-address" placeholder="Street address" />
          </Field>
          <Field data-invalid>
            <FieldLabel htmlFor="permit-email">Email</FieldLabel>
            <Input id="permit-email" defaultValue="pat@" aria-invalid aria-describedby="permit-email-error" />
            <FieldError id="permit-email-error" errors={['Enter an email address like name@example.com.']} />
          </Field>
          <Field orientation="horizontal">
            <Button type="submit">Continue</Button>
            <Button type="button" variant="ghost">
              Save for later
            </Button>
          </Field>
        </FieldGroup>
      </FieldSet>
    </form>
  );
}

function InputGroupDemo() {
  return (
    <div className="flex max-w-md flex-col gap-3">
      <InputGroup>
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        <InputGroupInput placeholder="Ask about permits, licences and more" aria-label="Ask a question" />
      </InputGroup>
      <InputGroup>
        <InputGroupAddon>
          <InputGroupText>$</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput defaultValue="125.00" aria-label="Amount" />
        <InputGroupAddon align="inline-end">
          <InputGroupButton variant="default">Pay fee</InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}

function SeparatorDemo() {
  return (
    <div className="flex max-w-sm flex-col gap-4">
      <div>
        <p className="text-lg">Building and Codes</p>
        <p className="text-sm text-muted-foreground">Permits, plan review and inspections</p>
      </div>
      <Separator />
      <div className="flex h-5 items-center gap-4 text-sm">
        <span>Permitting</span>
        <Separator orientation="vertical" />
        <span>Licensing</span>
        <Separator orientation="vertical" />
        <span>Code enforcement</span>
      </div>
    </div>
  );
}

function PopoverDemo() {
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" />}>Inspection window</PopoverTrigger>
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>Thursday, 8 am to noon</PopoverTitle>
          <PopoverDescription>The inspector will text you 30 minutes before arriving.</PopoverDescription>
        </PopoverHeader>
        <Button size="sm" variant="outline">
          Reschedule
        </Button>
      </PopoverContent>
    </Popover>
  );
}

function DialogDemo() {
  return (
    <Dialog>
      <DialogTrigger render={<Button />}>Watch the spotlight</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <Eyebrow icon={<Quote />}>New video</Eyebrow>
          <DialogTitle>Watch our new community spotlight</DialogTitle>
          <DialogDescription>See how Perinton, New York is improving public service with the AI Community Assistant.</DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-start">
          <DialogClose render={<Button />}>Learn more</DialogClose>
          <DialogClose render={<Button variant="ghost" />}>No thanks</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const BASE_DEMOS: Record<string, () => ReactNode> = {
  badge: BadgeDemo,
  button: ButtonDemo,
  card: CardDemo,
  dialog: DialogDemo,
  eyebrow: EyebrowDemo,
  field: FieldDemo,
  'flag-mark': FlagMarkDemo,
  'grid-panel': GridPanelDemo,
  input: InputDemo,
  'input-group': InputGroupDemo,
  label: LabelDemo,
  'node-frame': NodeFrameDemo,
  popover: PopoverDemo,
  separator: SeparatorDemo,
  stat: StatDemo,
};
