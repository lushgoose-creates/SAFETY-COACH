require('dotenv').config();

const path = require('node:path');
const crypto = require('node:crypto');
const express = require('express');
const QRCode = require('qrcode');
const db = require('./src/db');
const { getMachine, listMachines } = require('./src/machines');
const { getBriefing, getQuiz, answerQuestion } = require('./src/safety-content');
const { getStats, attemptsCsv } = require('./src/admin');
const { isAiConfigured } = require('./src/ai');
const { language, machineView } = require('./src/language');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const RATE_LIMIT = Number(process.env.RATE_LIMIT_PER_MINUTE) || 60;
const rootDir = __dirname;

const messages = {
  zh: {
    machineNotFound: '未找到该设备，请确认二维码是否正确。', rateLimited: '提问过于频繁，请等待一分钟后再试。',
    invalidQuestion: '设备或问题无效，请输入1至300字的问题。', aiUnavailable: '安全官暂时无法连接，请稍后重试；操作前请询问指导老师。',
    invalidSubmission: '请填写有效姓名、学号和完整答案。', staleAnswers: '答案不完整或题目已更新，请重新作答。',
    passMessage: '三题全部正确，可以上岗。', failMessage: '尚未全部答对，请复习相关规则后重试。',
    regeneratedAi: '已使用AI重新生成并缓存题目。', regeneratedFallback: 'AI不可用，已重新载入备用题目。',
    apiNotFound: '接口不存在。', pageNotFound: '页面不存在。', badRequest: '请求格式无效。', serverError: '服务暂时异常，请稍后重试并联系指导老师。',
    adminAuthRequired: '需要教师账号验证。用户名：admin'
  },
  en: {
    machineNotFound: 'Machine not found. Please check the QR code.', rateLimited: 'Too many questions. Please wait one minute and try again.',
    invalidQuestion: 'Invalid machine or question. Enter a question of 1–300 characters.', aiUnavailable: 'The Safety Coach is temporarily unavailable. Please retry, and ask the instructor before operating.',
    invalidSubmission: 'Enter a valid name, student ID, and all answers.', staleAnswers: 'Answers are incomplete or the quiz changed. Please answer the current questions.',
    passMessage: 'All three answers are correct. You are cleared to operate.', failMessage: 'Not all answers are correct. Review the listed rules and retry.',
    regeneratedAi: 'Questions regenerated with AI and cached.', regeneratedFallback: 'AI is unavailable. Fallback questions have been reloaded.',
    apiNotFound: 'API endpoint not found.', pageNotFound: 'Page not found.', badRequest: 'Invalid request format.', serverError: 'Service temporarily unavailable. Retry and contact the instructor if needed.',
    adminAuthRequired: 'Instructor authentication required. Username: admin'
  }
};

function lang(req) {
  return language(req.body?.lang || req.query.lang);
}

function msg(req, key) {
  return messages[lang(req)][key];
}

app.disable('x-powered-by');
app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'"
  });
  next();
});
app.use(express.json({ limit: '24kb' }));

function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function cleanText(value, maxLength) {
  if (typeof value !== 'string') return null;
  const cleaned = value.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim();
  return cleaned.length > 0 && cleaned.length <= maxLength ? cleaned : null;
}

function validMachine(req, res) {
  const machine = getMachine(req.params.machineId);
  if (!machine) {
    res.status(404).json({ error: msg(req, 'machineNotFound') });
    return null;
  }
  return machine;
}

