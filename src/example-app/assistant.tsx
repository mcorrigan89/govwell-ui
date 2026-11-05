import { useEffect, useRef, useState } from 'react';
import { Sparkles, X } from 'lucide-react';

import { Bubble, BubbleContent } from '@/components/ui/bubble';
import { Button } from '@/components/ui/button';
import { ChatComposer } from '@/components/ui/chat-composer';
import { Message, MessageContent, MessageHeader } from '@/components/ui/message';

import { findRecord, isOpen, RECORDS } from './data';

// The staff assistant's side view: a 400px panel beside the content. It
// answers from the sample's data with canned replies; no model is called.

type Turn = { id: number; from: 'me' | 'ai'; text: string };

function reply(question: string, path: string): string {
  const q = question.toLowerCase();
  const id = path.split('/')[3];
  const record = id ? findRecord(id) : undefined;
  if (record && /(status|where|summar|this)/.test(q)) {
    return `${record.number} (${record.kind}, ${record.address}) is at “${record.status.name}”. ${
      record.assignee ? `${record.assignee.name} owns it.` : 'Nobody owns it yet.'
    }`;
  }
  if (/overdue|late/.test(q)) {
    const late = RECORDS.filter((r) => isOpen(r) && r.due && r.due.getTime() < Date.now());
    return `${late.length} open records are past due. The oldest is ${late.at(-1)?.number ?? 'none'}.`;
  }
  return 'In GovWell I’d search your records, codes and fee schedules for that. In this sample I can tell you about the record you’re on, or what’s overdue.';
}

export function Assistant({ path, onClose }: { path: string; onClose: () => void }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // braces: newer browsers return a promise from scrollIntoView, which an effect mustn't return
    end.current?.scrollIntoView({ block: 'end' });
  }, [turns]);

  const send = (text: string) => {
    const at = Date.now();
    setTurns((t) => [...t, { id: at, from: 'me', text }]);
    setBusy(true);
    setTimeout(() => {
      setTurns((t) => [...t, { id: at + 1, from: 'ai', text: reply(text, path) }]);
      setBusy(false);
    }, 600);
  };

  return (
    <>
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <span className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          Assistant
        </span>
        <Button variant="ghost" size="icon-xs" aria-label="Close assistant" onClick={onClose}>
          <X />
        </Button>
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
        {turns.length === 0 && <p className="text-sm text-muted-foreground">Ask about the record you’re on, or try “what’s overdue?”</p>}
        {turns.map((t) =>
          t.from === 'me' ? (
            <Message key={t.id} align="end">
              <MessageContent>
                <Bubble>
                  <BubbleContent>{t.text}</BubbleContent>
                </Bubble>
              </MessageContent>
            </Message>
          ) : (
            <Message key={t.id}>
              <MessageContent>
                <MessageHeader>Assistant</MessageHeader>
                <Bubble variant="muted">
                  <BubbleContent>{t.text}</BubbleContent>
                </Bubble>
              </MessageContent>
            </Message>
          ),
        )}
        <div ref={end} />
      </div>
      <div className="border-t border-border p-3">
        <ChatComposer busy={busy} onSend={send} placeholder="Ask the assistant" textareaProps={{ autoFocus: true }} />
      </div>
    </>
  );
}
