'use client';

import * as React from 'react';
import { mergeAttributes, Node } from '@tiptap/core';
import { Placeholder } from '@tiptap/extensions';
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  BoldIcon,
  BracesIcon,
  ItalicIcon,
  Link2Icon,
  ListIcon,
  ListOrderedIcon,
  Redo2Icon,
  StrikethroughIcon,
  UnderlineIcon,
  Undo2Icon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Toolbar, ToolbarButton, ToolbarGroup, ToolbarSeparator, ToolbarToggle } from '@/components/ui/toolbar';
import { cn } from '@/lib/utils';

// Formatted text — a notice, a letter, a condition of approval — in a
// square text box like <Textarea>: a Concrete edge that turns Slate on hover
// and focus, a toolbar along the top on an Ash rule (bold, italic,
// underline, strike, lists, link, undo/redo), and the text set in GovWell
// prose: Light body, Regular headings, underlined links. Controlled as HTML:
// `value` and `onChange` (an empty editor is ""). TipTap 3 underneath.
//
// `mergeFields` adds an "Insert field" menu: each field drops into the text
// as a Hope-tint chip, stored as <span data-field="permit_number">, for the
// app to fill in when the text is sent or printed.

type MergeField = { value: string; label: string };

const MergeFieldNode = Node.create<{ fields: MergeField[] }>({
  name: 'mergeField',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  addOptions() {
    return { fields: [] };
  },
  addAttributes() {
    return {
      field: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-field'),
        renderHTML: (attrs) => ({ 'data-field': attrs.field }),
      },
    };
  },
  parseHTML() {
    return [{ tag: 'span[data-field]' }];
  },
  renderHTML({ node, HTMLAttributes }) {
    const field = node.attrs.field as string;
    return [
      'span',
      mergeAttributes(HTMLAttributes, { 'data-slot': 'merge-field' }),
      this.options.fields.find((f) => f.value === field)?.label ?? field,
    ];
  },
  renderText({ node }) {
    return `{{${node.attrs.field as string}}}`;
  },
});

// GovWell prose for what's written: Light body, Regular headings, lists
// indented with their markers, links underlined, merge fields as tint chips
const proseClassName = cn(
  'min-h-32 px-4 py-3 text-base font-light text-foreground outline-none',
  '[&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0',
  '[&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-normal [&_h2]:tracking-tight [&_h3]:mt-3 [&_h3]:mb-1.5 [&_h3]:text-lg [&_h3]:font-normal',
  '[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_li_p]:my-0.5',
  '[&_a]:text-foreground [&_a]:underline [&_a]:decoration-1 [&_a]:underline-offset-4',
  '[&_strong]:font-bold [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground',
  '[&_[data-slot=merge-field]]:mx-0.5 [&_[data-slot=merge-field]]:bg-hope-tint [&_[data-slot=merge-field]]:px-1 [&_[data-slot=merge-field]]:py-px [&_[data-slot=merge-field]]:text-[0.9em] [&_[data-slot=merge-field]]:text-tint-foreground',
  '[&_.is-editor-empty:first-child::before]:pointer-events-none [&_.is-editor-empty:first-child::before]:float-left [&_.is-editor-empty:first-child::before]:h-0 [&_.is-editor-empty:first-child::before]:text-muted-foreground [&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]',
);

const htmlOf = (editor: Editor) => (editor.isEmpty ? '' : editor.getHTML());

function RichTextEditor({
  value,
  onChange,
  placeholder,
  disabled = false,
  readOnly = false,
  mergeFields,
  className,
  editorClassName,
  id,
  onBlur,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
}: {
  /** HTML; "" when empty */
  value: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /** shows the text without the toolbar or a caret */
  readOnly?: boolean;
  /** fields that can be dropped into the text, filled in later by the app */
  mergeFields?: MergeField[];
  className?: string;
  editorClassName?: string;
  id?: string;
  onBlur?: () => void;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
}) {
  const onChangeRef = React.useRef(onChange);
  const onBlurRef = React.useRef(onBlur);
  React.useEffect(() => {
    onChangeRef.current = onChange;
    onBlurRef.current = onBlur;
  });
  // the last HTML we emitted or were given, so our own changes coming back as
  // `value` don't reset the text (and the caret)
  const last = React.useRef(value);
  const editable = !disabled && !readOnly;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        // no empty paragraph tacked on after a list: the stored HTML is what was written
        trailingNode: false,
        link: { openOnClick: false, autolink: true, protocols: ['mailto', 'tel'] },
      }),
      Placeholder.configure({ placeholder: placeholder ?? '' }),
      MergeFieldNode.configure({ fields: mergeFields ?? [] }),
    ],
    content: value,
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        role: 'textbox',
        'aria-multiline': 'true',
        class: cn(proseClassName, editorClassName),
        ...(id ? { id } : {}),
        ...(ariaLabel ? { 'aria-label': ariaLabel } : {}),
        ...(ariaLabelledBy ? { 'aria-labelledby': ariaLabelledBy } : {}),
        ...(ariaDescribedBy ? { 'aria-describedby': ariaDescribedBy } : {}),
        ...(ariaInvalid ? { 'aria-invalid': 'true' } : {}),
        ...(readOnly ? { 'aria-readonly': 'true' } : {}),
        ...(disabled ? { 'aria-disabled': 'true' } : {}),
      },
    },
    onUpdate: ({ editor: e }) => {
      const html = htmlOf(e);
      last.current = html;
      onChangeRef.current?.(html);
    },
    onBlur: () => onBlurRef.current?.(),
  });

  // a value set from outside (a template picked, a form reset) replaces the text
  React.useEffect(() => {
    if (!editor || value === last.current) return;
    last.current = value;
    if (value !== htmlOf(editor)) editor.commands.setContent(value, { emitUpdate: false });
  }, [editor, value]);

  React.useEffect(() => {
    editor?.setEditable(editable, false);
  }, [editor, editable]);

  return (
    <div
      data-slot="rich-text-editor"
      data-disabled={disabled || undefined}
      data-readonly={readOnly || undefined}
      aria-invalid={ariaInvalid || undefined}
      className={cn(
        'flex w-full flex-col rounded-none border border-input bg-background transition-colors not-data-readonly:hover:border-foreground has-[.ProseMirror-focused]:border-foreground has-[.ProseMirror-focused]:outline-2 has-[.ProseMirror-focused]:outline-offset-2 has-[.ProseMirror-focused]:outline-solid has-[.ProseMirror-focused]:outline-ring aria-invalid:border-error data-disabled:cursor-not-allowed data-disabled:opacity-40 data-readonly:border-border',
        className,
      )}
    >
      {editor && !readOnly && <RichTextToolbar editor={editor} disabled={disabled} mergeFields={mergeFields} />}
      <EditorContent editor={editor} className="flex-1" />
    </div>
  );
}

