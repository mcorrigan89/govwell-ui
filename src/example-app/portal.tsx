import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowLeft, BookOpen, ChevronDown, CircleAlert, House, IdCard, Map as MapIcon, Wrench } from 'lucide-react';

import { Button, buttonVariants } from '@/components/ui/button';
import { GovWellLogo } from '@/components/ui/flag-mark';
import { SegmentedControl, SegmentedControlItem } from '@/components/ui/segmented-control';

import { AiChatSparkIcon, LanguageIcon, SendIcon } from './icons';

// A sample of a town's public portal on GovWell, laid out like a live one: a
// Slate header with the town's name and Sign in, a hero with the town's AI
// ("What can we help with?") over an aerial photo of the town, the online services
// as cards, and a footer with who to call. It's set as the City of
// Twinsburg, Ohio, with the city's logo and the public contacts its live
// portal lists. Nothing is sent; buttons say so. Open it with ?example=portal.

const CITY = { name: 'City of Twinsburg', state: 'OH', short: 'Twinsburg' };

const SERVICES: { icon: ReactNode; title: string; description: string }[] = [
  {
    icon: <House />,
    title: 'Building Permits',
    description:
      'Apply for a building permit. Projects may include new construction, additions, remodels, or trade work like electrical, plumbing, or mechanical.',
  },
  { icon: <IdCard />, title: 'Business Licenses', description: 'Apply for, renew, and manage all business and professional licenses.' },
  {
    icon: <CircleAlert />,
    title: 'Code Complaint',
    description:
      'Submit a complaint to report potential code violations affecting property maintenance, zoning, safety, or nuisance issues in your area.',
  },
  {
    icon: <Wrench />,
    title: 'Contractor Registration',
    description: 'Register as a contractor to meet local requirements before performing work or applying for permits.',
  },
  {
    icon: <MapIcon />,
    title: 'Planning & Zoning Applications',
    description:
      'Submit a Planning & Zoning application. This is required for land use changes, site developments, subdivisions, or requests such as variances and conditional uses.',
  },
  { icon: <BookOpen />, title: 'Public Dashboards', description: 'Search for Addresses, Parcels, and Contractor Registrations' },
];

const PROMPTS = [
  'Help me find the right form',
  'What things can you help me with?',
  'Look up a record',
  'Ask questions about codes',
  'Estimate fees for my project',
];

const CONTACTS = [
  { team: 'Building Department', email: 'Bdinfo@twinsburg.oh.us', phone: '330-963-6270' },
  { team: 'Planning and Zoning', email: 'zoning@twinsburg.oh.us', phone: '330-486-1387' },
];

const link =
  'underline decoration-1 underline-offset-4 outline-none hover:decoration-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-hope';

