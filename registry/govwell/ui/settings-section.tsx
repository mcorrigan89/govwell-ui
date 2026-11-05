import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

// One titled section of a settings page (the organization's fees, a
// record type's numbering, your password). Where there's room it's two
// columns: the title and a line of explanation on the left, the form on the
// right in a square Ash-hairline panel; where there isn't (a phone, a narrow
// pane) they stack. The width it reacts to is the section's own (a container
// query), not the window's, so it behaves the same inside a sheet or beside a
// sidebar. The panel's footer holds Save and Cancel on the right and a
// status ("Saved", "Unsaved changes") on the left.
//
// The `destructive` variant is the danger zone: a red edge and red title for
// what can't be undone (deleting a record type, leaving the organization).
//
//   <SettingsSection>
//     <SettingsSectionHeader>
//       <SettingsSectionTitle>Late fees</SettingsSectionTitle>
//       <SettingsSectionDescription>Added to unpaid invoices after the due date.</SettingsSectionDescription>
//     </SettingsSectionHeader>
//     <SettingsSectionPanel>
//       <SettingsSectionContent>…fields…</SettingsSectionContent>
//       <SettingsSectionFooter>
//         <SettingsSectionStatus>Unsaved changes</SettingsSectionStatus>
//         <Button variant="outline">Cancel</Button>
//         <Button>Save</Button>
//       </SettingsSectionFooter>
//     </SettingsSectionPanel>
//   </SettingsSection>

const SettingsSectionContext = React.createContext<{ titleId?: string }>({});

const settingsSectionVariants = cva('group/settings-section grid gap-6', {
  variants: {
    layout: {
      // side by side once the section is 48rem wide
      responsive: '@3xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] @3xl:gap-10',
      stacked: '',
    },
  },
  defaultVariants: { layout: 'responsive' },
});

type SettingsSectionProps = React.ComponentProps<'section'> &
  VariantProps<typeof settingsSectionVariants> & {
    variant?: 'default' | 'destructive';
  };

function SettingsSection({ variant = 'default', layout, className, children, ...props }: SettingsSectionProps) {
  const titleId = React.useId();
  return (
    <SettingsSectionContext.Provider value={{ titleId }}>
      {/* the container the layout measures */}
      <div className="@container">
        <section
          data-slot="settings-section"
          data-variant={variant}
          data-layout={layout ?? 'responsive'}
          aria-labelledby={titleId}
          className={cn(settingsSectionVariants({ layout }), className)}
          {...props}
        >
          {children}
        </section>
      </div>
    </SettingsSectionContext.Provider>
  );
}

function SettingsSectionHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="settings-section-header"
      className={cn(
        'grid auto-rows-min content-start items-start gap-2 has-data-[slot=settings-section-action]:grid-cols-[1fr_auto]',
        className,
      )}
      {...props}
    />
  );
}

function SettingsSectionTitle({ className, ...props }: React.ComponentProps<'h2'>) {
  const { titleId } = React.useContext(SettingsSectionContext);
  return (
    // oxlint-disable-next-line jsx-a11y/heading-has-content -- the content comes in through props
    <h2
      id={titleId}
      data-slot="settings-section-title"
      className={cn(
        'text-xl leading-tight font-normal tracking-tight group-data-[variant=destructive]/settings-section:text-error',
        className,
      )}
      {...props}
    />
  );
}

function SettingsSectionDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return <p data-slot="settings-section-description" className={cn('text-muted-foreground', className)} {...props} />;
}

/** a control beside the title (a "Reset to default" link, an on/off switch) */
function SettingsSectionAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="settings-section-action"
      className={cn('col-start-2 row-span-2 row-start-1 self-start justify-self-end', className)}
      {...props}
    />
  );
}

/** the square panel the form sits in */
function SettingsSectionPanel({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="settings-section-panel"
      className={cn(
        'flex min-w-0 flex-col border border-border bg-card text-card-foreground',
        'group-data-[variant=destructive]/settings-section:border-destructive',
        className,
      )}
      {...props}
    />
  );
}

function SettingsSectionContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="settings-section-content" className={cn('flex flex-col gap-6 p-6', className)} {...props} />;
}

/** Save and Cancel on the right; put a SettingsSectionStatus first for the left */
function SettingsSectionFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="settings-section-footer"
      className={cn(
        'flex flex-wrap items-center justify-end gap-3 border-t border-border bg-muted/40 px-6 py-4',
        'group-data-[variant=destructive]/settings-section:border-destructive',
        className,
      )}
      {...props}
    />
  );
}

/** "Saved", "Unsaved changes": announced politely when it changes */
function SettingsSectionStatus({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      role="status"
      aria-live="polite"
      data-slot="settings-section-status"
      className={cn('mr-auto flex items-center gap-2 text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

export {
  SettingsSection,
  SettingsSectionAction,
  SettingsSectionContent,
  SettingsSectionDescription,
  SettingsSectionFooter,
  SettingsSectionHeader,
  SettingsSectionPanel,
  SettingsSectionStatus,
  SettingsSectionTitle,
  settingsSectionVariants,
};