const askBuckets = new Map();
function askRateLimit(req, res, next) {
  const now = Date.now();
  const key = req.ip || 'unknown';
  let bucket = askBuckets.get(key);
  if (!bucket || now - bucket.startedAt >= 60000) {
    bucket = { startedAt: now, count: 0 };
    askBuckets.set(key, bucket);
  }
  bucket.count += 1;
  res.set('X-RateLimit-Limit', String(RATE_LIMIT));
  res.set('X-RateLimit-Remaining', String(Math.max(0, RATE_LIMIT - bucket.count)));
  if (bucket.count > RATE_LIMIT) {
    return res.status(429).json({ error: msg(req, 'rateLimited'), retryable: true });
  }
  if (askBuckets.size > 1000) {
    for (const [ip, value] of askBuckets) {
      if (now - value.startedAt >= 60000) askBuckets.delete(ip);
    }
  }
  next();
}

function safeEqual(left, right) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function adminAuth(req, res, next) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Basic ')) {
    try {
      const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
      const separator = decoded.indexOf(':');
      const username = decoded.slice(0, separator);
      const password = decoded.slice(separator + 1);
      if (safeEqual(username, 'admin') && safeEqual(password, ADMIN_PASSWORD)) return next();
    } catch {
      // Invalid credentials receive the same challenge below.
    }
  }
  res.set('WWW-Authenticate', 'Basic realm="Instructor Dashboard", charset="UTF-8"');
  res.status(401).send(msg(req, 'adminAuthRequired'));
}

app.get('/', (req, res) => res.redirect('/qr'));
app.get('/health', (req, res) => {
  db.prepare('SELECT 1').get();
  res.json({
    status: 'ok',
    machines: listMachines().length,
    aiConfigured: isAiConfigured(),
    time: new Date().toISOString()
  });
});

app.get('/m/:machineId', (req, res) => {
  if (!getMachine(req.params.machineId)) {
    return res.status(404).send(msg(req, 'machineNotFound'));
  }
  res.sendFile(path.join(rootDir, 'views', 'machine.html'));
});

app.get('/api/machine/:machineId', (req, res) => {
  const machine = validMachine(req, res);
  if (!machine) return;
  const view = machineView(machine, lang(req));
  res.json({ id: machine.id, name: view.name, description: view.description });
});

app.get('/api/briefing/:machineId', asyncRoute(async (req, res) => {
  const machine = validMachine(req, res);
  if (!machine) return;
  res.json(await getBriefing(machine, lang(req)));
}));

app.post('/api/ask', askRateLimit, asyncRoute(async (req, res) => {
  const machine = getMachine(req.body?.machineId);
  const question = cleanText(req.body?.question, 300);
  if (!machine || !question) {
    return res.status(400).json({ error: msg(req, 'invalidQuestion') });
  }

  let answered = false;
  try {
    const result = await answerQuestion(machine, question, lang(req));
    answered = result.answered;
    db.prepare('INSERT INTO questions_log (machine_id, question, answered, created_at) VALUES (?, ?, ?, ?)')
      .run(machine.id, question, answered ? 1 : 0, new Date().toISOString());
    res.json(result);
  } catch (error) {
    db.prepare('INSERT INTO questions_log (machine_id, question, answered, created_at) VALUES (?, ?, ?, ?)')
      .run(machine.id, question, 0, new Date().toISOString());
    console.error('Q&A failed:', error.message);
    res.status(503).json({
      error: msg(req, 'aiUnavailable'),
      retryable: true,
      answered: false
    });
  }
}));

app.get('/api/quiz/:machineId', asyncRoute(async (req, res) => {
  const machine = validMachine(req, res);
  if (!machine) return;
  const quiz = await getQuiz(machine, { lang: lang(req) });
  res.json({
    machineId: machine.id,
    source: quiz.source,
    questions: quiz.questions.map(({ id, question, options, ruleNumber }) => ({
      id, question, options, ruleNumber
    }))
  });
}));

