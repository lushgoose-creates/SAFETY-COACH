require('dotenv').config();

// SOP Studio demo seed. Instant, offline, and never spends API credits.
// Creates one clearly-marked demo draft (machine id `demo-drill`) with the
// canned sample content so the instructor can demo edit → approve → publish
// without an AI key. Does NOT publish or touch machines.json / sops/.
process.env.API_KEY = '';

const db = require('../src/db');
const studio = require('../src/studio');

const id = 'demo-drill';
const name = '演示·更换钻头';

db.prepare('DELETE FROM sop_drafts WHERE machine_id = ?').run(id);
db.prepare('DELETE FROM sop_versions WHERE machine_id = ?').run(id);
db.prepare('DELETE FROM audit_log WHERE machine_id = ?').run(id);

const ts = new Date().toISOString();
db.prepare(`
  INSERT INTO sop_drafts (id, machine_id, machine_name_zh, transcript, draft_json, status, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, 'draft', ?, ?)
`).run(
  studio.newId('draft'),
  id,
  name,
  studio.SAMPLE_TRANSCRIPT,
  JSON.stringify(studio.SAMPLE_DRAFT),
  ts,
  ts
);

console.log(`已写入 1 条 DEMO 草稿（设备标识 ${id}，未发布）。`);
console.log('打开 /studio 即可演示：编辑 → 确认 AI 建议 → 人工审核 → 发布。');
console.log('运行 npm run clear-studio-demo 可完全移除。');
db.close();
