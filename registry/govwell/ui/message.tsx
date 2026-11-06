import * as React from 'react';

import { cn } from '@/lib/utils';

// One turn in a conversation with the assistant or a colleague: an avatar, a
// header (who, when), the content — bubbles, attachments, activity markers —
// and a footer. align="end" puts your own messages on the right. Headers are
// small muted eyebrow type; nothing is bold.

function MessageGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="message-group" className={cn('flex min-w-0 flex-col gap-2', className)} {...props} />;
}

function Message({ className, align = 'start', ...props }: React.ComponentProps<'div'> & { align?: 'start' | 'end' }) {
  return (
    <div
      data-slot="message"
      data-align={align}
      className={cn('group/message relative flex w-full min-w-0 gap-3 text-sm font-light data-[align=end]:flex-row-reverse', className)}
      {...props}
    />
  );
}

function MessageAvatar({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="message-avatar"
      className={cn(
        'flex w-fit min-w-8 shrink-0 items-center justify-center self-end group-has-data-[slot=message-footer]/message:-translate-y-7',
        className,
      )}
      {...props}
    />
  );
}

function MessageContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="message-content"
      className={cn('flex w-full min-w-0 flex-col gap-2 wrap-break-word group-data-[align=end]/message:*:data-slot:self-end', className)}
      {...props}
    />
  );
}

function MessageHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="message-header"
      className={cn(
        'flex max-w-full min-w-0 items-center gap-2 px-4 text-xs font-normal tracking-[0.04em] text-muted-foreground uppercase group-has-data-[variant=ghost]/message:px-0 group-data-[align=end]/message:justify-end',
        className,
      )}
      {...props}
    />
  );
}

function MessageFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="message-footer"
      className={cn(
        'flex max-w-full min-w-0 items-center gap-2 px-4 text-xs text-muted-foreground tabular-nums group-has-data-[variant=ghost]/message:px-0 group-data-[align=end]/message:justify-end',
        className,
      )}
      {...props}
    />
  );
}

export { Message, MessageAvatar, MessageContent, MessageFooter, MessageGroup, MessageHeader };
