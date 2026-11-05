import { useState, type ReactNode } from 'react';
import { ChevronRight, FileText, Image as ImageIcon, Paperclip, RotateCw, Sparkles, X } from 'lucide-react';

import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from '@/components/ui/attachment';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bubble, BubbleContent, BubbleGroup, BubbleReactions } from '@/components/ui/bubble';
import { Button } from '@/components/ui/button';
import { ChatComposer } from '@/components/ui/chat-composer';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Marker, MarkerContent, MarkerIcon, MarkerStatus } from '@/components/ui/marker';
import { Message, MessageAvatar, MessageContent, MessageFooter, MessageHeader } from '@/components/ui/message';
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerFollow,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '@/components/ui/message-scroller';
import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoiceDescription,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireSkip,
  QuestionnaireSubmit,
  QuestionnaireTitle,
} from '@/components/ui/questionnaire';

// ── the assistant conversation ──────────────────────────────────────────────
// GovWell's org assistant: a reviewer asks, the assistant looks things up
// (activity rows), answers in plain Light type, and the composer sends.

type ToolCall = { id: string; label: string; status: 'working' | 'done' | 'error'; tool: string; detail?: string };
type Turn =
  | { kind: 'separator'; id: string; text: string }
  | { kind: 'note'; id: string; text: string }
  | { kind: 'user'; id: string; text: string; at: string; failed?: boolean }
  | { kind: 'assistant'; id: string; text: ReactNode; at: string; tools?: ToolCall[] };

const OPENING: Turn[] = [
  { kind: 'separator', id: 'today', text: 'Today' },
  { kind: 'user', id: 'u1', text: 'What’s holding up BP-2026-0142?', at: '9:41 AM' },
  {
    kind: 'assistant',
    id: 'a1',
    at: '9:41 AM',
    tools: [
      { id: 't1', label: 'Looked up permit BP-2026-0142', status: 'done', tool: 'get_record', detail: '{ "recordId": "BP-2026-0142" }' },
      {
        id: 't2',
        label: 'Checked outstanding fees',
        status: 'error',
        tool: 'list_fees',
        detail: 'The fees service didn’t answer in time.',
      },
    ],
    text: (
      <>
        <p>
          The residential addition at 418 Alder St. is waiting on a revised site plan. Planning returned the last one on Oct 28 because the
          rear setback measures 4 ft; the zone needs 5 ft.
        </p>
        <p className="mt-2">I couldn’t check the fees just now — ask again in a minute.</p>
      </>
    ),
  },
  { kind: 'note', id: 'n1', text: 'Opened permit BP-2026-0142' },
];

function ActivityRow({ call }: { call: ToolCall }) {
  return (
    <Collapsible>
      <Marker variant="activity" status={call.status} render={<CollapsibleTrigger />}>
        <ChevronRight className="size-3.5 text-muted-foreground transition-transform group-data-[panel-open]/marker:rotate-90" />
        <MarkerIcon />
        <MarkerContent>{call.label}</MarkerContent>
        <MarkerStatus />
      </Marker>
      <CollapsibleContent className="border border-t-0 border-border px-3 py-2 text-xs text-muted-foreground">
        <span className="eyebrow-type text-xs">Technical details</span>
        <code className="mt-1 block font-mono">{call.tool}</code>
        {call.detail && <p className="mt-1">{call.detail}</p>}
      </CollapsibleContent>
    </Collapsible>
  );
}

