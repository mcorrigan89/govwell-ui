import { useState, type MouseEvent, type ReactNode } from 'react';
import { Building2, ChevronDown, ClipboardCheck, FileSearch, FileText, Hammer, Landmark, Map as MapIcon, Receipt } from 'lucide-react';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount } from '@/components/ui/avatar';
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@/components/ui/item';
import { Kbd, KbdGroup } from '@/components/ui/kbd';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function BreadcrumbDemo() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#breadcrumb">Departments</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbEllipsis />
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="#breadcrumb">Planning &amp; Zoning</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Accessory dwelling unit permit</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function PaginationDemo() {
  const [page, setPage] = useState(2);
  const go = (n: number) => (e: MouseEvent) => {
    e.preventDefault();
    setPage(Math.min(Math.max(n, 1), 12));
  };
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="#pagination" onClick={go(page - 1)} />
        </PaginationItem>
        {[1, 2, 3].map((n) => (
          <PaginationItem key={n}>
            <PaginationLink href="#pagination" isActive={page === n} onClick={go(n)}>
              {n}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#pagination" isActive={page === 12} onClick={go(12)}>
            12
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="#pagination" onClick={go(page + 1)} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

function NavigationMenuDemo() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Permits</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-72 gap-1">
              <li>
                <NavigationMenuLink href="#navigation-menu" active>
                  <Hammer />
                  Building permits
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink href="#navigation-menu">
                  <MapIcon />
                  Zoning and land use
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink href="#navigation-menu">
                  <ClipboardCheck />
                  Schedule an inspection
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Licenses</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-64 gap-1">
              <li>
                <NavigationMenuLink href="#navigation-menu">
                  <Building2 />
                  Business license
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink href="#navigation-menu">Short-term rental</NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink href="#navigation-menu">Contractor registration</NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="#navigation-menu" className={navigationMenuTriggerStyle()}>
            Pay a fee
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

function AccordionDemo() {
  return (
    <Accordion defaultValue={['need-permit']} className="max-w-lg">
      <AccordionItem value="need-permit">
        <AccordionTrigger>Do I need a permit for a fence?</AccordionTrigger>
        <AccordionContent>
          <p>Fences over six feet tall, and any fence in a front yard, need a building permit.</p>
          <p>
            Check the <a href="#accordion">residential fence guidelines</a> before you apply.
          </p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="how-long">
        <AccordionTrigger>How long does review take?</AccordionTrigger>
        <AccordionContent>Most residential permits are reviewed within ten business days of a complete application.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="pay">
        <AccordionTrigger>How do I pay my fees?</AccordionTrigger>
        <AccordionContent>
          Pay online by card or bank transfer once your application is approved, or in person at City Hall.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function CollapsibleDemo() {
  return (
    <Collapsible className="flex max-w-sm flex-col gap-2">
      <div className="flex items-center justify-between gap-4">
        <span className="flex items-center gap-2 text-sm">
          <Badge variant="sky">Review</Badge>3 comments from plan review
        </span>
        <CollapsibleTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Show comments" />}>
          <ChevronDown />
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent>
        <ul className="flex flex-col gap-1 border-l-2 border-primary pl-3 text-sm">
          <li>Add the setback distance to the site plan</li>
          <li>Upload the stamped structural drawings</li>
          <li>Confirm the contractor's license number</li>
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}

function KbdDemo() {
  return (
    <div className="flex flex-col gap-3 text-sm">
      <p className="flex items-center gap-2">
        Search records
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </p>
      <p className="flex items-center gap-2">
        Close the panel <Kbd>Esc</Kbd>
      </p>
    </div>
  );
}

function SkeletonDemo() {
  return (
    <div className="flex max-w-sm items-center gap-3">
      <Skeleton className="size-10 rounded-full" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

function SpinnerDemo() {
  return (
    <div className="flex flex-wrap items-center gap-6">
      <Spinner />
      <Spinner className="size-8" />
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner />
        Checking parcel records…
      </span>
      <Button disabled>
        <Spinner data-icon="inline-start" />
        Submitting application
      </Button>
    </div>
  );
}

function EmptyDemo() {
  return (
    <Empty className="max-w-lg">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FileSearch />
        </EmptyMedia>
        <EmptyTitle>No applications yet</EmptyTitle>
        <EmptyDescription>Start an application and you can track its review, inspections and fees here.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button>Start an application</Button>
      </EmptyContent>
    </Empty>
  );
}

function ItemDemo() {
  return (
    <ItemGroup className="max-w-md">
      <Item variant="outline">
        <ItemMedia variant="icon">
          <FileText />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>BLD-2026-0412</ItemTitle>
          <ItemDescription>Residential addition, 118 Maple Ave. In plan review.</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button size="sm" variant="outline">
            Open
          </Button>
        </ItemActions>
      </Item>
      {/* the link's text comes from the Item's children */}
      {/* oxlint-disable-next-line jsx-a11y/control-has-associated-label */}
      <Item render={<a href="#item" />}>
        <ItemMedia variant="icon">
          <Landmark />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Planning &amp; Zoning</ItemTitle>
          <ItemDescription>Land use, variances and site plan review.</ItemDescription>
        </ItemContent>
      </Item>
      <Item variant="muted" size="sm">
        <ItemMedia>
          <Receipt className="size-4" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Permit fee due</ItemTitle>
        </ItemContent>
        <ItemActions className="text-sm tabular-nums">$245.00</ItemActions>
      </Item>
    </ItemGroup>
  );
}

function AvatarDemo() {
  return (
    <div className="flex flex-wrap items-center gap-6">
      <Avatar size="sm">
        <AvatarFallback>JR</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>SA</AvatarFallback>
      </Avatar>
      <Avatar size="lg">
        <AvatarFallback>MT</AvatarFallback>
        <AvatarBadge className="bg-ok" />
      </Avatar>
      <AvatarGroup>
        <Avatar>
          <AvatarFallback>AL</AvatarFallback>
        </Avatar>
        <Avatar className="bg-hope-tint text-tint-foreground">
          <AvatarFallback>KB</AvatarFallback>
        </Avatar>
        <Avatar className="bg-sky-tint text-tint-foreground">
          <AvatarFallback>RC</AvatarFallback>
        </Avatar>
        <AvatarGroupCount>+4</AvatarGroupCount>
      </AvatarGroup>
    </div>
  );
}

function AspectRatioDemo() {
  return (
    <div className="w-full max-w-sm">
      <AspectRatio ratio={16 / 9} className="base-grid flex items-end border border-border bg-muted p-3">
        <span className="bg-background px-2 py-1 text-sm">Site photo, 118 Maple Ave</span>
      </AspectRatio>
    </div>
  );
}

function TabsDemo() {
  return (
    <div className="flex flex-col gap-10">
      <Tabs defaultValue="open">
        <TabsList>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="review">In review</TabsTrigger>
          <TabsTrigger value="issued">Issued</TabsTrigger>
          <TabsTrigger value="archived" disabled>
            Archived
          </TabsTrigger>
        </TabsList>
        <TabsContent value="open">12 applications waiting for documents.</TabsContent>
        <TabsContent value="review">8 applications with plan reviewers.</TabsContent>
        <TabsContent value="issued">31 permits issued this month.</TabsContent>
      </Tabs>
      <Tabs defaultValue="details">
        <TabsList variant="line">
          <TabsTrigger value="details">
            <FileText />
            Details
          </TabsTrigger>
          <TabsTrigger value="inspections">
            <ClipboardCheck />
            Inspections
          </TabsTrigger>
        </TabsList>
        <TabsContent value="details">Residential addition, 420 sq ft, at 118 Maple Ave.</TabsContent>
        <TabsContent value="inspections">Footing inspection passed on 3 November. Framing is next.</TabsContent>
      </Tabs>
      <Tabs defaultValue="weekday" orientation="vertical" className="flex-row">
        <TabsList variant="line">
          <TabsTrigger value="weekday">Weekdays</TabsTrigger>
          <TabsTrigger value="saturday">Saturday</TabsTrigger>
          <TabsTrigger value="sunday">Sunday</TabsTrigger>
        </TabsList>
        <TabsContent value="weekday">The permit counter is open 8 am to 4:30 pm.</TabsContent>
        <TabsContent value="saturday">Inspections by appointment only.</TabsContent>
        <TabsContent value="sunday">Closed. Apply online any time.</TabsContent>
      </Tabs>
    </div>
  );
}

export const DISPLAY_DEMOS: Record<string, () => ReactNode> = {
  breadcrumb: BreadcrumbDemo,
  pagination: PaginationDemo,
  'navigation-menu': NavigationMenuDemo,
  accordion: AccordionDemo,
  collapsible: CollapsibleDemo,
  kbd: KbdDemo,
  skeleton: SkeletonDemo,
  spinner: SpinnerDemo,
  empty: EmptyDemo,
  item: ItemDemo,
  avatar: AvatarDemo,
  'aspect-ratio': AspectRatioDemo,
  tabs: TabsDemo,
};
