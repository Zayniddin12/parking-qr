import QRCode from 'qrcode';

/**
 * Render `text` to a self-contained SVG string (no network, no canvas) so the
 * receipt QR is crisp at any size and prints cleanly. Error-correction level M
 * tolerates a smudged thermal print; dark uses the brand ink.
 */
export function qrSvg(text: string): Promise<string> {
  return QRCode.toString(text, {
    type: 'svg',
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: '#0E1420', light: '#FFFFFF' },
  });
}
