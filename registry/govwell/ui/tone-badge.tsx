import * as React from 'react';

import { Badge } from '@/components/ui/badge';

// A status badge picked by tone rather than by colour, so a screen can map
// its states (granted, pending, revoked) onto a few meanings. It is the
// square GovWell <Badge> in eyebrow type: a hairline outline for normal,
// solid Field for done, solid amber for waiting, solid red for attention,
// Ash for inactive.
//
// It also takes the older signal-tone names, so screens written against them
// keep working: phosphor (normal), ok, system (waiting), signal (attention)
// and dim (inactive). `glow` is accepted and ignored: GovWell has no glow.
//
//   <ToneBadge tone="warning">Awaiting payment</ToneBadge>

const TONE_VARIANT = {
  neutral: 'outline',
  ok: 'ok',
  info: 'info',
  // waiting on someone: Gold Standard's light tint, as on an orange status
  warning: 'default',
  destructive: 'destructive',
  muted: 'groundwork',
  // the signal-tone names
  phosphor: 'outline',
  system: 'default',
  signal: 'destructive',
  dim: 'groundwork',
} as const;

type Tone = keyof typeof TONE_VARIANT;

function ToneBadge({
  tone = 'neutral',
  glow: _glow,
  className,
  ...props
}: React.ComponentProps<typeof Badge> & {
  tone?: Tone;
  /** kept for compatibility; has no effect */
  glow?: boolean;
}) {
  return <Badge data-tone={tone} variant={TONE_VARIANT[tone] ?? 'outline'} className={className} {...props} />;
}

export { ToneBadge, type Tone };
