/**
 * Minimal WHEP (WebRTC-HTTP Egress Protocol) player helper for go2rtc tiles.
 *
 * Live lane view is WebRTC via WHEP served by go2rtc on each edge — H.264 RTSP
 * passthrough, zero re-encode, ~0.5s glass-to-glass (ARCHITECTURE §11.2). The
 * booth-local attendant connects direct over LAN (no TURN); remote admin routes
 * through the tunnel + coturn, so ICE servers are injected per session with
 * short-lived HMAC creds.
 *
 * WHEP handshake: POST the local SDP offer to the endpoint, receive the SDP
 * answer, DELETE the resource URL to tear down.
 */

export interface WhepPlayerOptions {
  /** go2rtc WHEP endpoint, e.g. `${WHEP_BASE_URL}/api/whep?src=enter1`. */
  endpoint: string;
  /** Target <video> element to attach the remote stream to. */
  video: HTMLVideoElement;
  /** ICE servers — empty for booth-LAN direct; coturn TURN creds for remote. */
  iceServers?: RTCIceServer[];
  onStatus?: (status: WhepStatus) => void;
}

export type WhepStatus = 'idle' | 'connecting' | 'live' | 'failed' | 'closed';

export class WhepPlayer {
  private pc: RTCPeerConnection | null = null;
  private resourceUrl: string | null = null;
  private readonly opts: WhepPlayerOptions;

  constructor(opts: WhepPlayerOptions) {
    this.opts = opts;
  }

  async start(signal?: AbortSignal): Promise<void> {
    this.opts.onStatus?.('connecting');
    const pc = new RTCPeerConnection({ iceServers: this.opts.iceServers ?? [] });
    this.pc = pc;

    // Receive-only: we consume the camera's video (+ optional audio).
    pc.addTransceiver('video', { direction: 'recvonly' });

    const remote = new MediaStream();
    pc.ontrack = (ev) => {
      remote.addTrack(ev.track);
      this.opts.video.srcObject = remote;
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') this.opts.onStatus?.('live');
      else if (pc.connectionState === 'failed') this.opts.onStatus?.('failed');
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await this.waitForIceGathering(pc);

    const res = await fetch(this.opts.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/sdp' },
      body: pc.localDescription?.sdp ?? offer.sdp,
      credentials: 'include',
      signal,
    });
    if (!res.ok) {
      this.opts.onStatus?.('failed');
      throw new Error(`WHEP handshake failed: ${res.status}`);
    }
    this.resourceUrl = res.headers.get('Location');
    const answer = await res.text();
    await pc.setRemoteDescription({ type: 'answer', sdp: answer });
  }

  /** Wait for ICE gathering to complete (non-trickle WHEP). */
  private waitForIceGathering(pc: RTCPeerConnection): Promise<void> {
    if (pc.iceGatheringState === 'complete') return Promise.resolve();
    return new Promise((resolve) => {
      const check = () => {
        if (pc.iceGatheringState === 'complete') {
          pc.removeEventListener('icegatheringstatechange', check);
          resolve();
        }
      };
      pc.addEventListener('icegatheringstatechange', check);
      // Safety timeout — don't block a tile forever on a stubborn candidate.
      setTimeout(resolve, 2000);
    });
  }

  async stop(): Promise<void> {
    if (this.resourceUrl) {
      try {
        await fetch(this.resourceUrl, { method: 'DELETE', credentials: 'include' });
      } catch {
        // best-effort teardown
      }
      this.resourceUrl = null;
    }
    this.pc?.close();
    this.pc = null;
    this.opts.video.srcObject = null;
    this.opts.onStatus?.('closed');
  }
}
