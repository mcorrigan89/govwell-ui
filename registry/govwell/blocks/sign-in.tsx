'use client';

import { useId, useState, type FormEvent, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { GovWellLogo } from '@/components/ui/flag-mark';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

// The sign-in page, in GovWell's look: the brand's base grid behind a single
// white, square card with an Ash hairline, the GovWell logo above it, a
// Regular title and a Hope button for the one thing to do. Email and
// password, or an emailed link — the caller does the work. Throw from
// onPassword/onEmailLink to show a message; return a string from onEmailLink
// to say what happened ("Check your email").
//
// `organization` names whose sign-in this is (a city's portal), shown under
// the logo. `page={false}` drops the full-screen grid so the card can sit
// inside your own layout.

export function SignIn({
  title = 'Sign in',
  description,
  organization,
  logo,
  onPassword,
  onEmailLink,
  forgotHref,
  extra,
  footer,
  page = true,
  className,
}: {
  title?: string;
  /** a line under the title */
  description?: ReactNode;
  /** whose sign-in this is, under the logo (e.g. "City of Ashford") */
  organization?: ReactNode;
  /** replaces the GovWell logo above the card */
  logo?: ReactNode;
  onPassword?: (email: string, password: string) => Promise<void>;
  onEmailLink?: (email: string) => Promise<string | void>;
  forgotHref?: string;
  /** more ways in, under the form (e.g. "Continue with Microsoft") */
  extra?: ReactNode;
  /** small print under the card (help, terms) */
  footer?: ReactNode;
  /** fill the screen with the base grid and centre the card; default true */
  page?: boolean;
  className?: string;
}) {
  const id = useId();
  const [mode, setMode] = useState<'password' | 'link'>(onPassword ? 'password' : 'link');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === 'password') await onPassword?.(email, password);
      else setSent((await onEmailLink?.(email)) || 'Check your email for a sign-in link.');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
    setBusy(false);
  };

  const card = (
    <div data-slot="sign-in" className={cn('mx-auto w-full max-w-md space-y-8', className)}>
      <div className="flex flex-col items-center gap-3 text-foreground">
        {logo ?? <GovWellLogo title="GovWell" className="h-7" />}
        {organization && <p className="text-muted-foreground">{organization}</p>}
      </div>
      <form onSubmit={submit} aria-labelledby={`${id}-title`} className="space-y-6 border border-border bg-card p-8 text-card-foreground">
        <div className="space-y-2">
          <h1 id={`${id}-title`} className="text-3xl leading-tight font-normal tracking-tight">
            {title}
          </h1>
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
        {sent ? (
          <p role="status" className="bg-field-tint px-4 py-3 text-tint-foreground">
            {sent}
          </p>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor={`${id}-email`}>Email</Label>
              <Input
                id={`${id}-email`}
                type="email"
                autoComplete="email"
                required
                value={email}
                aria-invalid={error ? true : undefined}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {mode === 'password' && (
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <Label htmlFor={`${id}-password`}>Password</Label>
                  {forgotHref && (
                    <a
                      href={forgotHref}
                      className="text-sm text-muted-foreground underline decoration-1 underline-offset-4 outline-none hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring"
                    >
                      Forgot it?
                    </a>
                  )}
                </div>
                <Input
                  id={`${id}-password`}
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  aria-invalid={error ? true : undefined}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}
            {error && (
              <p role="alert" className="text-sm font-normal text-error">
                {error}
              </p>
            )}
            <div className="space-y-3">
              <Button type="submit" className="w-full" disabled={busy}>
                {mode === 'password' ? (busy ? 'Signing in…' : 'Sign in') : busy ? 'Sending…' : 'Email me a sign-in link'}
              </Button>
              {onPassword && onEmailLink && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setError(null);
                    setMode(mode === 'password' ? 'link' : 'password');
                  }}
                >
                  {mode === 'password' ? 'Email me a link instead' : 'Use my password instead'}
                </Button>
              )}
              {extra}
            </div>
          </>
        )}
      </form>
      {footer && <div className="text-center text-sm text-muted-foreground">{footer}</div>}
    </div>
  );

  if (!page) return card;
  return <div className="flex min-h-screen items-center justify-center bg-background base-grid px-4 py-12">{card}</div>;
}
