(() => {
  'use strict';

  const messages = {
    zh: {
      machinePageTitle: '设备安全准入｜扫码安全官',
      adminPageTitle: '教师仪表盘｜扫码安全官',
      brandMark: '安', brandName: '扫码安全官', machineOnly: '本机专用',
      identifyingMachine: '正在识别设备…', pleaseWait: '请稍候', progressLabel: '安全准入进度',
      stepIdentity: '身份', stepBriefing: '简报', stepChat: '问答', stepQuiz: '小测',
      identityEyebrow: 'STEP 01 · 身份登记', identityTitle: '开始本机安全准入', identityDescription: '信息仅用于本次实训小测记录。',
      nameLabel: '姓名', namePlaceholder: '请输入真实姓名', studentIdLabel: '学号', studentIdPlaceholder: '请输入学号',
      identityModeLabel: '来访模式', modeStudent: '学生', modeVisitor: '访客', modeStudentDesc: '完成小测后可上岗', modeVisitorDesc: '只看规程和问答，不参加小测',
      identitySubmit: '确认身份，查看安全简报', identitySubmitVisitor: '进入安全简报', backButton: '返回上一步',
      briefingEyebrow: 'STEP 02 · 60秒安全简报', briefingTitle: '先记住这 5 件事', briefingDescription: '以下要点只来自本设备安全规程。',
      warningLabel: '注意', warningText: '未完成学习和小测，不得操作设备。', briefingLoading: '正在生成本机安全简报…',
      briefingNext: '我已阅读，进入安全问答', briefingRetry: '重新加载安全简报',
      chatEyebrow: 'STEP 03 · 问问安全官', chatTitle: '有疑问，先问再操作', chatDescription: '答案仅依据本机规程；未涵盖的问题会转交老师。',
      coach: '安全官', coachEscalation: '安全官 · 需询问老师', you: '你',
      chatWelcome: '你可以问本机的防护、操作或异常处理问题。不确定时，请直接询问指导老师。',
      questionLabel: '你的问题', questionPlaceholder: '例如：清理切屑时可以戴手套吗？', sendQuestion: '发送问题',
      chatNext: '没有疑问了，开始上岗小测', visitorChatNext: '没有疑问了，结束浏览',
      visitorResultTitle: '感谢浏览本机安全规程', visitorResultMessage: '你已查看安全简报并可向安全官提问。如需上岗操作，请切换为学生模式完成小测。', visitorDone: '返回首页', checkingSop: '安全官正在查规程…', verifyingSop: '正在逐条核对本机安全规程…',
      retryQuestion: '重试上一个问题',
      botName: '安全官助手', botGreeting: '你好！我是本机的安全官助手，有什么安全问题都可以问我。', botPlaceholder: '问一个关于本机的安全问题…', botSend: '发送', botThinking: '让我查一下规程…', botHint: '点击我随时提问',
      quizEyebrow: 'STEP 04 · 上岗小测', quizTitle: '三题全部正确才通过', quizDescription: '可重试，每次作答都会记录。',
      quizLoading: '正在准备本机题目…', quizPreparing: '正在准备题目…', quizRetryLoad: '重新加载题目',
      questionNumber: '第 {number} 题', testsRule: '考查：规则{number}', submitAnswers: '提交答案（{checked}/3）', grading: '正在判分…', retryQuiz: '复习后重新测验',
      footer: '答案仅依据实训中心安全规程，不确定时请询问指导老师',
      serviceUnavailable: '服务暂时不可用，请稍后重试。', identityRequired: '请填写姓名和学号。',
      studentIdInvalid: '学号只能包含字母、数字、下划线或连字符。', completeQuiz: '请完成全部 3 道题后再提交。',
      passTitle: '已通过 / 可以上岗', failTitle: '暂未通过 / 请再学习', score: '答对 {score} / {total} 题',
      resultName: '姓名', resultStudentId: '学号', resultMachine: '设备', resultTime: '时间',
      reviewRules: '请重新阅读', rule: '规则{number}',
      passNote: '请将此页面出示给指导教师。操作时仍须遵守现场管理要求。',
      machineTitle: '{machine}安全准入｜扫码安全官',
      adminEyebrow: 'INSTRUCTOR CONSOLE', adminTitle: '教师仪表盘', adminSubtitle: '扫码安全官 · 实训安全数据总览',
      autoRefresh: '每 10 秒自动刷新', loadingData: '正在加载数据…', connecting: '连接服务器中', refreshNow: '立即刷新', exportCsv: '导出 CSV',
      machineStatsTitle: '设备通过率', machineStatsDescription: '演示数据会明确标记，不会静默混入真实记录。',
      attemptsTitle: '最近小测记录', attemptsDescription: '显示最近 50 次作答，包含每次重试。',
      resultHeader: '结果', personHeader: '姓名 / 学号', machineHeader: '设备', timeHeader: '时间',
      attemptsEmpty: '暂无小测记录。可运行 npm run seed-demo 预览。',
      questionsTitle: '最常被问的 10 个问题', questionsDescription: '帮助老师发现学生最关心什么。', countHeader: '次数', questionMachineHeader: '问题 / 设备', questionsEmpty: '暂无提问记录。',
      difficultTitle: '高错误率题目', difficultDescription: '按答错比例排序，定位薄弱规则。', failRateHeader: '错误率', questionRuleHeader: '题目 / 规则', difficultEmpty: '暂无答题统计。',
      unansweredTitle: '未回答 / 需老师介入的问题', unansweredDescription: '规程未涵盖或AI连接失败的问题会出现在这里。', studentQuestionHeader: '学生问题', unansweredEmpty: '暂无待介入问题。',
      passRate: '通过率 · {passed} / {total} 次通过', demoRecords: '含 {count} 条 DEMO 记录', regenerate: '重新生成题目',
      pass: '通过', fail: '未通过', lastAsked: '最近 {time}', incorrectCount: '{failed} / {total} 次答错', ruleOnly: '规则{number}',
      lastUpdated: '最后更新：{time}', synchronized: '数据已同步', refreshFailed: '刷新失败', retryAutomatically: '将在下次自动重试。',
      generating: '正在生成…', generationFailed: '生成失败'
    },
    en: {
      machinePageTitle: 'Machine Safety Clearance | Safety Coach',
      adminPageTitle: 'Instructor Dashboard | Safety Coach',
      brandMark: 'S', brandName: 'Safety Coach', machineOnly: 'THIS MACHINE ONLY',
      identifyingMachine: 'Identifying machine…', pleaseWait: 'Please wait', progressLabel: 'Safety clearance progress',
      stepIdentity: 'Identity', stepBriefing: 'Briefing', stepChat: 'Ask', stepQuiz: 'Quiz',
      identityEyebrow: 'STEP 01 · IDENTIFICATION', identityTitle: 'Start safety clearance for this machine', identityDescription: 'Your details are used only for this training quiz record.',
      nameLabel: 'Name', namePlaceholder: 'Enter your full name', studentIdLabel: 'Student ID', studentIdPlaceholder: 'Enter your student ID',
      identityModeLabel: 'Mode', modeStudent: 'Student', modeVisitor: 'Visitor', modeStudentDesc: 'Take the quiz to be cleared', modeVisitorDesc: 'Read the SOP and ask questions only',
      identitySubmit: 'Confirm identity and view safety briefing', identitySubmitVisitor: 'View safety briefing', backButton: 'Back',
      briefingEyebrow: 'STEP 02 · 60-SECOND SAFETY BRIEFING', briefingTitle: 'Remember these 5 points first', briefingDescription: 'Every point comes only from this machine’s SOP.',
      warningLabel: 'WARNING', warningText: 'Do not operate the machine until you complete the lesson and quiz.', briefingLoading: 'Preparing this machine’s safety briefing…',
      briefingNext: 'I have read it — continue to safety Q&A', briefingRetry: 'Reload safety briefing',
      chatEyebrow: 'STEP 03 · ASK THE SAFETY COACH', chatTitle: 'Ask before you operate', chatDescription: 'Answers use only this machine’s SOP. Uncovered questions are escalated to the instructor.',
      coach: 'Safety Coach', coachEscalation: 'Safety Coach · Ask the instructor', you: 'You',
      chatWelcome: 'Ask about guards, operation, or abnormal situations for this machine. If in doubt, ask the instructor directly.',
      questionLabel: 'Your question', questionPlaceholder: 'Example: Can I wear gloves while clearing chips?', sendQuestion: 'Send question',
      chatNext: 'No more questions — start the clearance quiz', visitorChatNext: 'No more questions — finish browsing',
      visitorResultTitle: 'Thanks for reviewing this machine’s safety rules', visitorResultMessage: 'You reviewed the safety briefing and can ask the Safety Coach questions. To operate the machine, switch to Student mode and pass the quiz.', visitorDone: 'Back to home', checkingSop: 'Checking the SOP…', verifyingSop: 'Checking each rule in this machine’s SOP…',
      retryQuestion: 'Retry last question',
      botName: 'Safety Coach Bot', botGreeting: 'Hi! I’m this machine’s safety assistant. Ask me anything about safe operation.', botPlaceholder: 'Ask a safety question about this machine…', botSend: 'Send', botThinking: 'Let me check the SOP…', botHint: 'Tap me to ask',
      quizEyebrow: 'STEP 04 · CLEARANCE QUIZ', quizTitle: 'All 3 answers must be correct', quizDescription: 'You may retry. Every attempt is recorded.',
      quizLoading: 'Preparing questions for this machine…', quizPreparing: 'Preparing questions…', quizRetryLoad: 'Reload questions',
      questionNumber: 'Question {number}', testsRule: 'Tests: Rule {number}', submitAnswers: 'Submit answers ({checked}/3)', grading: 'Grading…', retryQuiz: 'Review and retake the quiz',
      footer: 'Answers use only training-center SOPs. Ask the instructor when unsure.',
      serviceUnavailable: 'Service is temporarily unavailable. Please try again.', identityRequired: 'Enter your name and student ID.',
      studentIdInvalid: 'Student ID may contain only letters, numbers, underscores, or hyphens.', completeQuiz: 'Answer all 3 questions before submitting.',
      passTitle: 'Passed / Cleared to operate', failTitle: 'Not passed / Keep learning', score: '{score} / {total} correct',
      resultName: 'Name', resultStudentId: 'Student ID', resultMachine: 'Machine', resultTime: 'Time',
      reviewRules: 'Review these rules', rule: 'Rule {number}',
      passNote: 'Show this page to the instructor. You must still follow all workshop rules while operating.',
      machineTitle: '{machine} Safety Clearance | Safety Coach',
      adminEyebrow: 'INSTRUCTOR CONSOLE', adminTitle: 'Instructor Dashboard', adminSubtitle: 'Safety Coach · Training safety overview',
      autoRefresh: 'Refreshes every 10 seconds', loadingData: 'Loading data…', connecting: 'Connecting to server', refreshNow: 'Refresh now', exportCsv: 'Export CSV',
      machineStatsTitle: 'Pass rate by machine', machineStatsDescription: 'DEMO records are clearly labeled and never silently mixed in as real records.',
      attemptsTitle: 'Recent quiz attempts', attemptsDescription: 'The latest 50 submissions, including every retry.',
      resultHeader: 'Result', personHeader: 'Name / Student ID', machineHeader: 'Machine', timeHeader: 'Time',
      attemptsEmpty: 'No quiz attempts yet. Run npm run seed-demo to preview the dashboard.',
      questionsTitle: 'Top 10 student questions', questionsDescription: 'See what students ask about most.', countHeader: 'Count', questionMachineHeader: 'Question / Machine', questionsEmpty: 'No questions recorded yet.',
      difficultTitle: 'Questions with high failure rates', difficultDescription: 'Sorted by failure rate to identify weak rule knowledge.', failRateHeader: 'Failure rate', questionRuleHeader: 'Question / Rule', difficultEmpty: 'No answer statistics yet.',
      unansweredTitle: 'Unanswered / Instructor follow-up', unansweredDescription: 'Includes questions outside the SOP or failed AI connections.', studentQuestionHeader: 'Student question', unansweredEmpty: 'No questions need follow-up.',
      passRate: 'Pass rate · {passed} / {total} passed', demoRecords: 'Includes {count} DEMO records', regenerate: 'Regenerate quiz',
      pass: 'Pass', fail: 'Fail', lastAsked: 'Last asked {time}', incorrectCount: '{failed} / {total} incorrect', ruleOnly: 'Rule {number}',
      lastUpdated: 'Last updated: {time}', synchronized: 'Data synchronized', refreshFailed: 'Refresh failed', retryAutomatically: 'Will retry automatically.',
      generating: 'Generating…', generationFailed: 'Generation failed'
    }
  };

  const query = new URLSearchParams(window.location.search).get('lang');
  let stored = '';
  try { stored = localStorage.getItem('safetyCoachLanguage') || ''; } catch { /* Storage is optional. */ }
  const lang = query === 'en' || query === 'zh' ? query : stored === 'en' ? 'en' : 'zh';
  try { localStorage.setItem('safetyCoachLanguage', lang); } catch { /* Storage is optional. */ }

  function t(key, values = {}) {
    const template = messages[lang][key] ?? messages.zh[key] ?? key;
    return String(template).replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? `{${name}}`));
  }

  function withLang(url) {
    const target = new URL(url, window.location.origin);
    target.searchParams.set('lang', lang);
    return `${target.pathname}${target.search}${target.hash}`;
  }

  document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
  document.querySelectorAll('[data-i18n]').forEach((node) => { node.textContent = t(node.dataset.i18n); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((node) => { node.placeholder = t(node.dataset.i18nPlaceholder); });
  document.querySelectorAll('[data-i18n-aria-label]').forEach((node) => { node.setAttribute('aria-label', t(node.dataset.i18nAriaLabel)); });
  document.querySelectorAll('[data-lang-link]').forEach((node) => { node.href = withLang(node.getAttribute('href')); });
  if (document.body.dataset.page === 'machine') document.title = t('machinePageTitle');
  if (document.body.dataset.page === 'admin') document.title = t('adminPageTitle');

  const toggle = document.getElementById('language-toggle');
  if (toggle) {
    toggle.textContent = lang === 'en' ? '中文' : 'English';
    toggle.setAttribute('aria-label', lang === 'en' ? '切换到中文' : 'Switch to English');
    toggle.addEventListener('click', () => {
      const next = lang === 'en' ? 'zh' : 'en';
      try { localStorage.setItem('safetyCoachLanguage', next); } catch { /* Storage is optional. */ }
      const url = new URL(window.location.href);
      url.searchParams.set('lang', next);
      window.location.assign(url.href);
    });
  }

  window.SafetyCoachI18n = { lang, locale: lang === 'en' ? 'en-US' : 'zh-CN', t, withLang };
})();
