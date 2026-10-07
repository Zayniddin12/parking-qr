import { useEffect, useRef, useState } from 'react';
import type { EventEnvelope } from './types';
import type { StreamStatus, UseEventStreamResult } from './useEventStream';

export interface UseAuthorizedEventStreamOptions<T> {
  /** Absolute SSE URL on the CORE plane, e.g.
   *  `${CORE_API_URL}/realtime/branches/{branchId}/ledger`. */
  url: string;
  /** Returns the current OIDC access token (Bearer). Called on every (re)connect
   *  so a renewed token is picked up automatically. */
  getToken?: () => string | undefined;
  /** Called for every parsed envelope. */
  onEvent?: (event: EventEnvelope<T>) => void;
  /** Cap on retained events in the returned buffer (ring). */
  bufferSize?: number;
  /** Base reconnect delay (ms); exponential backoff up to maxBackoffMs. */
  backoffMs?: number;
  maxBackoffMs?: number;
  enabled?: boolean;
}

/**
 * Authorized CORE SSE ledger stream (ARCHITECTURE §11.3).
 *
 * The browser's native `EventSource` cannot set an `Authorization` header, but
 * the Go core verifies a Bearer JWT fail-closed. So we drive the stream with
 * `fetch()` + a `ReadableStream` reader, attaching the OIDC access token as a
 * Bearer header. We own the reconnect loop with exponential backoff and replay
 * the gap on reconnect via `?last_event_id=` (the `id:` of the last frame we
 * saw), so a blipped attendant misses no vehicles. Dedupe is by `event_id`.
 */
export function useAuthorizedEventStream<T = Record<string, unknown>>(
  options: UseAuthorizedEventStreamOptions<T>,
): UseEventStreamResult<T> {
  const {
    url,
    getToken,
    onEvent,
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
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  useEffect(() => {
    if (!enabled) return;

    let disposed = false;
    let controller: AbortController | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let attempt = 0;

    const pushFrame = (raw: string) => {
      // An SSE frame is a block of lines; collect `id:` and `data:` lines.
      let dataText = '';
      let id: string | null = null;
      for (const line of raw.split('\n')) {
        if (line.startsWith('data:')) dataText += line.slice(5).trimStart();
        else if (line.startsWith('id:')) id = line.slice(3).trim();
      }
      if (id) lastEventIdRef.current = id;
      if (!dataText) return;
      let parsed: EventEnvelope<T>;
      try {
        parsed = JSON.parse(dataText) as EventEnvelope<T>;
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

    const scheduleReconnect = () => {
      if (disposed) return;
      const delay = Math.min(backoffMs * 2 ** attempt, maxBackoffMs);
      attempt += 1;
      setStatus('reconnecting');
      retryTimer = setTimeout(() => void connect(), delay);
    };

    const connect = async () => {
      if (disposed) return;
      setStatus(attempt === 0 ? 'connecting' : 'reconnecting');

      const target = new URL(url);
      if (lastEventIdRef.current) {
        target.searchParams.set('last_event_id', lastEventIdRef.current);
      }

      controller = new AbortController();
      const headers: Record<string, string> = { Accept: 'text/event-stream' };
      const token = getTokenRef.current?.();
      if (token) headers.Authorization = `Bearer ${token}`;

      try {
        const res = await fetch(target.toString(), {
          headers,
          signal: controller.signal,
          credentials: 'include',
        });
        if (!res.ok || !res.body) {
          scheduleReconnect();
          return;
        }

        attempt = 0;
        setStatus('open');

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          // SSE frames are separated by a blank line.
          let sep: number;
          while ((sep = buffer.indexOf('\n\n')) !== -1) {
            const frame = buffer.slice(0, sep);
            buffer = buffer.slice(sep + 2);
            pushFrame(frame);
          }
        }
        // Server closed the stream cleanly → reconnect.
        scheduleReconnect();
      } catch {
        if (disposed) return;
        scheduleReconnect();
      }
    };

    void connect();

    return () => {
      disposed = true;
      if (retryTimer) clearTimeout(retryTimer);
      controller?.abort();
      setStatus('closed');
    };
  }, [url, enabled, bufferSize, backoffMs, maxBackoffMs]);

  return { events, status, lastEventId: lastEventIdRef.current };
}
