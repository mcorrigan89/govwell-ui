'use client';

import * as React from 'react';
import { SendIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

// Where you write to the assistant: one square text box with a Concrete edge
// (Slate on hover and focus, ring outside it) holding a textarea that grows
// with what you type, up to a limit, and a Hope send button. Enter sends,
// Shift+Enter starts a new line (and Enter while an IME is composing does
// nothing). While the assistant is answering (`busy`) you can keep typing but
// not send, and the button shows the spinner; `disabled` turns the whole thing
// off (the assistant isn't available). Children sit above the text — pending
// attachments, say — and `actions` sit beside the send button.
//
//   <ChatComposer busy={busy} onSend={(text) => ask(text)} />

type ChatComposerProps = Omit<React.ComponentProps<'form'>, 'onSubmit' | 'defaultValue'> & {
  /** the draft, when you control it */
  value?: string;
  /** the starting draft, when it controls itself */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** called with the trimmed text; an uncontrolled composer then clears itself */
  onSend?: (text: string) => void;
  /** the assistant is answering: typing is fine, sending waits */
  busy?: boolean;
  disabled?: boolean;
  placeholder?: string;
  /** the textarea's accessible name */
  label?: string;
  /** the send button's accessible name */
  sendLabel?: string;
  /** extra buttons beside send (attach a file, say) */
  actions?: React.ReactNode;
  textareaProps?: Omit<React.ComponentProps<'textarea'>, 'value' | 'defaultValue' | 'disabled'>;
};

function ChatComposer({
  value: valueProp,
  defaultValue = '',
  onValueChange,
  onSend,
  busy = false,
  disabled = false,
  placeholder = 'Ask about permits, inspections, fees…',
  label = 'Message the assistant',
  sendLabel = 'Send',
  actions,
  textareaProps,
  className,
  children,
  ...props
}: ChatComposerProps) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue);
  const controlled = valueProp !== undefined;
  const value = controlled ? valueProp : uncontrolled;
  const canSend = !busy && !disabled && value.trim().length > 0;

  const setValue = (next: string) => {
    if (!controlled) setUncontrolled(next);
    onValueChange?.(next);
  };

  const send = () => {
    if (!canSend) return;
    onSend?.(value.trim());
    setValue('');
  };

  return (
    <form
      data-slot="chat-composer"
      data-busy={busy || undefined}
      data-disabled={disabled || undefined}
      aria-busy={busy || undefined}
      className={cn(
        'group/chat-composer flex w-full min-w-0 flex-col rounded-none border border-input bg-background text-foreground transition-colors hover:border-foreground has-[textarea:focus-visible]:border-foreground has-[textarea:focus-visible]:outline-2 has-[textarea:focus-visible]:outline-offset-2 has-[textarea:focus-visible]:outline-solid has-[textarea:focus-visible]:outline-ring data-disabled:pointer-events-none data-disabled:opacity-40',
        className,
      )}
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
      {...props}
    >
      {children && (
        <div data-slot="chat-composer-header" className="flex min-w-0 flex-col gap-2 px-3 pt-3">
          {children}
        </div>
      )}
      <div className="flex items-end gap-2 p-2 pl-0">
        <textarea
          data-slot="chat-composer-input"
          aria-label={label}
          placeholder={placeholder}
          rows={1}
          {...textareaProps}
          value={value}
          disabled={disabled}
          onChange={(e) => {
            setValue(e.target.value);
            textareaProps?.onChange?.(e);
          }}
          onKeyDown={(e) => {
            textareaProps?.onKeyDown?.(e);
            if (e.defaultPrevented) return;
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              send();
            }
          }}
          className={cn(
            'field-sizing-content max-h-48 min-h-10 min-w-0 flex-1 resize-none self-center bg-transparent py-2 pl-4 text-base leading-snug font-light outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed',
            textareaProps?.className,
          )}
        />
        {actions}
        <Button
          type="submit"
          size="icon-sm"
          data-slot="chat-composer-send"
          aria-label={sendLabel}
          title={sendLabel}
          disabled={!canSend}
          // keep the spinner readable while the button is disabled for busy
          className={cn(busy && 'disabled:opacity-100')}
        >
          {busy ? <Spinner aria-hidden="true" role="presentation" /> : <SendIcon />}
        </Button>
      </div>
    </form>
  );
}

export { ChatComposer, type ChatComposerProps };
