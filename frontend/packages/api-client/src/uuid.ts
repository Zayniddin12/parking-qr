/**
 * RFC 4122 v4 UUID that also works in NON-secure contexts.
 *
 * `crypto.randomUUID()` is exposed only in secure contexts (HTTPS / localhost).
 * The attendant & kiosk surfaces are edge-served over the booth LAN — often
 * plain `http://192.168.x.x`, which is NOT a secure context. There `randomUUID`
 * is `undefined` and calling it throws, which would break `Idempotency-Key`
 * generation on every mutating request (double-send / replay protection) and
 * crash the charge / barrier-override flows.
 *
 * `crypto.getRandomValues()` IS available in insecure contexts, so we fall back
 * to it, and only degrade to `Math.random()` if Web Crypto is entirely absent
 * (idempotency keys just need to be collision-resistant, not cryptographic).
 */
export function randomId(): string {
  const c: Crypto | undefined = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') {
    try {
      return c.randomUUID();
    } catch {
      // Insecure context threw — fall through to getRandomValues.
    }
  }
  const bytes = new Uint8Array(16);
  if (c && typeof c.getRandomValues === 'function') {
    c.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40; // version 4
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80; // variant 10xx
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'));
  return (
    `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-` +
    `${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`
  );
}
