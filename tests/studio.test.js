require('dotenv').config();

// Offline, deterministic tests for the SOP Studio. No AI, no network, and no
// writes to machines.json / sops/ (publish/rollback are guarded, not executed).
process.env.API_KEY = '';

const { test, after } = require('node:test');
const assert = require('node:assert');
const db = require('../src/db');
const studio = require('../src/studio');

const created = [];
let seq = 0;

// Valid machine slug (lowercase letters/digits/hyphen only) that is unique.
function uniq() {
  seq += 1;
  return `t${Date.now().toString(36)}${seq}`;
}

function track(draftId, machineId) {
  created.push({ draftId, machineId });
}

function cleanup() {
  for (const item of created) {
    if (item.draftId) db.prepare('DELETE FROM sop_drafts WHERE id = ?').run(item.draftId);
    if (item.machineId) db.prepare('DELETE FROM audit_log WHERE machine_id = ?').run(item.machineId);
    db.prepare('DELETE FROM sop_drafts WHERE machine_id = ?').run(item.machineId);
  }
  created.length = 0;
}

after(() => {
  cleanup();
  db.close();
});

// ---------- pure helpers ----------

test('isValidMachineId accepts safe slugs and rejects unsafe ones', () => {
  assert.strictEqual(studio.isValidMachineId('lathe'), true);
  assert.strictEqual(studio.isValidMachineId('drill-press'), true);
  assert.strictEqual(studio.isValidMachineId('a'.repeat(40)), true);
  assert.strictEqual(studio.isValidMachineId('A-bad'), false);
  assert.strictEqual(studio.isValidMachineId('has space'), false);
  assert.strictEqual(studio.isValidMachineId('-lead'), false);
  assert.strictEqual(studio.isValidMachineId('a'.repeat(41)), false);
});

test('isValidReviewerName requires 2-20 characters', () => {
  assert.strictEqual(studio.isValidReviewerName('张三'), true);
  assert.strictEqual(studio.isValidReviewerName('张'), false);
  assert.strictEqual(studio.isValidReviewerName('x'.repeat(21)), false);
});

test('normalizeDraft sanitizes untrusted AI output', () => {
  const draft = studio.normalizeDraft({
    title: '标题<script>',
    purpose: '目的',
    ppe: ['护目镜', '护目镜', ''],
    rules: [
      { text: '规则一', why: '', source: 'master', danger: true },
      { text: '规则一', why: '', source: 'ai_suggested', danger: 'true' }, // duplicate -> removed
      { text: '   ', why: '', source: 'master', danger: false }, // blank -> removed
      { text: 'AI补充', source: 'bogus' } // source coerced to master
    ],
    danger_points: ['a', 42, ''],
    stop_conditions: ['停'],
    checklist: ['查'],
    gaps: [{ question: 'q', why_it_matters: 'w' }, { question: '' }],
    quiz_seed: [{ question: 't', rule_index: 1 }]
  }, '默认设备');

  assert.strictEqual(draft.title, '标题<script>');
  assert.deepStrictEqual(draft.ppe, ['护目镜']);
  assert.strictEqual(draft.rules.length, 2); // dedupe + drop blank
  assert.strictEqual(draft.rules[0].source, 'master');
  assert.strictEqual(draft.rules[0].danger, true);
  assert.strictEqual(draft.rules[1].source, 'master'); // bogus coerced
  assert.deepStrictEqual(draft.danger_points, ['a', '42']);
  assert.strictEqual(draft.gaps.length, 1);
  assert.strictEqual(draft.quiz_seed.length, 1);
});

test('normalizeDraft falls back to a machine name as title', () => {
  const draft = studio.normalizeDraft(null, '车床');
  assert.strictEqual(draft.title, '车床');
  assert.deepStrictEqual(draft.rules, []);
});

test('buildSopMarkdown produces numbered 规则 lines and approval header', () => {
  const markdown = studio.buildSopMarkdown(
    { ppe: ['护目镜'], danger_points: ['卡盘'], stop_conditions: [], checklist: [], rules: [{ text: '先停机' }, { text: '取钥匙' }] },
    { machineNameZh: '钻床', version: 3, approvedBy: '李老师', approvedAt: '2026-11-15T08:00:00.000Z' }
  );
  assert.ok(markdown.includes('# 钻床安全操作规程'));
  assert.ok(markdown.includes('李老师'));
  assert.ok(markdown.includes('第3版'));
  assert.ok(markdown.includes('规则1：先停机'));
  assert.ok(markdown.includes('规则2：取钥匙'));
});