function Turns({ turns, onRetry }: { turns: Turn[]; onRetry: (id: string) => void }) {
  return turns.map((t) => (
    <MessageScrollerItem key={t.id} messageId={t.id}>
      {t.kind === 'separator' ? (
        <Marker variant="separator">
          <MarkerContent>{t.text}</MarkerContent>
        </Marker>
      ) : t.kind === 'note' ? (
        <Marker>
          <MarkerIcon>
            <FileText />
          </MarkerIcon>
          <MarkerContent>{t.text}</MarkerContent>
        </Marker>
      ) : t.kind === 'user' ? (
        <Message align="end">
          <MessageContent>
            <Bubble variant={t.failed ? 'destructive' : 'default'}>
              <BubbleContent className="whitespace-pre-wrap">{t.text}</BubbleContent>
            </Bubble>
            <MessageFooter>
              {t.failed ? (
                <button
                  type="button"
                  onClick={() => onRetry(t.id)}
                  className="inline-flex cursor-pointer items-center gap-1 text-error underline-offset-4 hover:underline"
                >
                  <RotateCw className="size-3" /> Not sent · try again
                </button>
              ) : (
                t.at
              )}
            </MessageFooter>
          </MessageContent>
        </Message>
      ) : (
        <Message>
          <MessageContent>
            <MessageHeader>
              <Sparkles className="size-3.5" /> Assistant
            </MessageHeader>
            {t.tools && (
              <div className="flex flex-col gap-1.5">
                {t.tools.map((call) => (
                  <ActivityRow key={call.id} call={call} />
                ))}
              </div>
            )}
            <Bubble variant="ghost">
              <BubbleContent>{t.text}</BubbleContent>
            </Bubble>
            <MessageFooter>{t.at}</MessageFooter>
          </MessageContent>
        </Message>
      )}
    </MessageScrollerItem>
  ));
}

function AssistantConversation() {
  const [turns, setTurns] = useState<Turn[]>(OPENING);
  const [busy, setBusy] = useState(false);

  const send = (text: string) => {
    setTurns((ts) => [...ts, { kind: 'user', id: `u-${ts.length}`, text, at: 'Just now' }]);
    setBusy(true);
    window.setTimeout(() => {
      setTurns((ts) => [
        ...ts,
        {
          kind: 'assistant',
          id: `a-${ts.length}`,
          at: 'Just now',
          tools: [{ id: `t-${ts.length}`, label: 'Searched inspections', status: 'done', tool: 'search_inspections' }],
          text: 'The framing inspection is booked for Thursday, Nov 12, between 8 and 11 AM, with Dana Ruiz.',
        },
      ]);
      setBusy(false);
    }, 1500);
  };
  const retry = (id: string) => setTurns((ts) => ts.map((t) => (t.id === id && t.kind === 'user' ? { ...t, failed: false } : t)));

  return (
    <div className="flex h-[34rem] w-full max-w-xl flex-col border border-border bg-background">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Sparkles className="size-4" />
        <span className="text-base font-normal">Org assistant</span>
      </div>
      <MessageScrollerProvider>
        <MessageScrollerFollow on={turns.filter((t) => t.kind === 'user').length} />
        <MessageScroller className="min-h-0 flex-1">
          <MessageScrollerViewport>
            <MessageScrollerContent className="gap-5 p-4">
              <Turns turns={turns} onRetry={retry} />
              {busy && (
                <MessageScrollerItem messageId="working">
                  <Marker status="working" role="status">
                    <MarkerIcon />
                    <MarkerContent>Thinking…</MarkerContent>
                  </Marker>
                </MessageScrollerItem>
              )}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>
      <div className="border-t border-border p-3">
        <ChatComposer busy={busy} onSend={send} />
      </div>
    </div>
  );
}

// ── the single-item demos ───────────────────────────────────────────────────

function MessageDemo() {
  return (
    <div className="flex w-full max-w-xl flex-col gap-6">
      <Message>
        <MessageAvatar>
          <Avatar size="sm">
            <AvatarFallback>DR</AvatarFallback>
          </Avatar>
        </MessageAvatar>
        <MessageContent>
          <MessageHeader>Dana Ruiz · Inspector</MessageHeader>
          <BubbleGroup>
            <Bubble variant="muted">
              <BubbleContent>Framing passed. The header over the garage door needs a second ply before drywall.</BubbleContent>
            </Bubble>
            <Bubble variant="muted">
              <BubbleContent>I’ve noted it on the inspection.</BubbleContent>
            </Bubble>
          </BubbleGroup>
          <MessageFooter>10:12 AM</MessageFooter>
        </MessageContent>
      </Message>
      <Message align="end">
        <MessageAvatar>
          <Avatar size="sm">
            <AvatarFallback>MK</AvatarFallback>
          </Avatar>
        </MessageAvatar>
        <MessageContent>
          <MessageHeader>You</MessageHeader>
          <Bubble>
            <BubbleContent>Thanks, Dana — I’ll let the contractor know.</BubbleContent>
          </Bubble>
          <MessageFooter>10:14 AM</MessageFooter>
        </MessageContent>
      </Message>
    </div>
  );
}