export function SamplePortal() {
  const id = useId();
  const [question, setQuestion] = useState('');
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const [note, setNote] = useState<string | null>(null);
  // the card hangs from the photo's bottom edge by its middle: the space above it
  // is the photo's height less half the card's, measured as the card grows
  const card = useRef<HTMLFormElement>(null);
  const [cardHalf, setCardHalf] = useState(180);
  useEffect(() => {
    const el = card.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const measure = new ResizeObserver(() => setCardHalf(el.offsetHeight / 2));
    measure.observe(el);
    return () => measure.disconnect();
  }, []);
  const town = CITY.short;

  const ask = (text: string) => {
    if (!text.trim()) return;
    setNote(`In GovWell, ${town} AI would answer “${text.trim()}” here. This sample doesn’t send anything.`);
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    ask(question);
  };
  const notHere = (what: string) => setNote(`${what} opens in GovWell. This sample doesn’t include it.`);

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      {/* for the demo only, as on the other sample pages: a black bar with a
          white ghost button (Hope with black type on hover) */}
      <div className="bg-slate px-4 py-2">
        <a href="?example=app#/insights" className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'text-white' })}>
          <ArrowLeft data-icon="inline-start" /> Back
        </a>
      </div>

      {/* no fill of its own: just Sign in, over the top of the photo (pulled down
          over it by -mb-16) */}
      <header className="relative z-10 -mb-16 flex h-16 items-center justify-end gap-4 px-4 text-white md:px-6">
        <Button size="sm" className="shrink-0 bg-white text-slate hover:bg-hope hover:text-slate" onClick={() => notHere('Signing in')}>
          Sign in
        </Button>
      </header>

      <main className="flex-1">
        {/* the hero: an aerial photo of Twinsburg (--photo tall) with the ask card
            hung from its bottom edge by the card's middle */}
        <section
          aria-labelledby={`${id}-ask`}
          className="relative isolate px-4 [--photo:22rem] md:[--photo:30rem]"
          style={{ paddingTop: `max(1rem, calc(var(--photo) - ${cardHalf}px))` }}
        >
          <div className="absolute inset-x-0 top-0 -z-10 h-(--photo) overflow-hidden bg-muted">
            {/* decorative, so no alt text */}
            <img src={`${import.meta.env.BASE_URL}sample/twinsburg-aerial.jpg`} alt="" className="size-full object-cover object-top" />
            {/* a fade down from the top edge, behind Sign in and "Powered by GovWell",
                clear by 8rem, light enough for the treetops to show through */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-linear-to-b from-black/50 via-black/20 via-50% to-transparent"
            />
            {/* in the photo's top-left corner, level with Sign in, white, in GT Standard */}
            <p className="absolute top-0 left-4 flex h-16 items-center gap-2 font-sans text-xs font-light text-white md:left-6">
              Powered by <GovWellLogo title="GovWell" className="h-4 text-white" />
            </p>
          </div>
          {/* as wide as the Online Services grid below (64rem less its 1.5rem gutters) */}
          <div className="relative mx-auto max-w-[calc(64rem-3rem)]">
            {/* the card, taller than before: the page title at the top in black, then
                (after 2.5rem of room) the question, suggestions and languages */}
            <form
              ref={card}
              onSubmit={submit}
              className="flex flex-col gap-10 bg-card px-6 py-8 text-card-foreground shadow-lg md:px-10 md:py-12"
            >
              {/* the title, with the city's script wordmark (black SVG)
                  at the right, centred on the title's line; from md up, where
                  there's room beside it */}
              <div className="flex items-center justify-between gap-6">
                <h1 className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <span className="text-4xl leading-tight font-normal tracking-tight md:text-5xl">
                    {CITY.name}, {CITY.state}
                  </span>
                  <span className="text-lg font-light text-muted-foreground">Public Portal</span>
                </h1>
                <img
                  src={`${import.meta.env.BASE_URL}sample/twinsburg-logo.svg`}
                  alt="Twinsburg, Ohio"
                  className="hidden h-auto w-36 shrink-0 md:block"
                />
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <h2 id={`${id}-ask`} className="text-2xl leading-tight font-normal tracking-tight">
                    What can we help with?
                  </h2>
                  <p className="text-sm text-muted-foreground">Get instant answers from {town} AI</p>
                </div>
                <div className="flex items-center gap-2 border border-input bg-background pr-2 focus-within:border-foreground hover:border-foreground">
                  <label htmlFor={`${id}-question`} className="sr-only">
                    Your question
                  </label>
                  <input
                    id={`${id}-question`}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Type here or select below…"
                    className="h-11 min-w-0 flex-1 bg-transparent px-4 text-base font-light outline-none placeholder:text-muted-foreground"
                  />
                  <Button type="submit" size="icon-xs" aria-label="Ask" disabled={!question.trim()}>
                    <SendIcon />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {PROMPTS.map((p) => (
                    <Button key={p} type="button" variant="outline" size="xs" onClick={() => ask(p)}>
                      {p}
                    </Button>
                  ))}
                </div>
                {note && (
                  <p role="status" className="bg-sky-tint px-4 py-3 text-sm text-tint-foreground">
                    {note}
                  </p>
                )}
                <div className="flex items-center justify-end gap-3">
                  <SegmentedControl
                    aria-label="Language"
                    value={language}
                    onValueChange={setLanguage}
                    variant="underline"
                    size="sm"
                    fitContent
                  >
                    <SegmentedControlItem value="en">English</SegmentedControlItem>
                    <SegmentedControlItem value="es" lang="es">
                      Español
                    </SegmentedControlItem>
                  </SegmentedControl>
                  <Button type="button" variant="ghost" size="xs" aria-label="More languages" onClick={() => notHere('More languages')}>
                    <LanguageIcon className="size-4" /> <ChevronDown />
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </section>

        <section aria-labelledby={`${id}-services`} className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-12 md:px-6">
          <h2 id={`${id}-services`} className="text-2xl font-normal tracking-tight">
            Online Services
          </h2>
          <ul className="grid gap-4 md:grid-cols-2">
            {SERVICES.map((s) => (
              <li key={s.title}>
                <a
                  href={`#${s.title}`}
                  onClick={(e) => {
                    e.preventDefault();
                    notHere(s.title);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex h-full flex-col gap-2 border border-border bg-card p-5 text-card-foreground transition-[box-shadow,border-color,scale] duration-150 ease-out outline-none hover:scale-[1.02] hover:border-transparent hover:shadow-[0_0_10px_rgb(0_0_0/0.15)] motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring"
                >
                  <span className="flex items-center gap-3 text-lg font-normal [&_svg]:size-5 [&_svg]:shrink-0">
                    {s.icon}
                    {s.title}
                  </span>
                  <span className="pl-8 text-sm text-muted-foreground">{s.description}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      </main>

      {/* two columns: "Questions?" large on the left, who to contact on the right */}
      <footer className="bg-slate px-4 py-12 font-sans text-white md:px-6 md:py-16">
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2">
          <h2 className="text-4xl leading-tight font-normal tracking-tight md:text-5xl">Questions?</h2>
          <div className="flex flex-col gap-6 text-sm font-light">
            <p className="text-base">Reach out to our team.</p>
            <div className="grid gap-6 sm:grid-cols-2">
              {CONTACTS.map((c) => (
                <p key={c.team} className="flex flex-col gap-1">
                  <span className="font-normal">{c.team}</span>
                  <a href={`mailto:${c.email}`} className={`w-fit ${link}`}>
                    {c.email}
                  </a>
                  <span className="text-cement">{c.phone}</span>
                </p>
              ))}
            </div>
          </div>
        </div>
      </footer>

      <Button
        type="button"
        size="icon-lg"
        aria-label="Help"
        // as on the sample sign-in: black, the AI chat spark at 28px in the 56px square
        className="fixed right-6 bottom-6 shadow-lg [&_svg:not([class*='size-'])]:size-7"
        onClick={() => notHere('Help')}
      >
        <AiChatSparkIcon />
      </Button>
    </div>
  );
}
