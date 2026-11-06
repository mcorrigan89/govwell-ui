import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Item, ItemContent, ItemTitle } from '@/components/ui/item';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from '@/components/ui/pagination';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Kbd } from '@/components/ui/kbd';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// jsdom has no ResizeObserver; the navigation menu measures its popup with one
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('Accordion', () => {
  it('opens a section and closes it again', async () => {
    render(
      <Accordion>
        <AccordionItem value="fence">
          <AccordionTrigger>Do I need a permit for a fence?</AccordionTrigger>
          <AccordionContent>Fences over six feet need a permit.</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    const trigger = screen.getByRole('button', { name: 'Do I need a permit for a fence?' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Fences over six feet need a permit.')).toBeVisible();
    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('Collapsible', () => {
  it('shows and hides its panel', async () => {
    render(
      <Collapsible>
        <CollapsibleTrigger>Plan review comments</CollapsibleTrigger>
        <CollapsibleContent>Add the setback distance</CollapsibleContent>
      </Collapsible>,
    );
    const trigger = screen.getByRole('button', { name: 'Plan review comments' });
    expect(screen.queryByText('Add the setback distance')).not.toBeInTheDocument();
    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Add the setback distance')).toBeVisible();
    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('Breadcrumb and Pagination', () => {
  it('mark where you are', () => {
    render(
      <>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#departments">Departments</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Zoning permits</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationLink href="#1">1</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#2" isActive>
                2
              </PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </>,
    );
    const trail = screen.getByRole('navigation', { name: 'breadcrumb' });
    expect(within(trail).getByRole('link', { name: 'Departments' })).toHaveAttribute('href', '#departments');
    expect(within(trail).getByText('Zoning permits')).toHaveAttribute('aria-current', 'page');
    // the separator chevron is decoration
    expect(within(trail).queryByRole('img')).not.toBeInTheDocument();
    const pages = screen.getByRole('navigation', { name: 'pagination' });
    expect(within(pages).getByRole('link', { name: '2' })).toHaveAttribute('aria-current', 'page');
    expect(within(pages).getByRole('link', { name: '1' })).not.toHaveAttribute('aria-current');
  });
});

describe('NavigationMenu', () => {
  it('opens a panel of links from its trigger', async () => {
    render(
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Permits</NavigationMenuTrigger>
            <NavigationMenuContent>
              <NavigationMenuLink href="#building">Building permits</NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>,
    );
    const trigger = screen.getByRole('button', { name: 'Permits' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('link', { name: 'Building permits' })).not.toBeInTheDocument();
    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(await screen.findByRole('link', { name: 'Building permits' })).toHaveAttribute('href', '#building');
  });
});

describe('Avatar, Item, Spinner and AspectRatio', () => {
  it('Avatar shows the initials when there is no image', () => {
    render(
      <Avatar>
        <AvatarFallback>MT</AvatarFallback>
      </Avatar>,
    );
    expect(screen.getByText('MT')).toBeInTheDocument();
  });

  it('Item can be a real link', () => {
    render(
      // the link's text comes from the Item's children
      // oxlint-disable-next-line jsx-a11y/control-has-associated-label
      <Item render={<a href="#planning" />}>
        <ItemContent>
          <ItemTitle>Planning & Zoning</ItemTitle>
        </ItemContent>
      </Item>,
    );
    expect(screen.getByRole('link', { name: 'Planning & Zoning' })).toHaveAttribute('href', '#planning');
  });

  it('Spinner announces that something is loading', () => {
    render(<Spinner />);
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('AspectRatio holds its shape', () => {
    const { container } = render(<AspectRatio ratio={16 / 9} />);
    expect((container.firstChild as HTMLElement).style.getPropertyValue('--ratio')).toBe(String(16 / 9));
  });
});

function Example() {
  return (
    <Tabs defaultValue="open">
      <TabsList>
        <TabsTrigger value="open">Open</TabsTrigger>
        <TabsTrigger value="issued">Issued</TabsTrigger>
      </TabsList>
      <TabsContent value="open">12 waiting</TabsContent>
      <TabsContent value="issued">31 issued</TabsContent>
    </Tabs>
  );
}

describe('Tabs', () => {
  it('shows the chosen panel and switches on click', async () => {
    render(<Example />);
    expect(screen.getByRole('tab', { name: 'Open' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('12 waiting');
    await userEvent.click(screen.getByRole('tab', { name: 'Issued' }));
    expect(screen.getByRole('tab', { name: 'Issued' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('31 issued');
  });

  it('moves between tabs with the arrow keys', async () => {
    render(<Example />);
    await userEvent.tab();
    expect(screen.getByRole('tab', { name: 'Open' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Issued' })).toHaveFocus();
  });
});

describe('Pagination, Kbd, Skeleton and Empty', () => {
  it('marks the current page with a Slate block', () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationLink href="#3" isActive>
              3
            </PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>,
    );
    expect(screen.getByRole('link', { name: '3' })).toHaveClass('bg-secondary');
  });

  it('Kbd is a key in mono type', () => {
    render(<Kbd>Esc</Kbd>);
    expect(screen.getByText('Esc').tagName).toBe('KBD');
    expect(screen.getByText('Esc')).toHaveClass('font-mono');
  });

  it('Skeleton is hidden from assistive tech', () => {
    const { container } = render(<Skeleton className="h-4" />);
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('Empty frames its icon in the node frame', () => {
    render(
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <svg data-testid="icon" />
          </EmptyMedia>
          <EmptyTitle>No applications yet</EmptyTitle>
        </EmptyHeader>
      </Empty>,
    );
    expect(screen.getByText('No applications yet')).toBeInTheDocument();
    expect(screen.getByTestId('icon').closest('[data-slot=node-frame]')).not.toBeNull();
  });
});
