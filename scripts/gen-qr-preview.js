const QRCode = require('qrcode');
const fs = require('fs');

const base = 'https://safety-coach-production.up.railway.app';
const machines = [
  { id: 'lathe', name: 'Lathe', nameZh: '车床', desc: 'Metalworking lathe | Rotating spindle and chuck operations' },
  { id: 'drill-press', name: 'Drill Press', nameZh: '钻床', desc: 'Bench drill press | Rotating drill bit and workpiece clamping' }
];

(async () => {
  const cards = [];
  for (const m of machines) {
    const url = `${base}/m/${m.id}?lang=en`;
    const dataUrl = await QRCode.toDataURL(url, { width: 480, margin: 2 });
    cards.push(
      `<div class="card"><div class="qr"><img src="${dataUrl}" alt="QR ${m.id}"/></div>` +
      `<h2>${m.name} <span class="zh">${m.nameZh}</span></h2>` +
      `<p class="desc">${m.desc}</p>` +
      `<p class="url">${url}</p></div>`
    );
  }
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0;padding:40px;background:#f4f6f8;font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;color:#1a1a1a;display:flex;gap:32px;justify-content:center;flex-wrap:wrap}
.card{background:#fff;border:1px solid #d9dee3;border-radius:16px;padding:28px;width:320px;box-shadow:0 8px 24px rgba(0,0,0,.08);text-align:center}
.qr{background:#fff;border-radius:12px;padding:12px;margin-bottom:16px}
.qr img{width:100%;height:auto;display:block}
h2{margin:0 0 8px;font-size:22px}
.zh{color:#6b7280;font-weight:400;font-size:18px}
.desc{margin:0 0 12px;color:#4b5563;font-size:14px;line-height:1.5}
.url{margin:0;font-size:11px;color:#9ca3af;word-break:break-all;font-family:monospace}
</style></head><body>${cards.join('')}</body></html>`;
  fs.writeFileSync('qr-cards-preview.html', html);
  console.log('qr-cards-preview.html written');
})().catch(e => { console.error(e); process.exit(1); });
