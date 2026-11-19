import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowLeft, Mic, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Bubble, BubbleContent } from '@/components/ui/bubble';
import { Button, buttonVariants } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Message, MessageContent, MessageHeader } from '@/components/ui/message';
import { SegmentedControl, SegmentedControlItem } from '@/components/ui/segmented-control';
import { cn } from '@/lib/utils';

import { reply } from './assistant';
import { ME } from './data';
import { HourglassIcon, LocationsIcon, SendIcon, TasksIcon } from './icons';

// The assistant as a page of its own: a greeting with the flag mark, a composer (Ask or Draft, an attachment, a
// scope and dictation) and a few ideas to start from. Once you send, the
// conversation takes the greeting's place. Replies are canned, as in the side
// panel; nothing is sent anywhere.

type Turn = { id: number; from: 'me' | 'ai'; text: string };

const IDEAS: { icon: ReactNode; text: string }[] = [
  { icon: <TasksIcon />, text: 'Summarize today’s inspections' },
  { icon: <HourglassIcon />, text: 'Find permits waiting on applicants' },
  { icon: <LocationsIcon />, text: 'Explain the zoning setbacks for a parcel' },
];

function greeting(now = new Date()) {
  const hour = now.getHours();
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
}

// each new message rises and fades in; still under reduced motion
const ENTER = 'animate-in fade-in slide-in-from-bottom-2 duration-200 ease-out motion-reduce:animate-none';

const notInSample = () => toast('Not in this sample', { description: 'In GovWell this opens from here.' });

export function ChatPage() {
  const id = useId();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState('');
  const [mode, setMode] = useState<'ask' | 'draft'>('ask');
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (turns.length) end.current?.scrollIntoView({ block: 'end' });
  }, [turns]);

  const send = (text: string) => {
    const question = text.trim();
    if (!question || busy) return;
    const at = Date.now();
    setTurns((t) => [...t, { id: at, from: 'me', text: question }]);
    setDraft('');
    setBusy(true);
    setTimeout(() => {
      const answer = reply(question, '');
      setTurns((t) => [...t, { id: at + 1, from: 'ai', text: mode === 'draft' ? `Here’s a first draft to edit. ${answer}` : answer }]);
      setBusy(false);
    }, 600);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    send(draft);
  };

  const started = turns.length > 0;

  return (
    <div className="flex min-h-full flex-col px-4 pt-4 pb-6 md:px-6">
      {/* for the demo only: back to where you came from */}
      <a
        href="#/insights"
        onClick={(e) => {
          if (history.length > 1) {
            e.preventDefault();
            history.back();
          }
        }}
        className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'w-fit' })}
      >
        <ArrowLeft data-icon="inline-start" /> Back
      </a>

      <div className={cn('mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6', started ? 'pt-6' : 'justify-center py-10')}>
        {started ? (
          <div role="log" aria-label="Conversation" className="flex flex-1 flex-col gap-4">
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
        ) : (
          <h1 className="mb-4 flex items-baseline justify-center gap-4 text-center text-4xl leading-tight font-normal tracking-tight md:text-5xl">
            {/* as tall as the capitals (GT Standard's cap height is 0.705em), standing on the baseline */}
            {/* the logomark with its flag rippling (the Spinner). Its box leaves room
                above for the ripple, so 0.814em tall puts the mark's ink at
                cap height (0.705em); decorative, so it isn't a "Loading" status */}
            <Spinner role="presentation" aria-label={undefined} aria-hidden className="h-[0.814em] w-auto shrink-0" />
            {greeting()}, {ME.name.split(' ')[0]}
          </h1>
        )}

        {/* no outline: Tailwind's shadow-lg (two layers at 10% black). While you type the
            shadow deepens to 20% and reaches further, and the box grows 1.5% */}
        <form
          onSubmit={submit}
          aria-label="Message the assistant"
          className="flex flex-col bg-background shadow-lg transition-[box-shadow,scale] duration-200 ease-out focus-within:scale-[1.015] focus-within:shadow-[0_14px_24px_-4px_rgb(0_0_0/0.2),0_6px_10px_-6px_rgb(0_0_0/0.2)] motion-reduce:transition-none"
        >
          <label htmlFor={`${id}-message`} className="sr-only">
            Message
          </label>
          <textarea
            id={`${id}-message`}
            ref={input}
            rows={2}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send(draft);
              }
            }}
            placeholder={mode === 'ask' ? 'Ask about a permit, parcel or zoning rule' : 'Describe a letter, notice or condition to draft'}
            className="field-sizing-content max-h-60 min-h-16 w-full resize-none bg-transparent px-4 pt-4 text-base font-light outline-none placeholder:text-muted-foreground"
          />
          <div className="flex items-center gap-2 p-2">
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Attach a file" onClick={notInSample}>
              <Plus />
            </Button>
            <SegmentedControl
              aria-label="Mode"
              value={mode}
              onValueChange={setMode}
              size="sm"
              fitContent
              className="h-8 border-0 bg-transparent p-0"
            >
              <SegmentedControlItem value="ask">Ask</SegmentedControlItem>
              <SegmentedControlItem value="draft">Draft</SegmentedControlItem>
            </SegmentedControl>
            <span className="ml-auto hidden text-sm text-muted-foreground sm:inline">All record types</span>
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Dictate" onClick={notInSample}>
              <Mic />
            </Button>
            <Button type="submit" size="icon-sm" aria-label="Send" disabled={!draft.trim() || busy}>
              <SendIcon />
            </Button>
          </div>
        </form>

        {!started && (
          <section aria-labelledby={`${id}-ideas`} className="flex flex-col gap-1">
            <h2 id={`${id}-ideas`} className="pb-2 text-sm text-muted-foreground">
              Ideas for you
            </h2>
            {IDEAS.map((idea) => (
              // text in line with the chat box, the hover fill reaching 12px past
              // it; the Hope fill sweeps in from the left instead of appearing
              <Button
                key={idea.text}
                variant="ghost"
                className="-mx-3 h-12 justify-start gap-2.5 bg-[linear-gradient(var(--hope),var(--hope))] bg-[length:0%_100%] bg-no-repeat px-3 transition-[background-size,color] duration-400 ease-in hover:bg-transparent hover:bg-[length:100%_100%] focus-visible:bg-[length:100%_100%] motion-reduce:transition-none"
                onClick={() => send(idea.text)}
              >
                <span aria-hidden className="flex shrink-0 [&_svg]:size-5">
                  {idea.icon}
                </span>
                {idea.text}
              </Button>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
