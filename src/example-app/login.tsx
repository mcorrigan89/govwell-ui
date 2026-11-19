import { useId, useState, type FormEvent } from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';

import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { AiChatSparkIcon } from './icons';

// A sample of GovWell's staff sign-in, built from the registry:
// the sign-in card (Google, Microsoft, or an email address) centred in the left
// half, over a brand photo that fills the whole page. Nothing is sent; Continue only says so. Open it
// with ?example=login; the back button returns to the sample app.

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden focusable="false" className="size-5">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.8Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.9l-3.88-3.01c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.11A12 12 0 0 0 12 24Z"
      />
      <path fill="#FBBC05" d="M5.29 14.29A7.2 7.2 0 0 1 4.91 12c0-.79.14-1.57.38-2.29V6.6H1.28a12 12 0 0 0 0 10.8l4.01-3.11Z" />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.34.61 4.59 1.8l3.44-3.44A11.53 11.53 0 0 0 12 0 12 12 0 0 0 1.28 6.6l4.01 3.11C6.23 6.86 8.88 4.75 12 4.75Z"
      />
    </svg>
  );
}

function MicrosoftMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden focusable="false" className="size-5">
      <path fill="#F25022" d="M1 1h10.5v10.5H1z" />
      <path fill="#7FBA00" d="M12.5 1H23v10.5H12.5z" />
      <path fill="#00A4EF" d="M1 12.5h10.5V23H1z" />
      <path fill="#FFB900" d="M12.5 12.5H23V23H12.5z" />
    </svg>
  );
}

const textLink =
  'text-sm text-foreground underline decoration-1 underline-offset-4 outline-none hover:decoration-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring';

export function SampleLogin() {
  const id = useId();
  const [usePhone, setUsePhone] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setStatus('This is a sample sign-in, so nothing was sent.');
  };

  return (
    <div className="relative isolate grid min-h-dvh bg-slate text-foreground md:grid-cols-2">
      {/* a GovWell brand photo, full bleed behind both halves; decorative, so no alt text */}
      <img
        src={`${import.meta.env.BASE_URL}sample/sign-in-landscape.webp`}
        alt=""
        className="absolute inset-0 -z-10 size-full object-cover"
      />

      {/* the card stays centred in the left half */}
      <main className="relative flex min-h-dvh items-center justify-center px-4 py-20">
        {/* for the demo only: a real sign-in has nowhere to go back to. A plain
            ghost button: black type reads on the photo's pale sky */}
        <a href="?example=app#/insights" className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'absolute top-4 left-4' })}>
          <ArrowLeft data-icon="inline-start" /> Back
        </a>
        <div data-slot="sample-login" className="w-full max-w-md border border-border bg-card text-card-foreground shadow-lg">
          <form onSubmit={submit} aria-labelledby={`${id}-title`} className="flex flex-col gap-6 p-8">
            <div className="flex flex-col gap-2 text-center">
              <h1 id={`${id}-title`} className="text-2xl leading-tight font-normal tracking-tight">
                Sign in to GovWell
              </h1>
              <p className="text-muted-foreground">Welcome back! Please sign in to continue</p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="relative">
                <Button type="button" variant="outline" className="w-full" onClick={() => setStatus('This is a sample sign-in.')}>
                  <GoogleMark /> Continue with Google
                </Button>
                <span className="absolute -top-3 right-2 border border-border bg-card px-2 py-0.5 text-xs text-muted-foreground">
                  Last used
                </span>
              </div>
              <Button type="button" variant="outline" className="w-full" onClick={() => setStatus('This is a sample sign-in.')}>
                <MicrosoftMark /> Continue with Microsoft
              </Button>
            </div>

            {/* a rule either side of "or", drawn rather than announced */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div aria-hidden className="h-px flex-1 bg-border" />
              or
              <div aria-hidden className="h-px flex-1 bg-border" />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-3">
                <Label htmlFor={`${id}-contact`}>{usePhone ? 'Phone number' : 'Email address'}</Label>
                <button type="button" className={textLink} onClick={() => setUsePhone((p) => !p)}>
                  {usePhone ? 'Use email' : 'Use phone'}
                </button>
              </div>
              <Input
                id={`${id}-contact`}
                key={usePhone ? 'phone' : 'email'}
                type={usePhone ? 'tel' : 'email'}
                autoComplete={usePhone ? 'tel' : 'email'}
                placeholder={usePhone ? 'Enter your phone number' : 'Enter your email address'}
                required
              />
            </div>

            <Button type="submit" className="w-full">
              Continue <ChevronRight data-icon="inline-end" />
            </Button>
            {status && (
              <p role="status" className="bg-sky-tint px-4 py-3 text-sm text-tint-foreground">
                {status}
              </p>
            )}
          </form>

          <div className="border-t border-border bg-muted px-8 py-5 text-center text-sm text-muted-foreground">
            Don’t have an account?{' '}
            <a href="#sign-up" className={textLink}>
              Sign up
            </a>
          </div>
          <div className="border-t border-border bg-muted px-8 py-4 text-center text-xs text-muted-foreground">Secured by Clerk</div>
        </div>
      </main>

      <Button
        type="button"
        size="icon-lg"
        aria-label="Help"
        // a 28px icon in the 56px square: 14px of space on every side
        className="fixed right-6 bottom-6 shadow-lg [&_svg:not([class*='size-'])]:size-7"
        onClick={() => setStatus('Help would open here.')}
      >
        <AiChatSparkIcon />
      </Button>
    </div>
  );
}