app.post('/api/quiz/submit', asyncRoute(async (req, res) => {
  const machine = getMachine(req.body?.machineId);
  const name = cleanText(req.body?.name, 40);
  const studentId = cleanText(req.body?.studentId, 30);
  const answers = req.body?.answers;
  if (!machine || !name || !studentId || !/^[\p{L}\p{N}_-]+$/u.test(studentId) || !Array.isArray(answers)) {
    return res.status(400).json({ error: msg(req, 'invalidSubmission') });
  }

  const quiz = await getQuiz(machine, { lang: lang(req) });
  const byId = new Map(quiz.questions.map((question) => [question.id, question]));
  if (
    answers.length !== quiz.questions.length ||
    new Set(answers.map((answer) => answer?.questionId)).size !== quiz.questions.length ||
    answers.some((answer) => !byId.has(answer?.questionId) || !Number.isInteger(answer?.selectedIndex) || answer.selectedIndex < 0 || answer.selectedIndex > 3)
  ) {
    return res.status(400).json({ error: msg(req, 'staleAnswers') });
  }

  const details = quiz.questions.map((question) => {
    const submitted = answers.find((answer) => answer.questionId === question.id);
    return {
      questionId: question.id,
      question: question.question,
      selectedIndex: submitted.selectedIndex,
      selectedOption: question.options[submitted.selectedIndex],
      correctIndex: question.correctIndex,
      correct: submitted.selectedIndex === question.correctIndex,
      ruleNumber: question.ruleNumber
    };
  });
  const score = details.filter((answer) => answer.correct).length;
  const passed = score === quiz.questions.length;
  const createdAt = new Date().toISOString();
  const result = db.prepare(`
    INSERT INTO attempts (name, student_id, machine_id, passed, answers_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(name, studentId, machine.id, passed ? 1 : 0, JSON.stringify(details), createdAt);
  const rulesToReview = [...new Set(details.filter((answer) => !answer.correct).map((answer) => answer.ruleNumber))];

  res.json({
    attemptId: result.lastInsertRowid,
    passed,
    score,
    total: quiz.questions.length,
    rulesToReview,
    createdAt,
    message: msg(req, passed ? 'passMessage' : 'failMessage')
  });
}));

app.get('/admin', adminAuth, (req, res) => {
  res.sendFile(path.join(rootDir, 'views', 'admin.html'));
});
app.use('/api/admin', adminAuth);

app.get('/api/admin/stats', (req, res) => res.json(getStats(lang(req))));
app.get('/api/admin/export.csv', (req, res) => {
  res.set({
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': 'attachment; filename="safety-attempts.csv"'
  });
  res.send(attemptsCsv(lang(req)));
});
app.post('/api/admin/quiz/:machineId/regenerate', asyncRoute(async (req, res) => {
  const machine = validMachine(req, res);
  if (!machine) return;
  const quiz = await getQuiz(machine, { force: true, lang: lang(req) });
  res.json({
    message: msg(req, quiz.source === 'ai' ? 'regeneratedAi' : 'regeneratedFallback'),
    source: quiz.source
  });
}));

function publicBaseUrl() {
  const fallback = `http://localhost:${PORT}`;
  const raw = (process.env.PUBLIC_BASE_URL || fallback).trim().replace(/\/+$/g, '');
  try {
    const url = new URL(raw);
    if (!['http:', 'https:'].includes(url.protocol)) return fallback;
    return raw;
  } catch {
    return fallback;
  }
}

app.get('/qr', asyncRoute(async (req, res) => {
  const currentLang = lang(req);
  const english = currentLang === 'en';
  const baseUrl = publicBaseUrl();
  let baseHost = '';
  try { baseHost = new URL(baseUrl).hostname; } catch { baseHost = ''; }
  const localhostWarning = /^(localhost|127\.0\.0\.1)$/i.test(baseHost);
  const cards = await Promise.all(listMachines().map(async (machine) => {
    const view = machineView(machine, currentLang);
    const url = `${baseUrl}/m/${encodeURIComponent(machine.id)}${english ? '?lang=en' : ''}`;
    const dataUrl = await QRCode.toDataURL(url, {
      width: 360, margin: 2, errorCorrectionLevel: 'M',
      color: { dark: '#111111', light: '#ffffff' }
    });
    return { ...view, url, dataUrl };
  }));

  const html = `<!doctype html>
<html lang="${english ? 'en' : 'zh-CN'}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${english ? 'Machine QR Codes | Safety Coach' : '设备二维码｜扫码安全官'}</title>
  <link rel="stylesheet" href="/styles.css">
  <script src="/qr.js" defer></script>
</head>
<body class="qr-page">
  <div class="safety-stripe" aria-hidden="true"></div>
  <header class="machine-header qr-header no-print">
    <div class="brand-row">
      <span class="brand-mark">安</span>
      <span>${english ? 'Scan Safety Coach' : '扫码安全官'}</span>
      <a class="language-toggle" href="${english ? '/qr?lang=zh' : '/qr?lang=en'}">${english ? '中文' : 'English'}</a>
    </div>
    <h1>${english ? 'Machine QR Codes' : '设备二维码'}</h1>
    <p>${english ? 'Print and place beside each machine. Each code opens only that machine’s safety page.' : '打印后贴在对应设备旁。扫码只会打开该设备的安全页面。'}</p>
    ${localhostWarning ? `<div class="warning-banner"><strong>${english ? 'WARNING' : '注意'}</strong><span>${english ? 'PUBLIC_BASE_URL is localhost — phones cannot open these QR codes. Set it to your computer LAN IP or a tunnel URL and restart before printing.' : 'PUBLIC_BASE_URL 是 localhost，手机无法打开这些二维码。请改为电脑局域网 IP 或隧道地址后重启再打印。'}</span></div>` : ''}
    <div class="toolbar"><button id="print-button" class="button primary" type="button">${english ? 'Print all QR codes' : '打印全部二维码'}</button><a class="button secondary" href="${english ? '/admin?lang=en' : '/admin?lang=zh'}">${english ? 'Instructor dashboard' : '教师仪表盘'}</a></div>
    <p class="base-url">${english ? 'QR base URL:' : '二维码地址前缀：'}<strong>${escapeHtml(baseUrl)}</strong></p>
  </header>
  <main class="qr-grid">
    ${cards.map((card) => `<article class="qr-card">
      <div class="qr-machine-label">${english ? 'MACHINE-SPECIFIC QR CODE' : '设备专用二维码'}</div>
      <h2>${escapeHtml(card.name)}</h2>
      <p>${escapeHtml(card.description)}</p>
      <img src="${card.dataUrl}" alt="${escapeHtml(card.name)} ${english ? 'safety page QR code' : '安全页面二维码'}" width="360" height="360">
      <strong class="qr-scan-text">${english ? 'Scan to learn · ask · pass the quiz' : '扫码学习 · 提问 · 小测'}</strong>
      <code>${escapeHtml(card.url)}</code>
    </article>`).join('')}
  </main>
  <footer class="footer no-print">${english ? 'Answers use only training-center SOPs. Ask the instructor when unsure.' : '答案仅依据实训中心安全规程，不确定时请询问指导老师'}</footer>
</body>
</html>`;
  res.type('html').send(html);
}));

app.use(express.static(path.join(rootDir, 'public'), { index: false, maxAge: 0 }));
app.use((req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: msg(req, 'apiNotFound') });
  res.status(404).send(msg(req, 'pageNotFound'));
});
app.use((error, req, res, next) => {
  console.error('Request failed:', error.message);
  if (res.headersSent) return next(error);
  const badRequest = error.type === 'entity.parse.failed' || error.type === 'entity.too.large';
  res.status(badRequest ? 400 : 500).json({ error: msg(req, badRequest ? 'badRequest' : 'serverError') });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`扫码安全官已启动：http://localhost:${PORT}`);
  console.log(`二维码页面：${publicBaseUrl()}/qr`);
  console.log(`AI状态：${isAiConfigured() ? '已配置' : '未配置（简报/小测使用备用内容，问答不可用）'}`);
});

function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