function RichTextToolbar({ editor, disabled, mergeFields }: { editor: Editor; disabled: boolean; mergeFields?: MergeField[] }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      underline: e.isActive('underline'),
      strike: e.isActive('strike'),
      bullets: e.isActive('bulletList'),
      numbers: e.isActive('orderedList'),
      link: e.isActive('link'),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });
  const [linking, setLinking] = React.useState(false);
  const [href, setHref] = React.useState('');
  const linkInput = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (linking) linkInput.current?.focus();
  }, [linking]);

  const applyLink = () => {
    const url = href.trim();
    const chain = editor.chain().focus().extendMarkRange('link');
    if (!url) chain.unsetLink().run();
    else chain.setLink({ href: /^(https?:|mailto:|tel:)/i.test(url) ? url : `https://${url}` }).run();
    setLinking(false);
  };

  // keep the text's selection: act without moving focus to the toolbar
  const keepSelection = (e: React.MouseEvent) => e.preventDefault();
  const mark = (label: string, pressed: boolean, run: () => void, icon: React.ReactNode) => (
    <ToolbarToggle tooltip={label} pressed={pressed} onPressedChange={run} onMouseDown={keepSelection}>
      {icon}
    </ToolbarToggle>
  );

  return (
    <div data-slot="rich-text-editor-toolbar" className="flex flex-col border-b border-border">
      <Toolbar aria-label="Formatting" disabled={disabled} className="w-full border-0 bg-transparent">
        <ToolbarGroup>
          {mark('Bold', state.bold, () => editor.chain().focus().toggleBold().run(), <BoldIcon />)}
          {mark('Italic', state.italic, () => editor.chain().focus().toggleItalic().run(), <ItalicIcon />)}
          {mark('Underline', state.underline, () => editor.chain().focus().toggleUnderline().run(), <UnderlineIcon />)}
          {mark('Strikethrough', state.strike, () => editor.chain().focus().toggleStrike().run(), <StrikethroughIcon />)}
        </ToolbarGroup>
        <ToolbarSeparator />
        <ToolbarGroup>
          {mark('Bulleted list', state.bullets, () => editor.chain().focus().toggleBulletList().run(), <ListIcon />)}
          {mark('Numbered list', state.numbers, () => editor.chain().focus().toggleOrderedList().run(), <ListOrderedIcon />)}
        </ToolbarGroup>
        <ToolbarSeparator />
        {mark(
          'Link',
          state.link || linking,
          () => {
            setHref((editor.getAttributes('link').href as string | undefined) ?? '');
            setLinking((v) => !v);
          },
          <Link2Icon />,
        )}
        {mergeFields && mergeFields.length > 0 && (
          <>
            <ToolbarSeparator />
            <DropdownMenu>
              <DropdownMenuTrigger render={<ToolbarButton size="sm" onMouseDown={keepSelection} />}>
                <BracesIcon data-icon="inline-start" />
                Insert field
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {mergeFields.map((field) => (
                  <DropdownMenuItem
                    key={field.value}
                    onClick={() =>
                      editor
                        .chain()
                        .focus()
                        .insertContent({ type: 'mergeField', attrs: { field: field.value } })
                        .run()
                    }
                  >
                    {field.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
        <ToolbarGroup className="ml-auto">
          <ToolbarButton
            tooltip="Undo"
            disabled={!state.canUndo}
            onMouseDown={keepSelection}
            onClick={() => editor.chain().focus().undo().run()}
          >
            <Undo2Icon />
          </ToolbarButton>
          <ToolbarButton
            tooltip="Redo"
            disabled={!state.canRedo}
            onMouseDown={keepSelection}
            onClick={() => editor.chain().focus().redo().run()}
          >
            <Redo2Icon />
          </ToolbarButton>
        </ToolbarGroup>
      </Toolbar>
      {linking && (
        <div data-slot="rich-text-editor-link" className="flex items-center gap-2 border-t border-border p-2">
          <Input
            ref={linkInput}
            className="h-10 flex-1 text-sm"
            placeholder="https://… (leave empty to remove the link)"
            aria-label="Link address"
            value={href}
            onChange={(e) => setHref(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                applyLink();
              }
              if (e.key === 'Escape') {
                e.preventDefault();
                setLinking(false);
                editor.commands.focus();
              }
            }}
          />
          <Button type="button" size="sm" variant="secondary" onClick={applyLink}>
            {href.trim() ? 'Set link' : 'Remove link'}
          </Button>
        </div>
      )}
    </div>
  );
}

export { RichTextEditor };
export type { MergeField };
