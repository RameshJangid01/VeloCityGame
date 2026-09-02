import { useEffect, useRef, useState } from 'react';
import { publicApi } from '../services/raceApi';

/**
 * Periodically syncs with the server clock and exposes a function that
 * returns the current best-estimate SERVER time. We never trust the
 * user's local clock for race timing decisions - only the offset
 * between local time and server time, refreshed regularly.
 */
export function useServerClock(resyncIntervalMs = 30000) {
  const offsetMsRef = useRef(0); // serverNow - localNow
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function sync() {
      try {
        const before = Date.now();
        const { serverTimeUtc } = await publicApi.getServerTime();
        const after = Date.now();
        const roundTrip = after - before;
        const serverMs = new Date(serverTimeUtc).getTime() + roundTrip / 2;
        if (!cancelled) {
          offsetMsRef.current = serverMs - after;
          setReady(true);
        }
      } catch {
        // Keep previous offset (or 0) if sync fails; SignalR RaceState
        // messages also carry server time and will correct drift.
      }
    }

    sync();
    const interval = setInterval(sync, resyncIntervalMs);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [resyncIntervalMs]);

  function getServerNow(): Date {
    return new Date(Date.now() + offsetMsRef.current);
  }

  function setOffsetFromServerTimestamp(serverTimeIso: string) {
    offsetMsRef.current = new Date(serverTimeIso).getTime() - Date.now();
  }

  return { ready, getServerNow, setOffsetFromServerTimestamp };
}
