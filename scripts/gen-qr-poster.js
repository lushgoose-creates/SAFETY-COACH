const QRCode = require('qrcode');
const fs = require('fs');

const lang = process.argv[2] === 'zh' ? 'zh' : 'en';
const base = 'https://safety-coach-production.up.railway.app';
const machines = [
  { id: 'lathe', en: 'Lathe', zh: '车床', descEn: 'Metalworking lathe', descZh: '金属切削车床' },
  { id: 'drill-press', en: 'Drill Press', zh: '钻床', descEn: 'Bench drill press', descZh: '台式钻床' }
];

const t = {
  en: {
    brand: 'Scan Safety Coach', tagline: 'Scan the code. Stay safe.',
    headline: 'A 60-second safety check before you touch the machine.',
    sub: 'Students scan a QR code on any machine, get an AI safety briefing, ask questions with rule citations, and pass a quick quiz — all from their phone. Instructors see who passed, live.',
    feat: ['60-second AI safety briefing with rule citations', 'Ask questions — refuses unsafe actions', '3-question quiz, server-graded, pass/fail badge', 'Instructor dashboard with stats & CSV export'],
    scan: 'Scan a code with your phone camera — no app needed',
    appBrand: 'Scan Safety Coach', appTitle: 'Lathe', appDesc: 'Metalworking lathe · Spindle & chuck',
    briefTitle: '60-second briefing', briefTag: 'SOP',
    brief1: 'No gloves near rotating parts; tie back hair and fasten sleeves.',
    brief2: 'Remove the chuck key before starting the spindle.',
    brief3: 'Stop fully before clearing chips with a hook.',
    passBadge: 'PASSED', passTitle: 'All 3 answers correct', passText: 'Cleared to operate the Lathe',
    qrTitle: { en: 'Lathe', zh: '车床' }
  },
  zh: {
    brand: '扫码安全官', tagline: '扫码即问，安全上岗。',
    headline: '触碰设备前，60 秒完成安全检查。',
    sub: '学生扫描设备上的二维码，即可获得 AI 安全简报、按规则引用回答问题、并通过快速测验——全部在手机上完成。教师可实时查看通过情况。',
    feat: ['60 秒 AI 安全简报，附带规则引用', '支持提问，对危险操作明确拒绝', '三题小测，服务端评分，通过/未通过徽章', '教师仪表盘：统计与 CSV 导出'],
    scan: '用手机相机扫码，无需安装 App',
    appBrand: '扫码安全官', appTitle: '车床', appDesc: '金属切削车床 · 主轴与卡盘',
    briefTitle: '60 秒安全简报', briefTag: '规程',
    brief1: '旋转部件附近禁止戴手套；长发盘入帽内并扣紧袖口。',
    brief2: '启动主轴前取下卡盘钥匙。',
    brief3: '完全停机后用钩具清理切屑。',
    passBadge: '已通过', passTitle: '三题全部正确', passText: '可以上岗操作车床',
    qrTitle: { en: 'Lathe', zh: '车床' }
  }
}[lang];

