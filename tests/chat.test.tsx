import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Attachment, AttachmentContent, AttachmentTitle, AttachmentTrigger } from '@/components/ui/attachment';
import { Bubble, BubbleContent } from '@/components/ui/bubble';
import { ChatComposer } from '@/components/ui/chat-composer';
import { Marker, MarkerContent, MarkerIcon, MarkerStatus } from '@/components/ui/marker';
import { Message, MessageContent } from '@/components/ui/message';
import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoices,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnaireSubmit,
  QuestionnaireTitle,
} from '@/components/ui/questionnaire';
import { CHAT_DEMOS } from '../src/demos/chat';

// jsdom has no ResizeObserver; the message scroller watches its content with one
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
if (typeof Element !== 'undefined') Element.prototype.scrollIntoView ??= function () {};

describe('Message, Bubble and Attachment', () => {
  it('carry their alignment, variant and state for styling', () => {
    const { container } = render(
      <Message align="end">
        <MessageContent>
          <Bubble variant="destructive">
            <BubbleContent>Not sent</BubbleContent>
          </Bubble>
          <Attachment state="uploading">
            <AttachmentContent>
              <AttachmentTitle>site-plan.pdf</AttachmentTitle>
            </AttachmentContent>
          </Attachment>
        </MessageContent>
      </Message>,
    );
    expect(container.querySelector('[data-slot=message]')).toHaveAttribute('data-align', 'end');
    expect(container.querySelector('[data-slot=bubble]')).toHaveAttribute('data-variant', 'destructive');
    const attachment = container.querySelector('[data-slot=attachment]');
    expect(attachment).toHaveAttribute('data-state', 'uploading');
    expect(attachment).toHaveAttribute('aria-busy', 'true');
  });

  it('BubbleContent can be a button, for a suggested question', async () => {
    const onClick = vi.fn();
    render(
      <Bubble variant="outline">
        {/* oxlint-disable-next-line jsx-a11y/control-has-associated-label */}
        <BubbleContent render={<button type="button" onClick={onClick} />}>Which fees are due?</BubbleContent>
      </Bubble>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Which fees are due?' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('AttachmentTrigger makes the whole card a button', async () => {
    const onClick = vi.fn();
    render(
      <Attachment>
        <AttachmentContent>
          <AttachmentTitle>permit.pdf</AttachmentTitle>
        </AttachmentContent>
        <AttachmentTrigger aria-label="Open permit.pdf" onClick={onClick} />
      </Attachment>,
    );
    const trigger = screen.getByRole('button', { name: 'Open permit.pdf' });
    expect(trigger).toHaveAttribute('type', 'button');
    await userEvent.click(trigger);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('the attachment demo removes a pending upload', async () => {
    render(<>{CHAT_DEMOS.attachment!()}</>);
    await userEvent.click(screen.getByRole('button', { name: 'Remove garage-header-photo.jpg' }));
    expect(screen.queryByText('garage-header-photo.jpg')).not.toBeInTheDocument();
  });
});

describe('Marker', () => {
  it('shows a tool call’s status as an icon and in words', () => {
    const { container, rerender } = render(
      <Marker variant="activity" status="working">
        <MarkerIcon />
        <MarkerContent>Looked up permit</MarkerContent>
        <MarkerStatus />
      </Marker>,
    );
    const marker = container.querySelector('[data-slot=marker]')!;
    expect(marker).toHaveAttribute('data-variant', 'activity');
    expect(marker).toHaveAttribute('data-status', 'working');
    expect(marker).toHaveAttribute('aria-busy', 'true');
    expect(container.querySelector('[data-slot=marker-icon] [data-slot=spinner]')).toBeInTheDocument();
    expect(screen.getByText('Working')).toBeInTheDocument();

    rerender(
      <Marker variant="activity" status="error">
        <MarkerIcon />
        <MarkerContent>Looked up permit</MarkerContent>
        <MarkerStatus />
      </Marker>,
    );
    expect(marker).not.toHaveAttribute('aria-busy');
    expect(container.querySelector('[data-slot=spinner]')).not.toBeInTheDocument();
    expect(screen.getByText('Didn’t work')).toBeInTheDocument();
  });

  it('keeps an icon or label you give it', () => {
    render(
      <Marker status="done">
        <MarkerIcon>›</MarkerIcon>
        <MarkerStatus>0:12</MarkerStatus>
      </Marker>,
    );
    expect(screen.getByText('›')).toBeInTheDocument();
    expect(screen.getByText('0:12')).toBeInTheDocument();
    expect(screen.queryByText('Done')).not.toBeInTheDocument();
  });

  it('an activity row opens its technical details', async () => {
    render(<>{CHAT_DEMOS['message-scroller']!()}</>);
    const row = screen.getByRole('button', { name: /Checked outstanding fees/ });
    expect(row).toHaveAttribute('data-status', 'error');
    expect(screen.queryByText('list_fees')).not.toBeInTheDocument();
    await userEvent.click(row);
    expect(screen.getByText('list_fees')).toBeVisible();
  });
});

describe('ChatComposer', () => {
  it('sends on Enter and adds a line on Shift+Enter', async () => {
    const onSend = vi.fn();
    render(<ChatComposer onSend={onSend} />);
    const box = screen.getByRole('textbox', { name: 'Message the assistant' });
    const send = screen.getByRole('button', { name: 'Send' });
    expect(send).toBeDisabled();

    await userEvent.type(box, 'When is the{Shift>}{Enter}{/Shift}inspection?');
    expect(box).toHaveValue('When is the\ninspection?');
    expect(onSend).not.toHaveBeenCalled();

    await userEvent.type(box, '{Enter}');
    expect(onSend).toHaveBeenCalledWith('When is the\ninspection?');
    expect(box).toHaveValue('');
  });

  it('sends trimmed text from the button, and never sends blank text', async () => {
    const onSend = vi.fn();
    render(<ChatComposer onSend={onSend} />);
    const box = screen.getByRole('textbox', { name: 'Message the assistant' });
    await userEvent.type(box, '   {Enter}');
    expect(onSend).not.toHaveBeenCalled();
    await userEvent.type(box, 'fees due?  ');
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(onSend).toHaveBeenCalledWith('fees due?');
  });

  it('holds sending while busy but lets you keep typing', async () => {
    const onSend = vi.fn();
    const { container } = render(<ChatComposer busy onSend={onSend} />);
    const box = screen.getByRole('textbox', { name: 'Message the assistant' });
    await userEvent.type(box, 'next question{Enter}');
    expect(onSend).not.toHaveBeenCalled();
    expect(box).toHaveValue('next question');
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
    expect(container.querySelector('[data-slot=chat-composer-send] [data-slot=spinner]')).toBeInTheDocument();
  });

  it('can be controlled, and disabled', async () => {
    const onValueChange = vi.fn();
    const { rerender } = render(<ChatComposer value="draft" onValueChange={onValueChange} />);
    const box = screen.getByRole('textbox', { name: 'Message the assistant' });
    await userEvent.type(box, '!');
    expect(onValueChange).toHaveBeenLastCalledWith('draft!');
    expect(box).toHaveValue('draft');
    rerender(<ChatComposer value="draft" disabled />);
    expect(box).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
  });
});

describe('the assistant conversation', () => {
  it('sends your question, shows the working state, then the answer', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<>{CHAT_DEMOS['message-scroller']!()}</>);
      await user.type(screen.getByRole('textbox', { name: 'Message the assistant' }), 'When is the framing inspection?{Enter}');
      const mine = screen.getByText('When is the framing inspection?').closest('[data-slot=message]');
      expect(mine).toHaveAttribute('data-align', 'end');
      expect(screen.getByRole('status')).toHaveTextContent('Thinking…');
      expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();

      await act(() => vi.advanceTimersByTimeAsync(1600));
      expect(screen.queryByText('Thinking…')).not.toBeInTheDocument();
      expect(screen.getByText(/framing inspection is booked/)).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('Questionnaire', () => {
  function PermitType({ onSubmit }: { onSubmit: (data: FormData) => void }) {
    return (
      <Questionnaire
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(new FormData(e.currentTarget));
        }}
      >
        <QuestionnaireItem name="type" required>
          <QuestionnaireTitle>What kind of permit?</QuestionnaireTitle>
          <QuestionnaireChoices>
            <QuestionnaireChoice value="residential">Residential</QuestionnaireChoice>
            <QuestionnaireChoice value="commercial">Commercial</QuestionnaireChoice>
          </QuestionnaireChoices>
        </QuestionnaireItem>
        <QuestionnaireItem name="work" multiple>
          <QuestionnaireTitle>What work is involved?</QuestionnaireTitle>
          <QuestionnaireChoices>
            <QuestionnaireChoice value="electrical">Electrical</QuestionnaireChoice>
            <QuestionnaireChoice value="plumbing">Plumbing</QuestionnaireChoice>
          </QuestionnaireChoices>
        </QuestionnaireItem>
        <QuestionnaireActions>
          <QuestionnaireNext />
          <QuestionnaireSubmit />
        </QuestionnaireActions>
      </Questionnaire>
    );
  }

  it('asks one question at a time and submits the answers as form data', async () => {
    const onSubmit = vi.fn();
    render(<PermitType onSubmit={onSubmit} />);
    expect(screen.getByText('What kind of permit?')).toBeVisible();
    expect(screen.queryByText('What work is involved?')).not.toBeVisible();

    await userEvent.click(screen.getByRole('radio', { name: 'Residential' }));
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    const work = screen.getByText('What work is involved?').closest('fieldset')!;
    await userEvent.click(within(work).getByRole('checkbox', { name: 'Electrical' }));
    await userEvent.click(within(work).getByRole('checkbox', { name: 'Plumbing' }));
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(onSubmit).toHaveBeenCalledOnce();
    const data = onSubmit.mock.calls[0]![0] as FormData;
    expect(data.get('type')).toBe('residential');
    expect(data.getAll('work')).toEqual(['electrical', 'plumbing']);
  });

  it('holds a required question until it is answered', async () => {
    render(<PermitType onSubmit={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('What kind of permit?')).toBeVisible();
    expect(screen.queryByText('What work is involved?')).not.toBeVisible();
  });
});
