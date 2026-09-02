import { useEffect, useRef, useState, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';
import { getRaceConnection } from '../services/signalr';
import { publicApi } from '../services/raceApi';
import type { PublicRaceStateDto } from '../types';
import { useServerClock } from './useServerClock';

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

/**
 * Central hook for the public race experience. Handles:
 * - Initial REST fetch (so the page has data before SignalR connects)
 * - SignalR subscription for RaceScheduled/RaceStarted/RaceState/RaceFinished/ViewerCountChanged
 * - Reconnection with automatic resync (RequestState) so refresh/disconnect never
 *   restarts the race - it always continues from server-calculated elapsed time.
 */
export function useRaceConnection() {
  const [race, setRace] = useState<PublicRaceStateDto | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [viewerCount, setViewerCount] = useState(0);
  const { getServerNow, setOffsetFromServerTimestamp } = useServerClock();
  const connRef = useRef<signalR.HubConnection | null>(null);

  const applyState = useCallback((state: PublicRaceStateDto) => {
    setOffsetFromServerTimestamp(state.serverTimeUtc);
    setRace(state);
    setViewerCount(state.viewerCount);
  }, [setOffsetFromServerTimestamp]);

  useEffect(() => {
    let mounted = true;

    // 1) Initial snapshot via REST so first paint has real data
    publicApi.getCurrentRace().then((state) => {
      if (mounted) applyState(state);
    }).catch(() => { /* no races yet - fine */ });

    // 2) SignalR live sync
    const conn = getRaceConnection();
    connRef.current = conn;

    conn.on('RaceScheduled', (state: PublicRaceStateDto) => applyState(state));
    conn.on('RaceStarted', (state: PublicRaceStateDto) => applyState(state));
    conn.on('RaceState', (state: PublicRaceStateDto) => applyState(state));
    conn.on('RaceFinished', (state: PublicRaceStateDto) => applyState(state));
    conn.on('RaceCancelled', (state: PublicRaceStateDto) => applyState(state));
    conn.on('ViewerCountChanged', (count: number) => setViewerCount(count));

    conn.onreconnecting(() => setStatus('reconnecting'));
    conn.onreconnected(() => {
      setStatus('connected');
      // Resync immediately on reconnect - never trust stale local state
      conn.invoke('RequestState').catch(() => {});
    });
    conn.onclose(() => setStatus('disconnected'));

    if (conn.state === signalR.HubConnectionState.Disconnected) {
      setStatus('connecting');
      conn.start()
        .then(() => setStatus('connected'))
        .catch(() => setStatus('disconnected'));
    } else if (conn.state === signalR.HubConnectionState.Connected) {
      setStatus('connected');
    }

    return () => {
      mounted = false;
      conn.off('RaceScheduled');
      conn.off('RaceStarted');
      conn.off('RaceState');
      conn.off('RaceFinished');
      conn.off('RaceCancelled');
      conn.off('ViewerCountChanged');
    };
  }, [applyState]);

  return { race, status, viewerCount, getServerNow };
}
