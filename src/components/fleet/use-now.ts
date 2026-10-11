"use client";

import { useEffect, useState } from "react";

/**
 * A clock that ticks only while something is live.
 *
 * Reading `Date.now()` during render makes a component non-idempotent — the
 * same props produce a different tree on every re-render — so elapsed time
 * comes from state that advances on an interval and freezes when the thing
 * being timed has stopped.
 */
export function useNow(active: boolean, intervalMs = 500): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return;
    // The interval is the only writer. Setting the time in the effect body too
    // would cost a second render on every activation to gain at most one
    // interval's worth of freshness on a duration readout.
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [active, intervalMs]);

  return now;
}