function BubbleDemo() {
  const [asked, setAsked] = useState<string | null>(null);
  return (
    <div className="flex w-full max-w-xl flex-col gap-4">
      <Bubble align="end">
        <BubbleContent>Which fees are still due on CE-2026-0088?</BubbleContent>
      </Bubble>
      <Bubble variant="ghost">
        <BubbleContent>
          One: the $150 re-inspection fee for the code enforcement case at 22 Birch Ln., issued Oct 30. Everything else is paid.
        </BubbleContent>
      </Bubble>
      <Bubble variant="tinted">
        <BubbleContent>Tip: residents can pay online from the link in their notice.</BubbleContent>
      </Bubble>
      <Bubble variant="outline">
        <BubbleContent>Reminder sent to the owner on Nov 2.</BubbleContent>
        <BubbleReactions>👍 2</BubbleReactions>
      </Bubble>
      <Bubble variant="destructive" align="end">
        <BubbleContent>Send the owner a second reminder.</BubbleContent>
      </Bubble>
      <div className="flex flex-wrap gap-2">
        {['Show the notice', 'Who issued it?'].map((q) => (
          <Bubble key={q} variant="outline">
            {/* the button's text comes from BubbleContent's children */}
            {/* oxlint-disable-next-line jsx-a11y/control-has-associated-label */}
            <BubbleContent render={<button type="button" onClick={() => setAsked(q)} />}>{q}</BubbleContent>
          </Bubble>
        ))}
      </div>
      {asked && <p className="text-sm text-muted-foreground">Asked: {asked}</p>}
    </div>
  );
}

function AttachmentDemo() {
  const [pending, setPending] = useState(true);
  return (
    <div className="flex w-full max-w-xl flex-col gap-4">
      <Attachment>
        <AttachmentMedia>
          <FileText />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>site-plan-418-alder-rev2.pdf</AttachmentTitle>
          <AttachmentDescription>2.4 MB · PDF</AttachmentDescription>
        </AttachmentContent>
        <AttachmentTrigger aria-label="Open site-plan-418-alder-rev2.pdf" />
      </Attachment>
      {pending && (
        <Attachment state="uploading" size="sm">
          <AttachmentMedia>
            <ImageIcon />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>garage-header-photo.jpg</AttachmentTitle>
            <AttachmentDescription>Uploading · 62%</AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction aria-label="Remove garage-header-photo.jpg" onClick={() => setPending(false)}>
              <X />
            </AttachmentAction>
          </AttachmentActions>
        </Attachment>
      )}
      <Attachment state="error" size="sm">
        <AttachmentMedia>
          <FileText />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>contractor-licence.pdf</AttachmentTitle>
          <AttachmentDescription>Too large — 25 MB is the limit</AttachmentDescription>
        </AttachmentContent>
      </Attachment>
      <AttachmentGroup>
        {['front-elevation.pdf', 'rear-elevation.pdf', 'floor-plan.pdf'].map((name) => (
          <Attachment key={name} orientation="vertical" state="idle">
            <AttachmentMedia>
              <FileText />
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>{name}</AttachmentTitle>
              <AttachmentDescription>Not sent yet</AttachmentDescription>
            </AttachmentContent>
          </Attachment>
        ))}
      </AttachmentGroup>
    </div>
  );
}

function MarkerDemo() {
  return (
    <div className="flex w-full max-w-xl flex-col gap-4">
      <Marker variant="separator">
        <MarkerContent>Tuesday, Nov 3</MarkerContent>
      </Marker>
      <Marker>
        <MarkerIcon>
          <FileText />
        </MarkerIcon>
        <MarkerContent>
          Opened <a href="#/marker">inspection INS-2026-1187</a>
        </MarkerContent>
      </Marker>
      <Marker variant="activity" status="done">
        <MarkerIcon />
        <MarkerContent>Looked up licence CL-2026-0031</MarkerContent>
        <MarkerStatus />
      </Marker>
      <Marker variant="activity" status="working">
        <MarkerIcon />
        <MarkerContent>Reading the plan set (14 pages)</MarkerContent>
        <MarkerStatus>0:24</MarkerStatus>
      </Marker>
      <Marker variant="activity" status="error">
        <MarkerIcon />
        <MarkerContent>Scheduling the final inspection</MarkerContent>
        <MarkerStatus />
      </Marker>
      <Marker status="working" role="status">
        <MarkerIcon />
        <MarkerContent>Thinking…</MarkerContent>
      </Marker>
      <Marker variant="border">
        <MarkerContent>Conversation started by Morgan Kim</MarkerContent>
      </Marker>
    </div>
  );
}

