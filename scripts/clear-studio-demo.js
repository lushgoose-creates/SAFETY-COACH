require('dotenv').config();

// Removes everything created by the SOP Studio demo, and only that:
// drafts/versions/audit rows with a `demo-` machine id, the matching entries in
// machines.json, and any published `sops/demo-*.md` files. Real data is untouched.
const fs = require('node:fs');
const path = require('node:path');
const db = require('../src/db');

const rootDir = path.join(__dirname, '..');
const machinesPath = path.join(rootDir, 'machines.json');
const sopsDir = path.join(rootDir, 'sops');

const drafts = db.prepare("DELETE FROM sop_drafts WHERE machine_id LIKE 'demo-%'").run();
const versions = db.prepare("DELETE FROM sop_versions WHERE machine_id LIKE 'demo-%'").run();
const audit = db.prepare("DELETE FROM audit_log WHERE machine_id LIKE 'demo-%'").run();

let removedMachines = 0;
try {
  const machines = JSON.parse(fs.readFileSync(machinesPath, 'utf8'));
  const kept = machines.filter((machine) => !/^demo-/.test(machine.id));
  removedMachines = machines.length - kept.length;
  if (removedMachines) fs.writeFileSync(machinesPath, `${JSON.stringify(kept, null, 2)}\n`);
} catch {
  // machines.json missing or invalid — nothing to clean there.
}

let removedSops = 0;
if (fs.existsSync(sopsDir)) {
  for (const file of fs.readdirSync(sopsDir)) {
    if (/^demo-.*\.md$/.test(file)) {
      fs.unlinkSync(path.join(sopsDir, file));
      removedSops += 1;
    }
  }
}

console.log(`已清理：${drafts.changes} 条草稿，${versions.changes} 个版本，${audit.changes} 条审计，${removedMachines} 台设备，${removedSops} 个规程文件。`);
console.log('真实数据未改动。');
db.close();
