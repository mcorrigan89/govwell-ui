import * as React from 'react';
import ReactMarkdown, { type Components, type Options } from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { cn } from '@/lib/utils';

// Written text — a spec, a condition of approval, a help article, an AI
// answer — rendered from Markdown with GitHub's extensions (tables, task
// lists, strikethrough, autolinks) and set in the theme's `govwell-prose`:
// Regular headings, Light body, a Hope rule on quotes, Ash table lines.
// Safe by default: raw HTML in the source is dropped, never rendered, and
// react-markdown strips javascript: and other unsafe link targets. Pass
// `components` to swap any element's renderer (a code block, a heading with
// an anchor); yours win over the defaults here.
//
//   <Markdown>{conditions}</Markdown>

const defaultComponents: Components = {
  // a GFM task list's box is read-only and unlabelled; name it by its state so
  // a screen reader hears "done" or "to do" before the item's text
  input: ({ node: _node, ...props }) =>
    props.type === 'checkbox' ? <input {...props} aria-label={props.checked ? 'Done' : 'To do'} /> : <input {...props} />,
  // links keep the prose underline and gain the standard focus ring
  a: ({ node: _node, className, children, ...props }) => (
    <a
      className={cn(
        'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring',
        className,
      )}
      {...props}
    >
      {children}
    </a>
  ),
  // a wide table scrolls in place instead of widening the page
  table: ({ node: _node, ...props }) => (
    <div data-slot="markdown-table" className="mb-[1em] overflow-x-auto">
      <table {...props} />
    </div>
  ),
};

type MarkdownProps = Omit<React.ComponentProps<'div'>, 'children'> & {
  /** the Markdown source */
  children: string;
  /** element renderers, merged over the defaults */
  components?: Components;
  /** more remark plugins, after remark-gfm */
  remarkPlugins?: Options['remarkPlugins'];
  rehypePlugins?: Options['rehypePlugins'];
  /** override react-markdown's URL check (it already drops unsafe protocols) */
  urlTransform?: Options['urlTransform'];
};

function Markdown({ children, components, remarkPlugins = [], rehypePlugins, urlTransform, className, ...props }: MarkdownProps) {
  const merged = React.useMemo(() => ({ ...defaultComponents, ...components }), [components]);
  return (
    <div data-slot="markdown" className={cn('govwell-prose text-foreground', className)} {...props}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, ...(remarkPlugins ?? [])]}
        rehypePlugins={rehypePlugins}
        components={merged}
        skipHtml
        {...(urlTransform ? { urlTransform } : {})}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

export { Markdown, type MarkdownProps };