function QuestionnaireDemo() {
  const [answers, setAnswers] = useState<string | null>(null);
  return (
    <div className="w-full max-w-xl">
      <Questionnaire
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          setAnswers([data.get('type'), data.getAll('work').join(', '), data.get('valuation')].filter(Boolean).join(' · '));
        }}
      >
        <QuestionnaireProgress />
        <QuestionnaireItem name="type" required>
          <QuestionnaireTitle>What kind of permit is this?</QuestionnaireTitle>
          <QuestionnaireDescription>I’ll pick the right application form.</QuestionnaireDescription>
          <QuestionnaireChoices>
            <QuestionnaireChoice value="residential">
              Residential building
              <QuestionnaireChoiceDescription>Houses, additions, garages, decks</QuestionnaireChoiceDescription>
            </QuestionnaireChoice>
            <QuestionnaireChoice value="commercial">Commercial building</QuestionnaireChoice>
            <QuestionnaireChoice value="trade">Electrical, plumbing or mechanical only</QuestionnaireChoice>
          </QuestionnaireChoices>
        </QuestionnaireItem>
        <QuestionnaireItem name="work" multiple>
          <QuestionnaireTitle>What work is involved?</QuestionnaireTitle>
          <QuestionnaireChoices>
            <QuestionnaireChoice value="structural">Structural</QuestionnaireChoice>
            <QuestionnaireChoice value="electrical">Electrical</QuestionnaireChoice>
            <QuestionnaireChoice value="plumbing">Plumbing</QuestionnaireChoice>
          </QuestionnaireChoices>
        </QuestionnaireItem>
        <QuestionnaireItem name="valuation">
          <QuestionnaireTitle>Roughly what will the work cost?</QuestionnaireTitle>
          <QuestionnaireDescription>The permit fee is based on it.</QuestionnaireDescription>
          <QuestionnaireInput placeholder="$45,000" aria-label="Estimated cost of the work" />
        </QuestionnaireItem>
        <QuestionnaireActions>
          <QuestionnairePrevious />
          <QuestionnaireSkip />
          <QuestionnaireNext />
          <QuestionnaireSubmit />
        </QuestionnaireActions>
      </Questionnaire>
      {answers && <p className="mt-4 text-sm text-muted-foreground">Answers: {answers}</p>}
    </div>
  );
}

function ChatComposerDemo() {
  const [sent, setSent] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState(true);
  return (
    <div className="flex w-full max-w-xl flex-col gap-4">
      <ChatComposer
        busy={busy}
        onSend={(text) => {
          setSent((s) => [...s, text]);
          setBusy(true);
          window.setTimeout(() => setBusy(false), 1200);
        }}
        actions={
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Attach a file">
            <Paperclip />
          </Button>
        }
      >
        {file && (
          <Attachment size="xs">
            <AttachmentMedia>
              <FileText />
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>fee-schedule-2026.pdf</AttachmentTitle>
            </AttachmentContent>
            <AttachmentActions>
              <AttachmentAction aria-label="Remove fee-schedule-2026.pdf" onClick={() => setFile(false)}>
                <X />
              </AttachmentAction>
            </AttachmentActions>
          </Attachment>
        )}
      </ChatComposer>
      <ChatComposer disabled placeholder="The assistant isn’t set up for this jurisdiction yet" />
      {sent.length > 0 && (
        <ul className="text-sm text-muted-foreground">
          {sent.map((s, i) => (
            <li key={i} className="whitespace-pre-wrap">
              Sent: {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export const CHAT_DEMOS: Record<string, () => ReactNode> = {
  message: () => <MessageDemo />,
  bubble: () => <BubbleDemo />,
  attachment: () => <AttachmentDemo />,
  marker: () => <MarkerDemo />,
  'message-scroller': () => <AssistantConversation />,
  questionnaire: () => <QuestionnaireDemo />,
  'chat-composer': () => <ChatComposerDemo />,
};