(async () => {
  const qrs = [];
  for (const m of machines) {
    const url = `${base}/m/${m.id}?lang=${lang}`;
    const dataUrl = await QRCode.toDataURL(url, { width: 300, margin: 2 });
    qrs.push({ name: lang === 'en' ? m.en : m.zh, sub: lang === 'en' ? m.zh : m.en, desc: lang === 'en' ? m.descEn : m.descZh, dataUrl });
  }
  const qrCards = qrs.map(m => `
    <div class="qr-card">
      <img src="${m.dataUrl}" alt="${m.name} QR"/>
      <div class="qr-meta"><strong>${m.name}</strong><span>${m.sub}</span></div>
    </div>`).join('');
  const feats = t.feat.map((f, i) => `<div class="feat"><span class="dot">${i + 1}</span>${f}</div>`).join('');
  const ruleBadge = lang === 'en' ? '[Rule 3]' : '【规则3】';
  const ruleBadge2 = lang === 'en' ? '[Rule 8]' : '【规则8】';
  const ruleBadge3 = lang === 'en' ? '[Rule 14]' : '【规则14】';

  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: system-ui, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', Roboto, Arial, sans-serif; background: #0b1120; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
.poster { width: 1100px; background: linear-gradient(150deg, #111827 0%, #0b1120 100%); border-radius: 28px; padding: 44px 52px; box-shadow: 0 30px 80px rgba(0,0,0,.6); display: flex; gap: 40px; align-items: stretch; }
.left { flex: 1; display: flex; flex-direction: column; justify-content: center; }
.brand { display: flex; align-items: center; gap: 14px; margin-bottom: 10px; }
.logo { width: 52px; height: 52px; border-radius: 14px; background: linear-gradient(135deg,#22c55e,#15803d); display:flex; align-items:center; justify-content:center; font-size: 28px; }
.brand h1 { font-size: 28px; font-weight: 800; }
.brand h1 span { color: #22c55e; }
.tagline { color: #94a3b8; font-size: 15px; margin-bottom: 28px; }
.headline { font-size: 34px; font-weight: 800; line-height: 1.15; margin-bottom: 14px; letter-spacing: -0.5px; }
.headline em { color: #22c55e; font-style: normal; }
.sub { color: #cbd5e1; font-size: 16px; line-height: 1.6; margin-bottom: 28px; }
.features { display: flex; flex-direction: column; gap: 12px; margin-bottom: 32px; }
.feat { display: flex; align-items: center; gap: 12px; font-size: 15px; color: #e2e8f0; }
.feat .dot { width: 22px; height: 22px; border-radius: 50%; background: rgba(34,197,94,.15); color: #22c55e; display:flex; align-items:center; justify-content:center; font-size: 13px; font-weight: 700; flex-shrink: 0; }
.qr-row { display: flex; gap: 20px; }
.qr-card { background: #fff; border-radius: 14px; padding: 14px; width: 160px; text-align: center; }
.qr-card img { width: 100%; height: auto; display: block; border-radius: 6px; }
.qr-meta { margin-top: 10px; color: #1e293b; display: flex; flex-direction: column; }
.qr-meta strong { font-size: 15px; }
.qr-meta span { font-size: 12px; color: #64748b; }
.right { width: 340px; display: flex; align-items: center; justify-content: center; }
.phone { width: 300px; background: #000; border-radius: 38px; padding: 12px; box-shadow: 0 20px 50px rgba(34,197,94,.25), 0 0 0 2px #1f2937; }
.screen { background: #f8fafc; border-radius: 28px; overflow: hidden; color: #1e293b; }
.app-head { background: #1f2937; color: #fff; padding: 14px 16px 12px; }
.app-brand { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; }
.app-brand .badge { width: 18px; height: 18px; border-radius: 5px; background: #22c55e; display:flex; align-items:center; justify-content:center; font-size: 11px; }
.app-brand .en { color: #9ca3af; font-weight: 400; font-size: 10px; }
.app-machine { font-size: 20px; font-weight: 800; margin-top: 8px; }
.app-desc { font-size: 10px; color: #9ca3af; margin-top: 2px; }
.steps { display: flex; gap: 4px; padding: 10px 16px; background: #f1f5f9; }
.step { flex: 1; height: 4px; border-radius: 2px; background: #e2e8f0; }
.step.on { background: #22c55e; }
.briefing { padding: 14px 16px; }
.brief-title { font-size: 12px; font-weight: 700; color: #0f172a; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
.brief-title .sec { background: #22c55e; color: #fff; font-size: 9px; padding: 2px 6px; border-radius: 4px; font-weight: 700; }
.brief-item { font-size: 11px; color: #334155; padding: 8px 10px; background: #fff; border-left: 3px solid #22c55e; border-radius: 6px; margin-bottom: 7px; line-height: 1.45; box-shadow: 0 1px 3px rgba(0,0,0,.05); }
.pass-card { margin: 14px 16px 18px; background: linear-gradient(135deg,#dcfce7,#bbf7d0); border: 2px solid #22c55e; border-radius: 16px; padding: 18px; text-align: center; }
.pass-badge { display: inline-block; background: #22c55e; color: #fff; font-size: 12px; font-weight: 800; padding: 5px 14px; border-radius: 20px; margin-bottom: 8px; letter-spacing: .5px; }
.pass-card h4 { font-size: 17px; font-weight: 800; color: #14532d; margin-bottom: 4px; }
.pass-card p { font-size: 11px; color: #166534; }
.scan-hint { text-align: center; margin-top: 16px; font-size: 12px; color: #94a3b8; }
.scan-hint strong { color: #22c55e; }
</style></head><body>
<div class="poster">
  <div class="left">
    <div class="brand"><div class="logo">🛡</div><h1>${t.brand}</h1></div>
    <p class="tagline">${t.tagline}</p>
    <p class="headline">${t.headline}</p>
    <p class="sub">${t.sub}</p>
    <div class="features">${feats}</div>
    <div class="qr-row">${qrCards}</div>
    <p class="scan-hint">📷 <strong>${t.scan}</strong></p>
  </div>
  <div class="right">
    <div class="phone">
      <div class="screen">
        <div class="app-head">
          <div class="app-brand"><span class="badge">🛡</span> ${t.appBrand}</div>
          <div class="app-machine">${t.appTitle}</div>
          <div class="app-desc">${t.appDesc}</div>
        </div>
        <div class="steps"><div class="step on"></div><div class="step on"></div><div class="step on"></div><div class="step on"></div><div class="step on"></div></div>
        <div class="briefing">
          <div class="brief-title">${t.briefTitle} <span class="sec">${t.briefTag}</span></div>
          <div class="brief-item">${t.brief1} <b>${ruleBadge}</b></div>
          <div class="brief-item">${t.brief2} <b>${ruleBadge2}</b></div>
          <div class="brief-item">${t.brief3} <b>${ruleBadge3}</b></div>
        </div>
        <div class="pass-card">
          <span class="pass-badge">✓ ${t.passBadge}</span>
          <h4>${t.passTitle}</h4>
          <p>${t.passText}</p>
        </div>
      </div>
    </div>
  </div>
</div>
</body></html>`;
  const out = `qr-poster-${lang}.html`;
  fs.writeFileSync(out, html);
  console.log(out + ' written');
})().catch(e => { console.error(e); process.exit(1); });
