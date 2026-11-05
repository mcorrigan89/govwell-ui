import * as React from 'react';

import { cn } from '@/lib/utils';

// Search matches marked in text: each match on a Hope tint with Slate type,
// in the text's own weight (never bold, never yellow highlighter). Matching
// ignores case and takes several terms at once, longest first, so "fire
// separation" wins over "fire". Text is always rendered as text, never HTML.
// `snippet` trims long text to the words around the first match, with an
// ellipsis where it was cut. A server that has already marked the matches
// ("…the **garage** wall…") can pass `delimiter="**"` instead of terms.
//
//   <Highlight text={section.body} terms={['garage', 'fire separation']} snippet={60} />
//
// SearchHit is a result row built on it: a citation, a title and a snippet.

type Part = { text: string; match: boolean };

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function termsOf(terms: string | readonly string[] | undefined): string[] {
  const list = typeof terms === 'string' ? [terms] : (terms ?? []);
  const cleaned = list.map((t) => t.trim()).filter(Boolean);
  return [...new Set(cleaned)].sort((a, b) => b.length - a.length);
}

function matcher(terms: string[]) {
  return terms.length ? new RegExp(`(${terms.map(escapeRegExp).join('|')})`, 'gi') : null;
}

/** split text into matched and unmatched parts */
function splitMatches(text: string, terms: string | readonly string[] | undefined): Part[] {
  const re = matcher(termsOf(terms));
  if (!re) return [{ text, match: false }];
  // with one capture group, split puts the matches at the odd indexes
  return text
    .split(re)
    .map((part, i) => ({ text: part, match: i % 2 === 1 }))
    .filter((p) => p.text !== '');
}

/** split text whose matches are already wrapped in a delimiter ("…the **garage** wall…") */
function splitDelimited(text: string, delimiter: string): Part[] {
  return text
    .split(delimiter)
    .map((part, i) => ({ text: part, match: i % 2 === 1 }))
    .filter((p) => p.text !== '');
}

/** the words around the first match, `radius` characters each side, cut on a word boundary with an ellipsis */
function snippetAround(text: string, terms: string | readonly string[] | undefined, radius = 80): string {
  const re = matcher(termsOf(terms));
  const found = re ? re.exec(text) : null;
  const at = found ? found.index : 0;
  const end0 = found ? at + found[0].length : 0;
  if (text.length <= radius * 2 + (end0 - at)) return text;
  let start = Math.max(0, at - radius);
  let end = Math.min(text.length, end0 + radius);
  // move inward to the nearest space so no word is cut in half
  if (start > 0) {
    const space = text.indexOf(' ', start);
    if (space !== -1 && space < at) start = space + 1;
  }
  if (end < text.length) {
    const space = text.lastIndexOf(' ', end);
    if (space > end0) end = space;
  }
  return `${start > 0 ? '…' : ''}${text.slice(start, end).trim()}${end < text.length ? '…' : ''}`;
}

type HighlightProps = Omit<React.ComponentProps<'span'>, 'children'> & {
  text: string;
  /** a term or terms to mark, matched ignoring case */
  terms?: string | readonly string[];
  /** the matches are already wrapped in this delimiter; `terms` is then ignored for marking */
  delimiter?: string;
  /** trim to the words around the first match: true for 80 characters each side, or a number */
  snippet?: boolean | number;
  markClassName?: string;
};

function Highlight({ text, terms, delimiter, snippet, markClassName, className, ...props }: HighlightProps) {
  let shown = text;
  if (snippet && !delimiter) shown = snippetAround(text, terms, snippet === true ? 80 : snippet);
  const parts = delimiter ? splitDelimited(shown, delimiter) : splitMatches(shown, terms);
  return (
    <span data-slot="highlight" className={className} {...props}>
      {parts.map((part, i) =>
        part.match ? (
          <mark key={i} data-slot="highlight-mark" className={cn('bg-hope-tint px-0.5 text-tint-foreground', markClassName)}>
            {part.text}
          </mark>
        ) : (
          <React.Fragment key={i}>{part.text}</React.Fragment>
        ),
      )}
    </span>
  );
}

type SearchHitProps = Omit<React.ComponentProps<'button'>, 'title'> & {
  title: string;
  /** the matching passage; trimmed around the first match */
  snippet?: string;
  terms?: string | readonly string[];
  delimiter?: string;
  /** a section number or reference, before the title: "R302.6" */
  citation?: React.ReactNode;
  /** muted text after the title: the book, "in your amendment" */
  meta?: React.ReactNode;
  /** characters each side of the match in the snippet (default 80) */
  radius?: number;
};

/** a search result row; a button, so give it onClick (or render it inside a link) */
function SearchHit({ title, snippet, terms, delimiter, citation, meta, radius = 80, className, ...props }: SearchHitProps) {
  return (
    <button
      type="button"
      data-slot="search-hit"
      className={cn(
        'flex w-full cursor-pointer flex-col gap-1 rounded-none px-3 py-2.5 text-left text-base font-light outline-none hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-40',
        className,
      )}
      {...props}
    >
      <span className="flex flex-wrap items-baseline gap-x-2">
        {/* the spaces between spans keep the accessible name readable; flex drops them from the layout */}
        {citation != null && <span className="text-sm text-muted-foreground tabular-nums">{citation}</span>}{' '}
        <span className="font-normal text-foreground">
          <Highlight text={title} terms={delimiter ? undefined : terms} />
        </span>{' '}
        {meta != null && <span className="text-sm text-muted-foreground">{meta}</span>}
      </span>{' '}
      {snippet && (
        <span className="text-sm text-muted-foreground">
          <Highlight text={snippet} terms={terms} delimiter={delimiter} snippet={delimiter ? undefined : radius} />
        </span>
      )}
    </button>
  );
}

export { Highlight, SearchHit, snippetAround, splitMatches };
