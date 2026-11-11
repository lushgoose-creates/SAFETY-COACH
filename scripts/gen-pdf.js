const puppeteer = require('puppeteer-core');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const base = 'http://localhost:3000/qr?lang=';
const langs = [
  { code: 'en', out: 'qr-poster-en.pdf' },
  { code: 'zh', out: 'qr-poster-zh.pdf' }
];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });
  for (const { code, out } of langs) {
    const page = await browser.newPage();
    // Use screen CSS so the dark header + safety stripe + both cards render exactly like the live page
    await page.emulateMediaType('screen');
    await page.setViewport({ width: 1100, height: 800 });
    await page.goto(base + code, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.qr-card img', { timeout: 10000 });
    // Let fonts/images settle
    await new Promise(r => setTimeout(r, 400));
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    await page.pdf({
      path: out,
      width: '1100px',
      height: `${height + 40}px`,
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' }
    });
    console.log(out + ' generated (' + (height + 40) + 'px tall)');
    await page.close();
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
