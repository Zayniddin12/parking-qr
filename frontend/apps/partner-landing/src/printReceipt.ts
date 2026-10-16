import type { Check, PartnerAccount } from './store';

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Rasterise the QR SVG to a crisp PNG (integer module scale, no smoothing) so
 *  every printer/driver renders exactly the same, scannable code. */
async function svgToPng(svg: string, size = 360): Promise<string> {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    await new Promise<void>((ok, fail) => {
      img.onload = () => ok();
      img.onerror = () => fail(new Error('QR rasmi yuklanmadi'));
      img.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, size, size);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0, size, size);
    return canvas.toDataURL('image/png');
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Print only the receipt via an isolated iframe document (not the app page). */
export async function printReceipt(partner: PartnerAccount, check: Check, qrSvgText: string) {
  const png = await svgToPng(qrSvgText);
  const date = new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Asia/Tashkent',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(check.createdAt));

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Chek ${esc(check.id)}</title>
<style>
@page { margin: 0; }
* { box-sizing: border-box; }
html, body { width: 80mm; }
body { margin: 0; font-family: Arial, sans-serif; color: #000; background: #fff; text-align: center; }
.w { width: 70mm; margin: 0 auto; padding: 2mm 0; }
.t { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; }
.n { font-size: 14px; font-weight: bold; margin: 0.5mm 0 1mm; }
.id { font-size: 15px; font-weight: bold; letter-spacing: 1px; margin-bottom: 1mm; }
img { width: 40mm; height: 40mm; image-rendering: pixelated; display: block; margin: 0 auto; }
.r { font-size: 11px; margin-top: 1mm; }
.f { font-size: 10px; margin-top: 1.5mm; border-top: 1px dashed #000; padding-top: 1mm; }
</style></head><body><div class="w">
<div class="t">Validatsiya cheki</div>
<div class="n">${esc(partner.name)}</div>
<div class="id">${esc(check.id)}</div>
<img src="${png}" alt="QR">
<div class="r">${esc(date)}</div>
<div class="f"><b>Minor Parking uchun</b></div>
</div></body></html>`;

  const frame = document.createElement('iframe');
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  document.body.appendChild(frame);
  const doc = frame.contentDocument!;
  doc.open();
  doc.write(html);
  doc.close();
  const img = doc.querySelector('img')!;
  if (!img.complete) await new Promise((r) => ((img.onload = r), (img.onerror = r)));
  frame.contentWindow!.focus();
  frame.contentWindow!.print();
  setTimeout(() => frame.remove(), 60_000);
}
