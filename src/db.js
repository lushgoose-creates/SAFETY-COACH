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
`);

module.exports = db;
