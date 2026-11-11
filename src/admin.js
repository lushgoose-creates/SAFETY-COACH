const db = require('./db');
const { listMachines } = require('./machines');
const { language, machineView } = require('./language');

function getStats(lang = 'zh') {
  const currentLang = language(lang);
  const machines = listMachines().map((machine) => machineView(machine, currentLang)).map((machine) => {
    const row = db.prepare(`
      SELECT COUNT(*) AS total,
        COALESCE(SUM(passed), 0) AS passed,
        COALESCE(SUM(CASE WHEN student_id LIKE 'DEMO-%' THEN 1 ELSE 0 END), 0) AS demoCount
      FROM attempts WHERE machine_id = ?
    `).get(machine.id);
    return {
      ...machine,
      total: row.total,
      passed: row.passed,
      passRate: row.total ? Math.round((row.passed / row.total) * 100) : 0,
      demoCount: row.demoCount
    };
  });

  const recentAttempts = db.prepare(`
    SELECT id, name, student_id AS studentId, machine_id AS machineId,
      passed, created_at AS createdAt
    FROM attempts ORDER BY id DESC LIMIT 50
  `).all().map((row) => ({
    ...row,
    passed: Boolean(row.passed),
    isDemo: row.studentId.startsWith('DEMO-'),
    machineName: machines.find((machine) => machine.id === row.machineId)?.name || row.machineId
  }));

  const topQuestions = db.prepare(`
    SELECT machine_id AS machineId, question, COUNT(*) AS count,
      MAX(created_at) AS lastAskedAt
    FROM questions_log
    GROUP BY machine_id, lower(trim(question))
    ORDER BY count DESC, lastAskedAt DESC LIMIT 10
  `).all().map((row) => ({
    ...row,
    machineName: machines.find((machine) => machine.id === row.machineId)?.name || row.machineId
  }));

  const unanswered = db.prepare(`
    SELECT id, machine_id AS machineId, question, created_at AS createdAt
    FROM questions_log WHERE answered = 0 ORDER BY id DESC LIMIT 50
  `).all().map((row) => ({
    ...row,
    machineName: machines.find((machine) => machine.id === row.machineId)?.name || row.machineId
  }));

  const questionStats = new Map();
  const attempts = db.prepare('SELECT machine_id AS machineId, answers_json AS answersJson FROM attempts').all();
  for (const attempt of attempts) {
    let answers;
    try {
      answers = JSON.parse(attempt.answersJson);
    } catch {
      continue;
    }
    if (!Array.isArray(answers)) continue;
    for (const answer of answers) {
      if (!answer.questionId || !answer.question) continue;
      const key = `${attempt.machineId}:${answer.questionId}:${answer.question}`;
      if (!questionStats.has(key)) {
        questionStats.set(key, {
          machineId: attempt.machineId,
          machineName: machines.find((machine) => machine.id === attempt.machineId)?.name || attempt.machineId,
          questionId: answer.questionId,
          question: answer.question,
          ruleNumber: answer.ruleNumber,
          total: 0,
          failed: 0
        });
      }
      const stat = questionStats.get(key);
      stat.total += 1;
      if (!answer.correct) stat.failed += 1;
    }
  }
  const difficultQuestions = [...questionStats.values()]
    .map((item) => ({ ...item, failRate: item.total ? Math.round((item.failed / item.total) * 100) : 0 }))
    .sort((a, b) => b.failRate - a.failRate || b.failed - a.failed || b.total - a.total)
    .slice(0, 10);

  return {
    generatedAt: new Date().toISOString(),
    machines,
    recentAttempts,
    topQuestions,
    difficultQuestions,
    unanswered
  };
}

function csvCell(value) {
  let text = String(value ?? '');
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function attemptsCsv(lang = 'zh') {
  const currentLang = language(lang);
  const english = currentLang === 'en';
  const machines = listMachines().map((machine) => machineView(machine, currentLang));
  const rows = db.prepare(`
    SELECT name, student_id, machine_id, passed, created_at
    FROM attempts ORDER BY id DESC
  `).all();
  const header = english
    ? ['Name', 'Student ID', 'Machine', 'Result', 'Data type', 'Submitted at']
    : ['姓名', '学号', '设备', '是否通过', '是否演示数据', '答题时间'];
  const lines = rows.map((row) => [
    row.name,
    row.student_id,
    machines.find((machine) => machine.id === row.machine_id)?.name || row.machine_id,
    row.passed ? (english ? 'Pass' : '通过') : (english ? 'Fail' : '未通过'),
    row.student_id.startsWith('DEMO-') ? 'DEMO' : (english ? 'Student' : '真实'),
    row.created_at
  ]);
  return `\uFEFF${[header, ...lines].map((line) => line.map(csvCell).join(',')).join('\r\n')}`;
}

module.exports = { getStats, attemptsCsv };
