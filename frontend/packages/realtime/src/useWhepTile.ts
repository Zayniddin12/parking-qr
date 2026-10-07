import { useEffect, useRef, useState } from 'react';
import { WhepPlayer, type WhepStatus } from './whep';

export interface UseWhepTileOptions {
  endpoint: string;
  iceServers?: RTCIceServer[];
  /** Only start the live session when this tile is promoted (never N at once). */
  enabled?: boolean;
}

/**
 * Bind a WHEP live session to a <video> ref. Returns the ref + status.
 * Promote-to-live pattern: pass `enabled` to control when the session opens so
 * the booth never holds more live PeerConnections than tiles in view
 * (ARCHITECTURE §11.2).
 */
export function useWhepTile(options: UseWhepTileOptions) {
  const { endpoint, iceServers, enabled = true } = options;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [status, setStatus] = useState<WhepStatus>('idle');

  useEffect(() => {
    if (!enabled || !videoRef.current) return;
    const player = new WhepPlayer({
      endpoint,
      video: videoRef.current,
      iceServers,
      onStatus: setStatus,
    });
    const controller = new AbortController();
    player.start(controller.signal).catch(() => setStatus('failed'));
    return () => {
      controller.abort();
      void player.stop();
    };
  }, [endpoint, iceServers, enabled]);

  return { videoRef, status };
}
