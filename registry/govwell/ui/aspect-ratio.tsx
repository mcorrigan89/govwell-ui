import * as React from 'react';

import { cn } from '@/lib/utils';

// Holds its content to a fixed shape — ratio={16 / 9} for a photo of the
// site, ratio={1} for a parcel map tile — whatever the width.

function AspectRatio({ ratio, className, ...props }: React.ComponentProps<'div'> & { ratio: number }) {
  return (
    <div
      data-slot="aspect-ratio"
      style={{ '--ratio': ratio } as React.CSSProperties}
      className={cn('relative aspect-(--ratio)', className)}
      {...props}
    />
  );
}

export { AspectRatio };
