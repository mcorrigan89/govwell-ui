'use client';

import * as React from 'react';

// Renders its children only in the browser, after hydration; the server (and
// the hydrating pass) render `fallback`. Leaflet touches `window` when it is
// imported, so in a server-rendered app the map components are lazy-loaded
// behind this, or the server throws `window is not defined`:
//
//   const PermitMap = React.lazy(() => import('./permit-map'));
//
//   <ClientOnly fallback={<Skeleton className="h-80" />}>
//     <React.Suspense fallback={<Skeleton className="h-80" />}>
//       <PermitMap />
//     </React.Suspense>
//   </ClientOnly>

const subscribe = () => () => {};

/** true in the browser once hydrated; false on the server and while hydrating */
function useIsClient() {
  return React.useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

function ClientOnly({ children, fallback = null }: { children?: React.ReactNode; fallback?: React.ReactNode }) {
  return <>{useIsClient() ? children : fallback}</>;
}

export { ClientOnly, useIsClient };
