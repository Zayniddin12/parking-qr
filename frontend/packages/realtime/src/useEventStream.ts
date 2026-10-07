import { useEffect, useRef, useState } from 'react';
import type { EventEnvelope } from './types';

export type StreamStatus = 'connecting' | 'open' | 'reconnecting' | 'closed';

export interface UseEventStreamOptions<T> {
  /** Absolute SSE URL on the CORE plane, e.g.
   *  `${CORE_API_URL}/realtime/branches/{branchId}/ledger`. */
  url: string;
  /** Called for every parsed envelope, newest first at the UI layer. */
  onEvent?: (event: EventEnvelope<T>) => void;
  /** Send the HttpOnly session cookie with the stream request. */
  withCredentials?: boolean;
  /** Cap on retained events in the returned buffer (ring). */
  bufferSize?: number;
  /** Base reconnect delay (ms); exponential backoff up to maxBackoffMs. */
  backoffMs?: number;
  maxBackoffMs?: number;
  enabled?: boolean;
}

export interface UseEventStreamResult<T> {
  events: EventEnvelope<T>[];
  status: StreamStatus;
  lastEventId: string | null;
}

/**
 * Subscribe to the CORE SSE ledger stream with resilient reconnect.
 *
 * The browser's EventSource replays automatically via the `Last-Event-ID`
 * header, but it cannot carry custom headers and gives up after repeated
 * failures. So we own the reconnect loop: track the last `id:` we saw and pass
 * it back as `?last_event_id=` on reconnect so the edge/core can replay the gap
 * (ARCHITECTURE §11.3 — "a blipped attendant misses no vehicles"). Dedupe is by
 * `event_id` on the server; we also guard the local ring buffer.
 */
export function useEventStream<T = Record<string, unknown>>(
  options: UseEventStreamOptions<T>,
): UseEventStreamResult<T> {
  const {
    url,
    onEvent,
    withCredentials = true,
    bufferSize = 200,
    backoffMs = 1000,
    maxBackoffMs = 15000,
    enabled = true,
  } = options;

  const [events, setEvents] = useState<EventEnvelope<T>[]>([]);
  const [status, setStatus] = useState<StreamStatus>('closed');
  const lastEventIdRef = useRef<string | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!enabled) return;

    let source: EventSource | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let attempt = 0;
    let disposed = false;

    const connect = () => {
      if (disposed) return;
      setStatus(attempt === 0 ? 'connecting' : 'reconnecting');

      const target = new URL(url);
      if (lastEventIdRef.current) {
        target.searchParams.set('last_event_id', lastEventIdRef.current);
      }

      source = new EventSource(target.toString(), { withCredentials });

      source.onopen = () => {
        attempt = 0;
        setStatus('open');
      };

      source.onmessage = (msg: MessageEvent<string>) => {
        if (msg.lastEventId) lastEventIdRef.current = msg.lastEventId;
        let parsed: EventEnvelope<T>;
        try {
          parsed = JSON.parse(msg.data) as EventEnvelope<T>;
        } catch {
          return; // ignore malformed frame; keep the stream alive
        }
        onEventRef.current?.(parsed);
        setEvents((prev) => {
          if (prev.some((e) => e.event_id === parsed.event_id)) return prev; // dedupe
          const next = [parsed, ...prev];
          return next.length > bufferSize ? next.slice(0, bufferSize) : next;
        });
      };

      source.onerror = () => {
        source?.close();
        if (disposed) return;
        const delay = Math.min(backoffMs * 2 ** attempt, maxBackoffMs);
        attempt += 1;
        setStatus('reconnecting');
        retryTimer = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      disposed = true;
      if (retryTimer) clearTimeout(retryTimer);
      source?.close();
      setStatus('closed');
    };
  }, [url, withCredentials, bufferSize, backoffMs, maxBackoffMs, enabled]);

  return { events, status, lastEventId: lastEventIdRef.current };
}
