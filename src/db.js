const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');

const dataDir = path.join(__dirname, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'safety.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    student_id TEXT NOT NULL,
    machine_id TEXT NOT NULL,
    passed INTEGER NOT NULL CHECK (passed IN (0, 1)),
    answers_json TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS questions_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    machine_id TEXT NOT NULL,
    question TEXT NOT NULL,
    answered INTEGER NOT NULL CHECK (answered IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS quiz_cache (
    machine_id TEXT PRIMARY KEY,
    questions_json TEXT NOT NULL,
    sop_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS briefing_cache (
    machine_id TEXT PRIMARY KEY,
    briefing_text TEXT NOT NULL,
    sop_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_attempts_created_at ON attempts(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_attempts_machine ON attempts(machine_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_questions_created_at ON questions_log(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_questions_answered ON questions_log(answered, created_at DESC);

  CREATE TABLE IF NOT EXISTS sop_drafts (
    id TEXT PRIMARY KEY,
    machine_id TEXT,
    machine_name_zh TEXT NOT NULL,
    transcript TEXT NOT NULL DEFAULT '',
    draft_json TEXT NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'draft'
      CHECK (status IN ('draft', 'in_review', 'approved', 'published', 'rejected')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sop_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    machine_id TEXT NOT NULL,
    version INTEGER NOT NULL,
    sop_markdown TEXT NOT NULL,
    rules_json TEXT NOT NULL,
    approved_by TEXT NOT NULL,
    approved_at TEXT NOT NULL,
    source_draft_id TEXT,
    change_note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (machine_id, version)
  );

  CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    machine_id TEXT,
    action TEXT NOT NULL,
    actor TEXT,
    detail_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS faq (
    id TEXT PRIMARY KEY,
    machine_id TEXT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    source_question_id INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_faq_machine ON faq(machine_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_sop_drafts_status ON sop_drafts(status, updated_at DESC);
  CREATE INDEX IF NOT EXISTS idx_sop_drafts_machine ON sop_drafts(machine_id);
  CREATE INDEX IF NOT EXISTS idx_sop_versions_machine ON sop_versions(machine_id, version DESC);
  CREATE INDEX IF NOT EXISTS idx_audit_log_machine ON audit_log(machine_id, created_at DESC);
`);

module.exports = db;
