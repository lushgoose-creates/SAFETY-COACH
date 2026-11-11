require('dotenv').config();

// Demo seeding must be instant and must never spend API credits.
process.env.API_KEY = '';
const db = require('../src/db');
const { listMachines, getMachine } = require('../src/machines');
const { getQuiz } = require('../src/safety-content');

async function seed() {
  const insert = db.prepare(`
    INSERT INTO attempts (name, student_id, machine_id, passed, answers_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  db.prepare("DELETE FROM attempts WHERE student_id LIKE 'DEMO-%'").run();

  let recordIndex = 0;
  for (const machineInfo of listMachines()) {
    const machine = getMachine(machineInfo.id);
    const quiz = await getQuiz(machine);
    for (let index = 0; index < 6; index += 1) {
      recordIndex += 1;
      const shouldPass = index % 3 !== 0;
      const details = quiz.questions.map((question, questionIndex) => {
        const wrong = !shouldPass && questionIndex <= index % 3;
        const selectedIndex = wrong ? (question.correctIndex + 1) % 4 : question.correctIndex;
        return {
          questionId: question.id,
          question: question.question,
          selectedIndex,
          selectedOption: question.options[selectedIndex],
          correctIndex: question.correctIndex,
          correct: selectedIndex === question.correctIndex,
          ruleNumber: question.ruleNumber
        };
      });
      const score = details.filter((answer) => answer.correct).length;
      const createdAt = new Date(Date.now() - (12 - recordIndex) * 17 * 60000).toISOString();
      insert.run(
        `演示学生${String(recordIndex).padStart(2, '0')}`,
        `DEMO-${String(recordIndex).padStart(3, '0')}`,
        machine.id,
        score === 3 ? 1 : 0,
        JSON.stringify(details),
        createdAt
      );
    }
  }
  console.log('已写入 12 条明确标记的 DEMO 小测记录（8 通过，4 未通过）。');
  console.log('运行 npm run clear-demo 可全部移除。');
  db.close();
}

seed().catch((error) => {
  console.error('DEMO 数据写入失败：', error.message);
  db.close();
  process.exitCode = 1;
});
