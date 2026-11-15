(() => {
  'use strict';

  const page = document.body.dataset.studioPage;
  const LANG_KEY = 'studioLang';

  const I18N = {
    zh: {
      brand: '扫码安全官', brandEditor: '扫码安全官 · SOP工作室',
      backToAdmin: '返回教师仪表盘', backToList: '返回列表',
      studioTitle: 'SOP工作室', slogan: '老师傅说一遍，安全官教一万遍',
      principle: 'AI 起草，人来批准。AI 绝不自行发布任何规程。',
      principleShort: 'AI 起草，人来批准。AI 绝不自行发布。',
      pageTitleList: 'SOP工作室｜扫码安全官', pageTitleEditor: 'SOP起草与审核｜扫码安全官',
      machinesTitle: '设备规程', machinesDesc: '任何已发布设备都可以编辑并重新发布。只有“已批准”的规程才能发布。',
      newSop: '＋ 新建 SOP',
      thMachine: '设备', thId: '标识', thStatus: '状态', thVersion: '版本', thUpdated: '最近更新', thActions: '操作',
      thQuestion: '问题', thAnswer: '老师回答', thTime: '时间', thAnswerAction: '回答',
      emptyMachines: '暂无设备或草稿。点击“新建 SOP”开始。',
      faqTitle: '常见问题', faqDesc: '老师回答后，会显示在学生扫码后的“问答”页面。',
      faqEmpty: '还没有常见问题。回答下面的学生提问即可添加。',
      unansweredTitle: '学生在问（未回答）', unansweredDesc: '学生问过但规程尚未覆盖的问题。回答后会作为常见问题，显示在学生问答页面。',
      noUnanswered: '暂无待回答问题。', footer: 'AI 起草，人来批准。发布前必须由老师逐条核对并署名。',
      statPublished: '已发布设备', statVersions: '累计版本', statAvgMinutes: '平均发布耗时（分钟）',
      statusDraft: '草稿', statusReview: '审核中', statusApproved: '已批准', statusPublished: '已发布', statusRejected: '已驳回',
      editSop: '编辑规程', studentPage: '学生页', versions: '版本', editDraft: '编辑草稿', resumeDraft: '继续草稿',
      versionLabel: '第{version}版', versionLabelShort: '第{version}版',
      versionHistory: '版本历史', noVersions: '暂无版本记录。',
      rollbackTo: '回滚到此版本', rollbackConfirm: '确定回滚到第 {version} 版吗？这会新建一个版本。',
      versionLine: '第{version}版 · {by} · {time}',
      edit: '编辑', delete: '删除', save: '保存', cancel: '取消',
      answerPlaceholder: '写下老师回答…', publishAnswer: '回答并发布', answerRequired: '请先填写回答。',
      askedTimes: '被问 {count} 次', savedFaq: '已发布到学生问答页面。', deletedFaq: '已删除。',
      deleteConfirm: '确定删除这条常见问题吗？学生页面将不再显示。',
      loginRequired: '需要重新登录（教师账号验证）。', requestFailed: '请求失败，请稍后重试。',
      editorTitleNew: '起草安全操作规程', editorTitleEdit: '编辑安全操作规程',
      dictationTitle: '老师傅口述', dictationDesc: '粘贴或输入老师傅的操作过程。AI 只据此整理，绝不编造老师傅没说的步骤。',
      machineNameLabel: '设备名称', machineNamePlaceholder: '例如：钻床',
      machineIdLabel: '设备标识（可选）', machineIdPlaceholder: '留空则发布时自动生成',
      transcriptLabel: '口述内容', transcriptPlaceholder: '老师傅说：先关机，等主轴停稳……',
      draftButton: 'AI 起草', demoButton: '载入演示示例并起草',
      draftHint: 'AI 不可用时可点“载入演示示例并起草”，用内置示例走完整流程。',
      contentTitle: '规程内容', contentDesc: '逐条核对并编辑。所有内容都会被安全地转义和截断。',
      titleLabel: '规程标题', purposeLabel: '目的（一句话）', ppeLabel: '个人防护装备（每行一项）',
      rulesHeading: '规则', rulesDesc: '标为“AI建议·待确认”的规则必须逐条确认后才能审核。', addRule: '＋ 添加规则',
      dangerHeading: '危险点（每行一项）', stopHeading: '必须停机并询问老师的情况（每行一项）',
      checklistHeading: '开机前检查（每行一项）',
      gapsHeading: '待补充问题', gapsDesc: '老师傅没讲清楚的，列在这里；可填写答案后“用答案完善草稿”。',
      quizHeading: '小测题目草稿',
      saveDraft: '保存草稿', answerGaps: '用答案完善草稿（AI）',
      reviewTitle: '人工审核', reviewDesc: 'AI 不能发布。必须由老师逐条核对、勾选确认并署名。',
      reviewerLabel: '审核人姓名', reviewerPlaceholder: '请输入真实姓名（2-20字）',
      confirmRules: '我已逐条核对所有规则，无误、无编造。',
      confirmRequirements: '规程符合实训中心实际要求。',
      confirmGaps: '我知道仍有未回答的问题，仍要批准。',
      submitReview: '提交审核',
      publishTitle: '发布到安全官', publishDesc: '发布会写入学生可访问的规程页面，并重新生成简报与小测。',
      publishButton: '发布到安全官', publishing: '发布中…',
      ruleIndex: '规则{number}', sourceMaster: '师傅口述', sourceAi: 'AI建议·待确认', sourceReviewed: '已确认',
      dangerRule: '危险规则（预防伤害）', confirmAiRule: '确认采用这条 AI 建议', deleteRule: '删除',
      ruleTextPlaceholder: '规则内容（一句话）', ruleWhyPlaceholder: '为什么（简短理由）',
      gapWhyPrefix: '为什么重要：', gapAnswerPlaceholder: '答案（可选，填写后可用“用答案完善草稿”）',
      quizIndexLabel: '对应规则序号：', quizQuestionPlaceholder: '题目 {number}',
      unnamedMachine: '未命名设备', statusPrefix: '状态：', savedDraft: '已保存草稿。',
      approvedMsg: '已批准，可以发布。', publishedTitle: '已发布到安全官',
      publishedMeta: '设备：{name} · 第{version}版 · 审核：{by}',
      qrAlt: '学生页面二维码', openStudentPage: '打开学生页', drafting: '起草中…'
    },
    en: {
      brand: 'Safety Coach', brandEditor: 'Safety Coach · SOP Studio',
      backToAdmin: 'Back to dashboard', backToList: 'Back to list',
      studioTitle: 'SOP Studio', slogan: 'The master says it once. The Coach teaches everyone.',
      principle: 'AI drafts. A human approves. AI never publishes an SOP by itself.',
      principleShort: 'AI drafts. A human approves. AI never publishes.',
      pageTitleList: 'SOP Studio | Safety Coach', pageTitleEditor: 'Draft & approve SOP | Safety Coach',
      machinesTitle: 'Machine SOPs', machinesDesc: 'Any published machine can be edited and republished. Only approved SOPs can be published.',
      newSop: '+ New SOP',
      thMachine: 'Machine', thId: 'ID', thStatus: 'Status', thVersion: 'Version', thUpdated: 'Last updated', thActions: 'Actions',
      thQuestion: 'Question', thAnswer: 'Instructor answer', thTime: 'Time', thAnswerAction: 'Answer',
      emptyMachines: 'No machines or drafts yet. Click "New SOP" to start.',
      faqTitle: 'Frequently asked questions', faqDesc: 'Instructor answers appear on the student Q&A page after scanning.',
      faqEmpty: 'No FAQs yet. Answer a student question below to add one.',
      unansweredTitle: 'Students asking (unanswered)', unansweredDesc: 'Questions the SOP does not cover. Your answer is published as an FAQ on the student page.',
      noUnanswered: 'No unanswered questions.', footer: 'AI drafts. A human approves. Every SOP must be checked and signed by the instructor before publishing.',
      statPublished: 'Published machines', statVersions: 'Total versions', statAvgMinutes: 'Avg minutes to publish',
      statusDraft: 'Draft', statusReview: 'In review', statusApproved: 'Approved', statusPublished: 'Published', statusRejected: 'Rejected',
      editSop: 'Edit SOP', studentPage: 'Student page', versions: 'Versions', editDraft: 'Edit draft', resumeDraft: 'Resume draft',
      versionLabel: 'v{version}', versionLabelShort: 'v{version}',
      versionHistory: 'Version history', noVersions: 'No versions recorded.',
      rollbackTo: 'Roll back to this version', rollbackConfirm: 'Roll back to v{version}? This creates a new version.',
      versionLine: 'v{version} · {by} · {time}',
      edit: 'Edit', delete: 'Delete', save: 'Save', cancel: 'Cancel',
      answerPlaceholder: 'Write the instructor answer…', publishAnswer: 'Answer & publish', answerRequired: 'Please write an answer first.',
      askedTimes: 'Asked {count}×', savedFaq: 'Published to the student Q&A page.', deletedFaq: 'Deleted.',
      deleteConfirm: 'Delete this FAQ? It will disappear from the student page.',
      loginRequired: 'Please sign in again (instructor account).', requestFailed: 'Request failed. Please try again.',
      editorTitleNew: 'Draft a machine SOP', editorTitleEdit: 'Edit machine SOP',
      dictationTitle: "Master's dictation", dictationDesc: 'Paste what the master said. The AI only organizes it and never invents steps the master did not mention.',
      machineNameLabel: 'Machine name', machineNamePlaceholder: 'e.g. Drill Press',
      machineIdLabel: 'Machine ID (optional)', machineIdPlaceholder: 'Leave blank to generate one on publish',
      transcriptLabel: 'Dictation', transcriptPlaceholder: 'The master said: switch off, wait for the spindle to stop…',
      draftButton: 'AI draft', demoButton: 'Load demo sample and draft',
      draftHint: 'If AI is unavailable, click "Load demo sample and draft" to walk through the whole flow offline.',
      contentTitle: 'SOP content', contentDesc: 'Review and edit every item. All content is escaped and truncated safely.',
      titleLabel: 'SOP title', purposeLabel: 'Purpose (one sentence)', ppeLabel: 'PPE (one per line)',
      rulesHeading: 'Rules', rulesDesc: 'Rules marked "AI suggestion · unconfirmed" must be confirmed one by one before approval.', addRule: '+ Add rule',
      dangerHeading: 'Hazards (one per line)', stopHeading: 'Stop and ask the instructor when (one per line)',
      checklistHeading: 'Pre-start checks (one per line)',
      gapsHeading: 'Open questions', gapsDesc: 'What the master left unclear. Add answers, then use "Improve draft with answers".',
      quizHeading: 'Quiz question drafts',
      saveDraft: 'Save draft', answerGaps: 'Improve draft with answers (AI)',
      reviewTitle: 'Human review', reviewDesc: 'The AI cannot publish. The instructor must check every rule, tick the confirmations, and sign.',
      reviewerLabel: 'Reviewer name', reviewerPlaceholder: 'Real name (2-20 characters)',
      confirmRules: 'I checked every rule. Nothing is wrong or invented.',
      confirmRequirements: 'This SOP matches the training center\'s real requirements.',
      confirmGaps: 'I know some questions are still unanswered and I still want to approve.',
      submitReview: 'Submit for review',
      publishTitle: 'Publish to Safety Coach', publishDesc: 'Publishing writes the student-facing SOP page and regenerates the briefing and quiz.',
      publishButton: 'Publish to Safety Coach', publishing: 'Publishing…',
      ruleIndex: 'Rule {number}', sourceMaster: "Master's words", sourceAi: 'AI suggestion · unconfirmed', sourceReviewed: 'Confirmed',
      dangerRule: 'Hazard rule (injury prevention)', confirmAiRule: 'Confirm this AI suggestion', deleteRule: 'Delete',
      ruleTextPlaceholder: 'Rule text (one sentence)', ruleWhyPlaceholder: 'Why (short reason)',
      gapWhyPrefix: 'Why it matters: ', gapAnswerPlaceholder: 'Answer (optional, then use "Improve draft with answers")',
      quizIndexLabel: 'Rule number: ', quizQuestionPlaceholder: 'Question {number}',
      unnamedMachine: 'Unnamed machine', statusPrefix: 'Status: ', savedDraft: 'Draft saved.',
      approvedMsg: 'Approved. Ready to publish.', publishedTitle: 'Published to Safety Coach',
      publishedMeta: 'Machine: {name} · v{version} · Reviewer: {by}',
      qrAlt: 'Student page QR code', openStudentPage: 'Open student page', drafting: 'Drafting…'
    }
  };

  let currentLang = (() => {
    try { return localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'zh'; } catch { return 'zh'; }
  })();

  function t(key, vars) {
    const raw = (I18N[currentLang] && I18N[currentLang][key]) || (I18N.zh[key] || key);
    if (!vars) return raw;
    return raw.replace(/\{(\w+)\}/g, (match, name) => (vars[name] === undefined ? match : String(vars[name])));
  }

  let rerender = () => {};

  function applyStatic() {
    document.documentElement.lang = currentLang === 'en' ? 'en' : 'zh-CN';
    document.title = page === 'list' ? t('pageTitleList') : t('pageTitleEditor');
    document.querySelectorAll('[data-i18n]').forEach((node) => {
      node.textContent = t(node.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((node) => {
      node.placeholder = t(node.dataset.i18nPlaceholder);
    });
    const toggle = document.getElementById('studio-lang');
    if (toggle) toggle.textContent = currentLang === 'zh' ? 'English' : '中文';
  }

  function setupLanguageToggle() {
    const toggle = document.getElementById('studio-lang');
    if (!toggle) return;
    toggle.addEventListener('click', () => {
      currentLang = currentLang === 'zh' ? 'en' : 'zh';
      try { localStorage.setItem(LANG_KEY, currentLang); } catch { /* ignore */ }
      applyStatic();
      rerender();
    });
  }

  // Build an element. `content` may be text or an existing DOM node.
  function el(tag, className, content) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content instanceof Node) node.append(content);
    else if (content !== undefined) node.textContent = content;
    return node;
  }

  function alertBox(message) {
    const box = document.getElementById('studio-alert');
    if (!box) return;
    box.textContent = message || '';
    box.hidden = !message;
  }

  function formatTime(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat(currentLang === 'en' ? 'en-GB' : 'zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false
    }).format(date);
  }

  async function api(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: options.body ? { 'Content-Type': 'application/json', ...options.headers } : options.headers
    });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) throw new Error(t('loginRequired'));
    if (!response.ok) throw new Error(data.error || t('requestFailed'));
    return data;
  }

  const STATUS_CLASS = {
    draft: 'status-pill-draft', in_review: 'status-pill-review',
    approved: 'status-pill-approved', published: 'status-pill-published', rejected: 'status-pill-rejected'
  };
  const STATUS_KEY = {
    draft: 'statusDraft', in_review: 'statusReview', approved: 'statusApproved',
    published: 'statusPublished', rejected: 'statusRejected'
  };

  function statusPill(status) {
    return el('span', `status-pill ${STATUS_CLASS[status] || 'status-pill-draft'}`, t(STATUS_KEY[status] || 'statusDraft'));
  }

  function actionLink(href, label, newTab, extraClass) {
    const link = el('a', `link-button${extraClass ? ` ${extraClass}` : ''}`, label);
    link.href = href;
    if (newTab) { link.target = '_blank'; link.rel = 'noopener'; }
    return link;
  }

  function button(label, className, onClick) {
    const node = el('button', className || 'link-button', label);
    node.type = 'button';
    if (onClick) node.addEventListener('click', onClick);
    return node;
  }

  /* ============================ LIST PAGE ============================ */

  if (page === 'list') {
    const data = { machines: [], stats: null, faq: [], unanswered: [] };

    async function loadList() {
      try {
        const [list, stats, faq, unanswered] = await Promise.all([
          api('/api/studio/list'), api('/api/studio/stats'),
          api('/api/studio/faq'), api('/api/studio/unanswered')
        ]);
        data.machines = list.machines;
        data.stats = stats;
        data.faq = faq.items;
        data.unanswered = unanswered.questions;
        renderAll();
        alertBox('');
      } catch (error) {
        alertBox(error.message);
      }
    }

    function renderAll() {
      renderStats();
      renderMachines();
      renderFaq();
      renderUnanswered();
    }
    rerender = renderAll;

    function renderStats() {
      const root = document.getElementById('studio-stats');
      const stats = data.stats || { publishedMachines: 0, totalVersions: 0, avgMinutesToPublish: null };
      const items = [
        [t('statPublished'), stats.publishedMachines],
        [t('statVersions'), stats.totalVersions],
        [t('statAvgMinutes'), stats.avgMinutesToPublish == null ? '—' : stats.avgMinutesToPublish]
      ];
      const fragment = document.createDocumentFragment();
      items.forEach(([label, value]) => {
        const card = el('div', 'studio-stat');
        card.append(el('strong', '', String(value)), el('span', '', label));
        fragment.append(card);
      });
      root.replaceChildren(fragment);
    }

    function machineActions(machine) {
      const wrap = el('div', 'studio-actions');
      if (machine.status === 'published') {
        // Always offer editing. Opening the editor resumes an in-progress draft
        // if one exists, so the action never disappears.
        wrap.append(actionLink(`/studio/edit/${encodeURIComponent(machine.id)}`, t('editSop'), false, 'primary-link'));
        wrap.append(actionLink(`/m/${encodeURIComponent(machine.id)}`, t('studentPage'), true));
        if (machine.version > 0) {
          wrap.append(button(t('versions'), 'link-button', () => toggleVersions(machine.id)));
        }
      } else if (machine.draftId) {
        wrap.append(actionLink(`/studio/${encodeURIComponent(machine.draftId)}`, t('editDraft'), false, 'primary-link'));
      }
      return wrap;
    }

    function renderMachines() {
      const tbody = document.getElementById('studio-machines');
      const empty = document.getElementById('studio-machines-empty');
      const fragment = document.createDocumentFragment();
      data.machines.forEach((machine) => {
        const row = document.createElement('tr');
        row.dataset.machineId = machine.id;
        const nameCell = document.createElement('td');
        nameCell.append(el('strong', '', machine.name));
        if (machine.description) nameCell.append(el('small', '', machine.description));
        row.append(
          nameCell,
          el('td', 'machine-code', machine.id),
          el('td', '', statusPill(machine.status)),
          el('td', '', machine.status === 'published' ? t('versionLabel', { version: machine.version }) : '—'),
          el('td', 'time-cell', formatTime(machine.updatedAt)),
          el('td', '', machineActions(machine))
        );
        fragment.append(row);
      });
      tbody.replaceChildren(fragment);
      empty.hidden = data.machines.length > 0;
      tbody.closest('table').hidden = data.machines.length === 0;
    }

    async function toggleVersions(machineId) {
      const existing = document.getElementById(`versions-${machineId}`);
      if (existing) { existing.remove(); return; }
      try {
        const result = await api(`/api/studio/versions/${encodeURIComponent(machineId)}`);
        const row = document.createElement('tr');
        row.id = `versions-${machineId}`;
        const cell = document.createElement('td');
        cell.colSpan = 6;
        const box = el('div', 'publish-result');
        box.append(el('h4', 'version-heading', t('versionHistory')));
        if (!result.versions.length) box.append(el('p', 'empty-state', t('noVersions')));
        result.versions.forEach((version) => {
          const line = el('div', 'version-row');
          const note = version.change_note ? `（${version.change_note}）` : '';
          line.append(
            el('span', '', `${t('versionLine', { version: version.version, by: version.approved_by, time: formatTime(version.approved_at) })}${note}`),
            button(t('rollbackTo'), 'link-button danger', () => rollback(machineId, version.version))
          );
          box.append(line);
        });
        cell.append(box);
        row.append(cell);
        const anchor = document.querySelector(`#studio-machines tr[data-machine-id="${machineId}"]`);
        if (anchor) anchor.after(row);
      } catch (error) {
        alertBox(error.message);
      }
    }

    async function rollback(machineId, version) {
      if (!window.confirm(t('rollbackConfirm', { version }))) return;
      try {
        await api('/api/studio/rollback', { method: 'POST', body: JSON.stringify({ machineId, version }) });
        loadList();
      } catch (error) {
        alertBox(error.message);
      }
    }

    function renderFaq() {
      const tbody = document.getElementById('studio-faq');
      const empty = document.getElementById('studio-faq-empty');
      const fragment = document.createDocumentFragment();
      data.faq.forEach((item) => {
        const row = document.createElement('tr');
        const answerCell = document.createElement('td');
        answerCell.className = 'faq-answer-cell';
        answerCell.append(el('p', 'faq-answer-text', item.answer));
        const actions = el('div', 'studio-actions');
        actions.append(
          button(t('edit'), 'link-button', () => startEditFaq(row, answerCell, item)),
          button(t('delete'), 'link-button danger', () => removeFaq(item))
        );
        row.append(el('td', '', item.machineName), el('td', '', item.question), answerCell, el('td', '', actions));
        fragment.append(row);
      });
      tbody.replaceChildren(fragment);
      empty.hidden = data.faq.length > 0;
      tbody.closest('table').hidden = data.faq.length === 0;
    }

    function startEditFaq(row, cell, item) {
      cell.replaceChildren();
      const textarea = document.createElement('textarea');
      textarea.rows = 3;
      textarea.maxLength = 1000;
      textarea.value = item.answer;
      const actions = el('div', 'studio-actions');
      actions.append(
        button(t('save'), 'button primary', async () => {
          const answer = textarea.value.trim();
          if (!answer) { alertBox(t('answerRequired')); return; }
          try {
            await api('/api/studio/faq', {
              method: 'POST',
              body: JSON.stringify({ id: item.id, machineId: item.machineId, question: item.question, answer })
            });
            alertBox(t('savedFaq'));
            loadList();
          } catch (error) { alertBox(error.message); }
        }),
        button(t('cancel'), 'link-button', () => { alertBox(''); loadList(); })
      );
      cell.append(textarea, actions);
    }

    async function removeFaq(item) {
      if (!window.confirm(t('deleteConfirm'))) return;
      try {
        await api(`/api/studio/faq/${encodeURIComponent(item.id)}`, { method: 'DELETE' });
        alertBox(t('deletedFaq'));
        loadList();
      } catch (error) { alertBox(error.message); }
    }

    function renderUnanswered() {
      const tbody = document.getElementById('studio-unanswered');
      const empty = document.getElementById('studio-unanswered-empty');
      const fragment = document.createDocumentFragment();
      data.unanswered.forEach((question) => {
        const row = document.createElement('tr');

        const questionCell = document.createElement('td');
        questionCell.append(el('p', 'faq-question', question.question));
        questionCell.append(el('span', 'asked-badge', t('askedTimes', { count: question.count })));

        const answerCell = document.createElement('td');
        const textarea = document.createElement('textarea');
        textarea.rows = 2;
        textarea.maxLength = 1000;
        textarea.placeholder = t('answerPlaceholder');
        const publish = button(t('publishAnswer'), 'button primary', async () => {
          const answer = textarea.value.trim();
          if (!answer) { alertBox(t('answerRequired')); return; }
          publish.disabled = true;
          try {
            await api('/api/studio/faq', {
              method: 'POST',
              body: JSON.stringify({
                machineId: question.machineId,
                question: question.question,
                answer,
                sourceQuestionId: question.id
              })
            });
            alertBox(t('savedFaq'));
            loadList();
          } catch (error) {
            alertBox(error.message);
            publish.disabled = false;
          }
        });
        answerCell.append(textarea, el('div', 'studio-actions'));
        answerCell.lastChild.append(publish);

        row.append(
          el('td', 'time-cell', formatTime(question.createdAt)),
          el('td', '', question.machineName),
          questionCell,
          answerCell
        );
        fragment.append(row);
      });
      tbody.replaceChildren(fragment);
      empty.hidden = data.unanswered.length > 0;
      tbody.closest('table').hidden = data.unanswered.length === 0;
    }

    applyStatic();
    setupLanguageToggle();
    loadList();
    return;
  }

  /* ============================ EDITOR PAGE ============================ */

  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const lastPart = pathParts[pathParts.length - 1];
  const isNew = window.location.pathname.endsWith('/new') || lastPart === 'new';

  const state = {
    draftId: null,
    machineNameZh: '',
    status: 'draft',
    draft: null
  };

  const SOURCE_CLASS = { master: 'source-master', ai_suggested: 'source-ai', reviewed: 'source-reviewed' };
  const SOURCE_KEY = { master: 'sourceMaster', ai_suggested: 'sourceAi', reviewed: 'sourceReviewed' };

  function readLines(id) {
    return document.getElementById(id).value.split('\n').map((s) => s.trim()).filter(Boolean);
  }

  function buildRuleCard(rule, index) {
    const card = el('div', 'rule-card');
    const head = el('div', 'rule-card-head');
    head.append(
      el('span', 'rule-index', t('ruleIndex', { number: index + 1 })),
      el('span', `source-badge ${SOURCE_CLASS[rule.source] || 'source-master'}`, t(SOURCE_KEY[rule.source] || 'sourceMaster'))
    );
    const del = button(t('deleteRule'), 'rule-delete', () => card.remove());
    head.append(del);
    card.append(head);

    const textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.maxLength = 300;
    textInput.placeholder = t('ruleTextPlaceholder');
    textInput.value = rule.text || '';
    textInput.className = 'rule-text';
    card.append(textInput);

    const whyInput = document.createElement('input');
    whyInput.type = 'text';
    whyInput.maxLength = 200;
    whyInput.placeholder = t('ruleWhyPlaceholder');
    whyInput.value = rule.why || '';
    whyInput.className = 'rule-why';
    card.append(whyInput);

    const danger = el('label', 'rule-danger');
    const dangerInput = document.createElement('input');
    dangerInput.type = 'checkbox';
    dangerInput.className = 'rule-danger-input';
    dangerInput.checked = !!rule.danger;
    danger.append(dangerInput, document.createTextNode(t('dangerRule')));
    card.append(danger);

    if (rule.source !== 'master') {
      const confirm = el('label', 'rule-confirm');
      const confirmInput = document.createElement('input');
      confirmInput.type = 'checkbox';
      confirmInput.className = 'rule-confirm-input';
      confirmInput.checked = rule.source === 'reviewed';
      confirm.append(confirmInput, document.createTextNode(t('confirmAiRule')));
      card.append(confirm);
    }

    return card;
  }

  function collectRules() {
    const out = [];
    document.querySelectorAll('#rules-list .rule-card').forEach((card) => {
      const text = card.querySelector('.rule-text').value.trim();
      if (!text) return;
      const why = card.querySelector('.rule-why').value.trim();
      const danger = card.querySelector('.rule-danger-input').checked;
      const badge = card.querySelector('.source-badge');
      const originalSource = badge && badge.classList.contains('source-master') ? 'master'
        : badge && badge.classList.contains('source-reviewed') ? 'reviewed' : 'ai_suggested';
      const confirmInput = card.querySelector('.rule-confirm-input');
      const source = originalSource === 'master' ? 'master' : (confirmInput && confirmInput.checked ? 'reviewed' : 'ai_suggested');
      out.push({ text, why, source, danger });
    });
    return out;
  }

  function buildGapCard(gap) {
    const card = el('div', 'gap-card');
    card.append(el('p', 'gap-question', gap.question));
    if (gap.why_it_matters) card.append(el('p', 'gap-why', `${t('gapWhyPrefix')}${gap.why_it_matters}`));
    const answer = document.createElement('textarea');
    answer.rows = 2;
    answer.placeholder = t('gapAnswerPlaceholder');
    answer.value = gap.answer || '';
    answer.className = 'gap-answer';
    card.append(answer);
    return card;
  }

  function collectGaps() {
    return [...document.querySelectorAll('#gaps-list .gap-card')].map((card) => ({
      question: card.querySelector('.gap-question').textContent,
      why_it_matters: card.querySelector('.gap-why')
        ? card.querySelector('.gap-why').textContent.replace(t('gapWhyPrefix'), '')
        : '',
      answer: card.querySelector('.gap-answer').value.trim()
    }));
  }

  function buildQuizCard(seed, index) {
    const card = el('div', 'quiz-card');
    const question = document.createElement('input');
    question.type = 'text';
    question.maxLength = 200;
    question.placeholder = t('quizQuestionPlaceholder', { number: index + 1 });
    question.value = seed.question || '';
    question.className = 'quiz-question';
    const ruleWrap = el('label', 'quiz-rule');
    ruleWrap.append(document.createTextNode(t('quizIndexLabel')));
    const ruleIndex = document.createElement('input');
    ruleIndex.type = 'number';
    ruleIndex.min = 0;
    ruleIndex.value = String(seed.rule_index || 0);
    ruleIndex.className = 'quiz-rule-index';
    ruleWrap.append(ruleIndex);
    card.append(question, ruleWrap);
    return card;
  }

  function collectQuiz() {
    const out = [];
    document.querySelectorAll('#quiz-list .quiz-card').forEach((card) => {
      const question = card.querySelector('.quiz-question').value.trim();
      if (!question) return;
      out.push({ question, rule_index: Number(card.querySelector('.quiz-rule-index').value) || 0 });
    });
    return out;
  }

  function collectForm() {
    return {
      title: document.getElementById('draft-title').value.trim(),
      purpose: document.getElementById('draft-purpose').value.trim(),
      ppe: readLines('draft-ppe'),
      rules: collectRules(),
      danger_points: readLines('draft-danger'),
      stop_conditions: readLines('draft-stop'),
      checklist: readLines('draft-checklist'),
      gaps: collectGaps(),
      quiz_seed: collectQuiz()
    };
  }

  function renderEditor() {
    if (!state.draft) return;
    const draft = state.draft;
    document.getElementById('draft-title').value = draft.title || '';
    document.getElementById('draft-purpose').value = draft.purpose || '';
    document.getElementById('draft-ppe').value = (draft.ppe || []).join('\n');
    document.getElementById('draft-danger').value = (draft.danger_points || []).join('\n');
    document.getElementById('draft-stop').value = (draft.stop_conditions || []).join('\n');
    document.getElementById('draft-checklist').value = (draft.checklist || []).join('\n');

    const rulesList = document.getElementById('rules-list');
    rulesList.replaceChildren();
    (draft.rules || []).forEach((rule, index) => rulesList.append(buildRuleCard(rule, index)));

    const gapsList = document.getElementById('gaps-list');
    gapsList.replaceChildren();
    (draft.gaps || []).forEach((gap) => gapsList.append(buildGapCard(gap)));

    const quizList = document.getElementById('quiz-list');
    quizList.replaceChildren();
    (draft.quiz_seed || []).forEach((seed, index) => quizList.append(buildQuizCard(seed, index)));

    updateStatusbar();
    document.getElementById('publish-panel').hidden = state.status !== 'approved';
  }
  rerender = renderEditor;

  function updateStatusbar() {
    const bar = document.getElementById('editor-statusbar');
    bar.replaceChildren();
    bar.append(
      el('strong', '', state.machineNameZh || t('unnamedMachine')),
      statusPill(state.status),
      el('span', 'muted', `${state.draftId || ''} · ${t('statusPrefix')}${t(STATUS_KEY[state.status] || 'statusDraft')}`)
    );
  }

  async function loadDraft() {
    try {
      const result = await api(`/api/studio/draft/${encodeURIComponent(state.draftId)}`);
      state.machineNameZh = result.machineNameZh;
      state.status = result.status;
      state.draft = result.draft;
      const title = document.getElementById('editor-title');
      title.dataset.i18n = 'editorTitleEdit';
      title.textContent = t('editorTitleEdit');
      document.getElementById('new-draft-panel').hidden = true;
      document.getElementById('editor-panel').hidden = false;
      renderEditor();
      alertBox('');
    } catch (error) {
      alertBox(error.message);
    }
  }

  async function saveDraft() {
    try {
      const result = await api(`/api/studio/draft/${encodeURIComponent(state.draftId)}`, {
        method: 'PUT', body: JSON.stringify(collectForm())
      });
      state.draft = result.draft;
      state.status = result.status;
      renderEditor();
      alertBox(t('savedDraft'));
    } catch (error) {
      alertBox(error.message);
    }
  }

  async function submitApprove() {
    try {
      await api('/api/studio/approve', {
        method: 'POST',
        body: JSON.stringify({
          draftId: state.draftId,
          reviewerName: document.getElementById('reviewer-name').value.trim(),
          confirmations: {
            rulesChecked: document.getElementById('confirm-rules').checked,
            requirementsChecked: document.getElementById('confirm-requirements').checked,
            gapsAcknowledged: document.getElementById('confirm-gaps').checked
          }
        })
      });
      state.status = 'approved';
      updateStatusbar();
      document.getElementById('publish-panel').hidden = false;
      alertBox(t('approvedMsg'));
    } catch (error) {
      alertBox(error.message);
    }
  }

  async function submitPublish() {
    const publishButton = document.getElementById('publish-button');
    publishButton.disabled = true;
    publishButton.textContent = t('publishing');
    try {
      const result = await api('/api/studio/publish', {
        method: 'POST', body: JSON.stringify({ draftId: state.draftId })
      });
      state.status = 'published';
      updateStatusbar();
      renderPublishResult(result);
      alertBox('');
    } catch (error) {
      alertBox(error.message);
    } finally {
      publishButton.disabled = false;
      publishButton.textContent = t('publishButton');
    }
  }

  function renderPublishResult(result) {
    const box = document.getElementById('publish-result');
    box.hidden = false;
    box.replaceChildren();
    box.append(el('h4', '', t('publishedTitle')));
    box.append(el('p', '', t('publishedMeta', { name: result.name, version: result.version, by: result.approvedBy })));
    const img = document.createElement('img');
    img.src = result.qrDataUrl;
    img.alt = t('qrAlt');
    box.append(img);
    const link = el('a', 'student-link', result.studentUrl);
    link.href = result.studentUrl;
    link.target = '_blank';
    link.rel = 'noopener';
    box.append(link);
    const open = el('a', 'button primary', t('openStudentPage'));
    open.href = result.studentUrl;
    open.target = '_blank';
    open.rel = 'noopener';
    box.append(open);
  }

  async function answerGaps() {
    const answers = collectGaps().filter((gap) => gap.answer);
    if (!answers.length) { alertBox(t('answerRequired')); return; }
    const node = document.getElementById('answer-gaps');
    node.disabled = true;
    node.textContent = t('drafting');
    try {
      const result = await api('/api/studio/gaps', {
        method: 'POST', body: JSON.stringify({ draftId: state.draftId, answers })
      });
      state.draft = result.draft;
      renderEditor();
      alertBox(t('savedDraft'));
    } catch (error) {
      alertBox(error.message);
    } finally {
      node.disabled = false;
      node.textContent = t('answerGaps');
    }
  }

  function initNew() {
    document.getElementById('new-draft-panel').hidden = false;
    document.getElementById('editor-panel').hidden = true;
    const params = new URLSearchParams(window.location.search);
    if (params.get('q')) document.getElementById('transcript').value = params.get('q');
    if (params.get('machineName')) document.getElementById('machine-name').value = params.get('machineName');
    if (params.get('machine')) document.getElementById('machine-id').value = params.get('machine');

    document.getElementById('draft-button').addEventListener('click', () => submitNew(false));
    document.getElementById('demo-button').addEventListener('click', () => submitNew(true));
  }

  async function submitNew(demo) {
    const node = demo ? document.getElementById('demo-button') : document.getElementById('draft-button');
    node.disabled = true;
    node.textContent = t('drafting');
    try {
      const result = await api('/api/studio/draft', {
        method: 'POST',
        body: JSON.stringify({
          machineNameZh: document.getElementById('machine-name').value.trim(),
          machineId: document.getElementById('machine-id').value.trim(),
          transcript: document.getElementById('transcript').value.trim(),
          demo
        })
      });
      window.location.assign(`/studio/${encodeURIComponent(result.draftId)}`);
    } catch (error) {
      alertBox(error.message);
      node.disabled = false;
      node.textContent = t(demo ? 'demoButton' : 'draftButton');
    }
  }

  applyStatic();
  setupLanguageToggle();

  if (isNew) {
    initNew();
  } else {
    state.draftId = lastPart;
    document.getElementById('new-draft-panel').hidden = true;
    document.getElementById('editor-panel').hidden = false;
    document.getElementById('save-draft').addEventListener('click', saveDraft);
    document.getElementById('add-rule').addEventListener('click', () => {
      const count = document.querySelectorAll('#rules-list .rule-card').length;
      document.getElementById('rules-list').append(buildRuleCard({ text: '', why: '', source: 'master', danger: false }, count));
    });
    document.getElementById('approve-button').addEventListener('click', submitApprove);
    document.getElementById('publish-button').addEventListener('click', submitPublish);
    document.getElementById('answer-gaps').addEventListener('click', answerGaps);
    loadDraft();
  }
})();
