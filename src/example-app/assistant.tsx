import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

import { Bubble, BubbleContent } from '@/components/ui/bubble';
import { Button } from '@/components/ui/button';
import { ChatComposer } from '@/components/ui/chat-composer';
import { Message, MessageContent, MessageHeader } from '@/components/ui/message';

import { findRecord, INSPECTIONS, isOpen, RECORDS } from './data';
import { AssistantIcon } from './icons';

// The staff assistant's side view: a 400px panel beside the content. It
// answers from the sample's data with canned replies; no model is called.

type Turn = { id: number; from: 'me' | 'ai'; text: string };

// each new message rises and fades in; still under reduced motion
const ENTER = 'animate-in fade-in slide-in-from-bottom-2 duration-200 ease-out motion-reduce:animate-none';

/** a canned answer from the sample's data; also used by the chat page */
export function reply(question: string, path: string): string {
  const q = question.toLowerCase();
  const id = path.split('/')[3];
  const record = id ? findRecord(id) : undefined;
  if (record && /(status|where|summar|this)/.test(q)) {
    return `${record.number} (${record.kind}, ${record.address}) is at “${record.status.name}”. ${
      record.assignee ? `${record.assignee.name} owns it.` : 'Nobody owns it yet.'
    }`;
  }
  if (/inspection/.test(q)) {
    const today = new Date().toDateString();
    const todays = INSPECTIONS.filter((i) => i.start.toDateString() === today);
    return todays.length
      ? `${todays.length} inspections are on today’s calendar. The first is ${todays[0]!.title} at ${todays[0]!.address}.`
      : 'No inspections are booked for today. The calendar has the week ahead.';
  }
  if (/waiting|applicant/.test(q)) {
    const waiting = RECORDS.filter((r) => r.statusKey === 'waiting');
    return `${waiting.length} permits are waiting on applicants. The longest-waiting is ${waiting.at(-1)?.number ?? 'none'}.`;
  }
  if (/zoning|setback|parcel|variance/.test(q)) {
    return 'In GovWell I’d read the parcel’s zoning district from the map and quote its setbacks, height limit and lot coverage from your code, with a link to each section. This sample has no zoning code loaded.';
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
          <AssistantIcon className="size-4 text-foreground" />
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
            <Message key={t.id} align="end" className={ENTER}>
              <MessageContent>
                <Bubble>
                  <BubbleContent>{t.text}</BubbleContent>
                </Bubble>
              </MessageContent>
            </Message>
          ) : (
            <Message key={t.id} className={ENTER}>
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
        {/* no box round the composer: the rule above sets it apart */}
        <ChatComposer
          busy={busy}
          onSend={send}
          placeholder="Ask the assistant"
          textareaProps={{ autoFocus: true }}
          className="border-0 has-[textarea:focus-visible]:outline-none"
        />
      </div>
    </>
  );
}
