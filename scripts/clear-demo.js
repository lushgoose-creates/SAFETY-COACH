const db = require('../src/db');

const result = db.prepare("DELETE FROM attempts WHERE student_id LIKE 'DEMO-%'").run();
console.log(`已移除 ${result.changes} 条 DEMO 小测记录；真实记录未改动。`);
db.close();
