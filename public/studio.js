(() => {
  'use strict';

  const page = document.body.dataset.studioPage;

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
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
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false
    }).format(new Date(value));
  }

  async function api(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: options.body ? { 'Content-Type': 'application/json', ...options.headers } : options.headers
    });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) {
      throw new Error('需要重新登录（教师账号验证）。');
    }
    if (!response.ok) throw new Error(data.error || '请求失败，请稍后重试。');
    return data;
  }

  const STATUS_LABELS = {
    draft: '草稿', in_review: '审核中', approved: '已批准', published: '已发布', rejected: '已驳回'
  };
  const STATUS_CLASS = {
    draft: 'status-pill-draft', in_review: 'status-pill-review',
    approved: 'status-pill-approved', published: 'status-pill-published', rejected: 'status-pill-rejected'
  };

  function statusPill(status) {
    return el('span', `status-pill ${STATUS_CLASS[status] || 'status-pill-draft'}`, STATUS_LABELS[status] || status);
  }

  /* ============================ LIST PAGE ============================ */

  if (page === 'list') {
    async function loadList() {
      try {
        const [list, stats, unanswered] = await Promise.all([
          api('/api/studio/list'), api('/api/studio/stats'), api('/api/studio/unanswered')
        ]);
        renderStats(stats);
        renderMachines(list.machines);
        renderUnanswered(unanswered.questions);
        alertBox('');
      } catch (error) {
        alertBox(error.message);
      }
    }

    function renderStats(stats) {
      const root = document.getElementById('studio-stats');
      const items = [
        ['已发布设备', stats.publishedMachines],
        ['累计版本', stats.totalVersions],
        ['平均发布耗时（分钟）', stats.avgMinutesToPublish == null ? '—' : stats.avgMinutesToPublish]
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
        wrap.append(
          actionLink(`/studio/new?machine=${encodeURIComponent(machine.id)}&machineName=${encodeURIComponent(machine.name)}`, '编辑规程', false),
          actionLink(`/m/${encodeURIComponent(machine.id)}`, '学生页', true)
        );
        if (machine.version > 0) {
          const versionBtn = el('button', 'link-button', '版本');
          versionBtn.type = 'button';
          versionBtn.addEventListener('click', () => toggleVersions(machine.id, versionBtn));
          wrap.append(versionBtn);
        }
      } else {
        wrap.append(actionLink(`/studio/${encodeURIComponent(machine.draftId)}`, '编辑草稿', false));
      }
      return wrap;
    }

    function actionLink(href, label, newTab) {
      const link = el('a', 'link-button', label);
      link.href = href;
      if (newTab) { link.target = '_blank'; link.rel = 'noopener'; }
      return link;
    }

    function renderMachines(machines) {
      const tbody = document.getElementById('studio-machines');
      const empty = document.getElementById('studio-machines-empty');
      const fragment = document.createDocumentFragment();
      machines.forEach((machine) => {
        const row = document.createElement('tr');
        const nameCell = document.createElement('td');
        nameCell.append(el('strong', '', machine.name));
        if (machine.description) nameCell.append(el('small', '', machine.description));
        row.append(
          nameCell,
          el('td', 'machine-code', machine.id),
          el('td', '', statusPill(machine.status)),
          el('td', '', machine.status === 'published' ? `第${machine.version}版` : '—'),
          el('td', 'time-cell', formatTime(machine.updatedAt)),
          el('td', '', machineActions(machine))
        );
        fragment.append(row);
      });
      tbody.replaceChildren(fragment);
      empty.hidden = machines.length > 0;
      tbody.closest('table').hidden = machines.length === 0;
    }

    async function toggleVersions(machineId, button) {
      const existing = document.getElementById(`versions-${machineId}`);
      if (existing) { existing.remove(); return; }
      try {
        const data = await api(`/api/studio/versions/${encodeURIComponent(machineId)}`);
        const row = document.createElement('tr');
        row.id = `versions-${machineId}`;
        const cell = document.createElement('td');
        cell.colSpan = 6;
        const box = el('div', 'publish-result');
        const heading = el('h4', '', '版本历史');
        heading.style.margin = '0 0 10px';
        box.append(heading);
        if (!data.versions.length) box.append(el('p', 'empty-state', '暂无版本记录。'));
        data.versions.forEach((version) => {
          const line = document.createElement('div');
          line.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;';
          const info = el('span', '', `第${version.version}版 · ${version.approved_by} · ${formatTime(version.approved_at)}${version.change_note ? `（${version.change_note}）` : ''}`);
          const rollback = el('button', 'link-button danger', '回滚到此版本');
          rollback.type = 'button';
          rollback.addEventListener('click', () => rollback(machineId, version.version));
          line.append(info, rollback);
          box.append(line);
        });
        cell.append(box);
        row.append(cell);
        button.closest('tr').after(row);
      } catch (error) {
        alertBox(error.message);
      }
    }

    async function rollback(machineId, version) {
      if (!window.confirm(`确定回滚到第 ${version} 版吗？这会新建一个版本。`)) return;
      try {
        await api('/api/studio/rollback', {
          method: 'POST', body: JSON.stringify({ machineId, version })
        });
        loadList();
      } catch (error) {
        alertBox(error.message);
      }
    }

    function renderUnanswered(questions) {
      const tbody = document.getElementById('studio-unanswered');
      const empty = document.getElementById('studio-unanswered-empty');
      const fragment = document.createDocumentFragment();
      questions.forEach((question) => {
        const row = document.createElement('tr');
        const action = el('a', 'link-button', '据此起草');
        const params = new URLSearchParams({ q: question.question });
        if (question.machineId) params.set('machine', question.machineId);
        if (question.machineName) params.set('machineName', question.machineName);
        action.href = `/studio/new?${params.toString()}`;
        row.append(
          el('td', 'time-cell', formatTime(question.createdAt)),
          el('td', '', question.machineName),
          el('td', '', question.question),
          el('td', '', action)
        );
        fragment.append(row);
      });
      tbody.replaceChildren(fragment);
      empty.hidden = questions.length > 0;
      tbody.closest('table').hidden = questions.length === 0;
    }

    loadList();
    return;
  }

  /* ============================ EDITOR PAGE ============================ */

  const draftId = window.location.pathname.split('/').filter(Boolean).pop();
  const isNew = window.location.pathname.endsWith('/new') || draftId === 'new' || draftId === 'studio';

  const state = {
    draftId: null,
    machineNameZh: '',
    status: 'draft',
    draft: null
  };

  const sourceLabel = { master: '师傅口述', ai_suggested: 'AI建议·待确认', reviewed: '已确认' };
  const sourceClass = { master: 'source-master', ai_suggested: 'source-ai', reviewed: 'source-reviewed' };

  function readLines(id) {
    return document.getElementById(id).value.split('\n').map((s) => s.trim()).filter(Boolean);
  }

  /* ---- rule card building ---- */
  function buildRuleCard(rule, index) {
    const card = el('div', 'rule-card');
    const head = el('div', 'rule-card-head');
    head.append(
      el('span', 'rule-index', `规则${index + 1}`),
      el('span', `source-badge ${sourceClass[rule.source] || 'source-master'}`, sourceLabel[rule.source] || rule.source)
    );
    const del = el('button', 'rule-delete', '删除');
    del.type = 'button';
    del.addEventListener('click', () => card.remove());
    head.append(del);
    card.append(head);

    const textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.maxLength = 300;
    textInput.placeholder = '规则内容（一句话）';
    textInput.value = rule.text || '';
    textInput.className = 'rule-text';
    card.append(textInput);

    const whyInput = document.createElement('input');
    whyInput.type = 'text';
    whyInput.maxLength = 200;
    whyInput.placeholder = '为什么（简短理由）';
    whyInput.value = rule.why || '';
    whyInput.className = 'rule-why';
    card.append(whyInput);

    const danger = el('label', 'rule-danger');
    const dangerInput = document.createElement('input');
    dangerInput.type = 'checkbox';
    dangerInput.className = 'rule-danger-input';
    dangerInput.checked = !!rule.danger;
    danger.append(dangerInput, document.createTextNode('危险规则（预防伤害）'));
    card.append(danger);

    if (rule.source !== 'master') {
      const confirm = el('label', 'rule-confirm');
      const confirmInput = document.createElement('input');
      confirmInput.type = 'checkbox';
      confirmInput.className = 'rule-confirm-input';
      confirmInput.checked = rule.source === 'reviewed';
      confirm.append(confirmInput, document.createTextNode('确认采用这条 AI 建议'));
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
    if (gap.why_it_matters) card.append(el('p', 'gap-why', `为什么重要：${gap.why_it_matters}`));
    const answer = document.createElement('textarea');
    answer.rows = 2;
    answer.placeholder = '答案（可选，填写后可用“用答案完善草稿”）';
    answer.value = gap.answer || '';
    answer.className = 'gap-answer';
    card.append(answer);
    return card;
  }

  function collectGaps() {
    const out = [];
    document.querySelectorAll('#gaps-list .gap-card').forEach((card) => {
      out.push({
        question: card.querySelector('.gap-question').textContent,
        why_it_matters: (card.querySelector('.gap-why')?.textContent || '').replace(/^为什么重要：/, ''),
        answer: card.querySelector('.gap-answer').value.trim()
      });
    });
    return out;
  }

  function buildQuizCard(seed, index) {
    const card = el('div', 'quiz-card');
    const question = document.createElement('input');
    question.type = 'text';
    question.maxLength = 200;
    question.placeholder = `题目 ${index + 1}`;
    question.value = seed.question || '';
    question.className = 'quiz-question';
    const ruleWrap = el('label', 'quiz-rule');
    ruleWrap.append(document.createTextNode('对应规则序号：'));
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

  function updateStatusbar() {
    const bar = document.getElementById('editor-statusbar');
    bar.replaceChildren();
    const name = el('strong', '', state.machineNameZh || '未命名设备');
    const meta = el('span', 'muted', `${state.draftId || ''} · 状态：${STATUS_LABELS[state.status] || state.status}`);
    bar.append(name, statusPill(state.status), meta);
  }

  async function loadDraft() {
    try {
      const data = await api(`/api/studio/draft/${encodeURIComponent(state.draftId)}`);
      state.machineNameZh = data.machineNameZh;
      state.status = data.status;
      state.draft = data.draft;
      document.getElementById('editor-title').textContent = '编辑安全操作规程';
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
      const data = await api(`/api/studio/draft/${encodeURIComponent(state.draftId)}`, {
        method: 'PUT', body: JSON.stringify(collectForm())
      });
      state.draft = data.draft;
      state.status = data.status;
      renderEditor();
      alertBox('已保存草稿。');
    } catch (error) {
      alertBox(error.message);
    }
  }

  async function submitApprove() {
    const reviewerName = document.getElementById('reviewer-name').value.trim();
    const confirmations = {
      rulesChecked: document.getElementById('confirm-rules').checked,
      requirementsChecked: document.getElementById('confirm-requirements').checked,
      gapsAcknowledged: document.getElementById('confirm-gaps').checked
    };
    try {
      const data = await api('/api/studio/approve', {
        method: 'POST', body: JSON.stringify({ draftId: state.draftId, reviewerName, confirmations })
      });
      state.status = 'approved';
      updateStatusbar();
      document.getElementById('publish-panel').hidden = false;
      alertBox('已批准，可以发布。');
    } catch (error) {
      alertBox(error.message);
    }
  }

  async function submitPublish() {
    const button = document.getElementById('publish-button');
    button.disabled = true;
    button.textContent = '发布中…';
    try {
      const data = await api('/api/studio/publish', {
        method: 'POST', body: JSON.stringify({ draftId: state.draftId })
      });
      state.status = 'published';
      updateStatusbar();
      renderPublishResult(data);
      alertBox('');
    } catch (error) {
      alertBox(error.message);
    } finally {
      button.disabled = false;
      button.textContent = '发布到安全官';
    }
  }

  function renderPublishResult(data) {
    const box = document.getElementById('publish-result');
    box.hidden = false;
    box.replaceChildren();
    box.append(el('h4', '', '已发布到安全官'));
    box.append(el('p', '', `设备：${data.name} · 第${data.version}版 · 审核：${data.approvedBy}`));
    const img = document.createElement('img');
    img.src = data.qrDataUrl;
    img.alt = '学生页面二维码';
    box.append(img);
    const link = el('a', 'student-link', data.studentUrl);
    link.href = data.studentUrl;
    link.target = '_blank';
    link.rel = 'noopener';
    box.append(link);
    const open = el('a', 'button primary', '打开学生页');
    open.href = data.studentUrl;
    open.target = '_blank';
    open.rel = 'noopener';
    box.append(open);
  }

  async function answerGaps() {
    const answers = collectGaps().filter((gap) => gap.answer);
    if (!answers.length) { alertBox('请先在“待补充问题”里填写至少一个答案。'); return; }
    const button = document.getElementById('answer-gaps');
    button.disabled = true;
    button.textContent = '正在完善…';
    try {
      const data = await api('/api/studio/gaps', {
        method: 'POST', body: JSON.stringify({ draftId: state.draftId, answers })
      });
      state.draft = data.draft;
      renderEditor();
      alertBox('已根据答案完善草稿。');
    } catch (error) {
      alertBox(error.message);
    } finally {
      button.disabled = false;
      button.textContent = '用答案完善草稿（AI）';
    }
  }

  function initNew() {
    document.getElementById('editor-title').textContent = '起草安全操作规程';
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
    const machineNameZh = document.getElementById('machine-name').value.trim();
    const machineId = document.getElementById('machine-id').value.trim();
    const transcript = document.getElementById('transcript').value.trim();
    const button = demo ? document.getElementById('demo-button') : document.getElementById('draft-button');
    button.disabled = true;
    button.textContent = '起草中…';
    try {
      const data = await api('/api/studio/draft', {
        method: 'POST', body: JSON.stringify({ machineNameZh, machineId, transcript, demo })
      });
      if (data.error) { alertBox(data.error); return; }
      window.location.assign(`/studio/${encodeURIComponent(data.draftId)}`);
    } catch (error) {
      alertBox(error.message);
    } finally {
      button.disabled = false;
      button.textContent = demo ? '载入演示示例并起草' : 'AI 起草';
    }
  }

  if (isNew) {
    initNew();
  } else {
    state.draftId = draftId;
    document.getElementById('new-draft-panel').hidden = true;
    document.getElementById('editor-panel').hidden = false;
    document.getElementById('save-draft').addEventListener('click', saveDraft);
    document.getElementById('add-rule').addEventListener('click', () => {
      document.getElementById('rules-list').append(buildRuleCard({ text: '', why: '', source: 'master', danger: false }, document.querySelectorAll('#rules-list .rule-card').length));
    });
    document.getElementById('approve-button').addEventListener('click', submitApprove);
    document.getElementById('publish-button').addEventListener('click', submitPublish);
    document.getElementById('answer-gaps').addEventListener('click', answerGaps);
    loadDraft();
  }
})();