test('SAMPLE_DRAFT is the canned offline demo and contains an AI-suggested rule', () => {
  assert.ok(Array.isArray(studio.SAMPLE_DRAFT.rules));
  assert.ok(studio.SAMPLE_DRAFT.rules.some((rule) => rule.source === 'ai_suggested'));
  assert.ok(Array.isArray(studio.SAMPLE_DRAFT.gaps) && studio.SAMPLE_DRAFT.gaps.length >= 1);
  assert.ok(studio.SAMPLE_TRANSCRIPT.length > 10);
});

// ---------- draft lifecycle + approval gate (throwaway rows) ----------

test('createDraft (demo) creates an offline draft without AI', async () => {
  const machineId = uniq();
  const result = await studio.createDraft({ machineNameZh: '测试设备', machineId, transcript: '测试口述', demo: true });
  assert.ok(result.draftId);
  assert.strictEqual(result.source, 'demo');
  assert.ok(Array.isArray(result.draft.rules));
  track(result.draftId, machineId);
});

test('approveDraft blocks while an AI-suggested rule is unconfirmed', async () => {
  const machineId = uniq();
  const { draftId } = await studio.createDraft({ machineNameZh: '测试设备', machineId, transcript: '测试口述', demo: true });
  track(draftId, machineId);

  const result = studio.approveDraft(draftId, {
    reviewerName: '张三',
    confirmations: { rulesChecked: true, requirementsChecked: true, gapsAcknowledged: true }
  });
  assert.ok(result.error);
  assert.ok(result.error.includes('AI建议'), result.error);
});

test('approveDraft requires reviewer name and both confirmations', async () => {
  const machineId = uniq();
  const { draftId } = await studio.createDraft({ machineNameZh: '测试设备', machineId, transcript: '测试口述', demo: true });
  track(draftId, machineId);

  // Reduce to a single confirmed rule and no gaps.
  const save = studio.saveDraft(draftId, {
    title: '测试', purpose: '', ppe: [], rules: [{ text: '先停机', why: '', source: 'reviewed', danger: true }],
    danger_points: [], stop_conditions: [], checklist: [], gaps: [], quiz_seed: []
  });
  assert.ok(save.ok);

  assert.ok(studio.approveDraft(draftId, { reviewerName: '张', confirmations: { rulesChecked: true, requirementsChecked: true } }).error);
  assert.ok(studio.approveDraft(draftId, { reviewerName: '张三', confirmations: { rulesChecked: true, requirementsChecked: false } }).error);
  const ok = studio.approveDraft(draftId, { reviewerName: '张三', confirmations: { rulesChecked: true, requirementsChecked: true } });
  assert.strictEqual(ok.ok, true);
  assert.strictEqual(ok.status, 'approved');
});

test('approveDraft requires gaps acknowledgement when gaps are unanswered', async () => {
  const machineId = uniq();
  const { draftId } = await studio.createDraft({ machineNameZh: '测试设备', machineId, transcript: '测试口述', demo: true });
  track(draftId, machineId);

  // Confirm the AI-suggested rule but keep the unanswered gaps.
  const current = studio.getDraftPublic(draftId);
  const rules = current.draft.rules.map((rule) => ({ ...rule, source: rule.source === 'ai_suggested' ? 'reviewed' : rule.source }));
  studio.saveDraft(draftId, { ...current.draft, rules });

  const withoutAck = studio.approveDraft(draftId, { reviewerName: '张三', confirmations: { rulesChecked: true, requirementsChecked: true } });
  assert.ok(withoutAck.error && withoutAck.error.includes('未回答'), withoutAck.error);

  const withAck = studio.approveDraft(draftId, { reviewerName: '张三', confirmations: { rulesChecked: true, requirementsChecked: true, gapsAcknowledged: true } });
  assert.strictEqual(withAck.ok, true);
});

test('publishDraft refuses to publish a non-approved draft', async () => {
  const machineId = uniq();
  const { draftId } = await studio.createDraft({ machineNameZh: '测试设备', machineId, transcript: '测试口述', demo: true });
  track(draftId, machineId);

  const result = await studio.publishDraft(draftId);
  assert.ok(result.error);
  assert.ok(result.error.includes('已批准'), result.error);
});

test('listStudio and studioStats return sane shapes without throwing', () => {
  const machines = studio.listStudio();
  assert.ok(Array.isArray(machines));
  const stats = studio.studioStats();
  assert.strictEqual(typeof stats.publishedMachines, 'number');
  assert.strictEqual(typeof stats.totalVersions, 'number');
});

test('machineApproval returns null for a never-published machine', () => {
  assert.strictEqual(studio.machineApproval('__never__published__'), null);
});
