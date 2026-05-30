"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="grid min-h-[60vh] place-items-center px-4 text-center">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-2xl font-display text-navy">Something went wrong</h1>
        <p className="max-w-md text-muted">Please try again. If it keeps happening, contact support.</p>
        {error.digest && <p className="font-mono text-xs text-muted">Ref: {error.digest}</p>}
        <button onClick={reset} className="mt-2 inline-flex h-11 items-center rounded-r-md bg-navy px-6 text-sm font-medium text-white hover:bg-navy-2">
          Try again
        </button>
      </div>
    </div>
  );
}
