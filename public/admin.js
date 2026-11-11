(() => {
  'use strict';
  const { lang, locale, t, withLang } = window.SafetyCoachI18n;
  let refreshing = false;

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function formatTime(value) {
    return new Intl.DateTimeFormat(locale, {
      month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }).format(new Date(value));
  }

  function setEmpty(tableId, emptyId, hasRows) {
    document.getElementById(tableId).closest('table').hidden = !hasRows;
    document.getElementById(emptyId).hidden = hasRows;
  }

  function renderMachines(machines) {
    const fragment = document.createDocumentFragment();
    machines.forEach((machine) => {
      const card = element('article', 'machine-stat-card');
      const heading = element('div', 'stat-card-heading');
      heading.append(element('h3', '', machine.name), element('span', 'machine-code', machine.id));
      const rate = element('div', 'pass-rate', `${machine.passRate}%`);
      const label = element('p', '', t('passRate', { passed: machine.passed, total: machine.total }));
      const track = element('div', 'progress-track');
      const fill = element('div', 'progress-fill');
      fill.style.width = `${machine.passRate}%`;
      track.append(fill);
      card.append(heading, rate, label, track);
      if (machine.demoCount) card.append(element('span', 'demo-label', t('demoRecords', { count: machine.demoCount })));
      const button = element('button', 'button regenerate-button', t('regenerate'));
      button.type = 'button';
      button.dataset.machineId = machine.id;
      card.append(button);
      fragment.append(card);
    });
    document.getElementById('machine-stats').replaceChildren(fragment);
  }

  function renderAttempts(attempts) {
    const fragment = document.createDocumentFragment();
    attempts.forEach((attempt) => {
      const row = document.createElement('tr');
      const statusCell = document.createElement('td');
      statusCell.append(element('span', `status-pill ${attempt.passed ? 'status-pass' : 'status-fail'}`, attempt.passed ? t('pass') : t('fail')));
      const personCell = document.createElement('td');
      personCell.append(element('strong', '', attempt.name), element('small', '', attempt.studentId));
      if (attempt.isDemo) personCell.append(element('span', 'demo-badge', 'DEMO'));
      row.append(statusCell, personCell, element('td', '', attempt.machineName), element('td', 'time-cell', formatTime(attempt.createdAt)));
      fragment.append(row);
    });
    document.getElementById('attempts-body').replaceChildren(fragment);
    setEmpty('attempts-body', 'attempts-empty', attempts.length > 0);
  }

  function renderTopQuestions(questions) {
    const fragment = document.createDocumentFragment();
    questions.forEach((item) => {
      const row = document.createElement('tr');
      const questionCell = document.createElement('td');
      questionCell.append(element('strong', '', item.question), element('small', '', `${item.machineName} · ${t('lastAsked', { time: formatTime(item.lastAskedAt) })}`));
      row.append(element('td', 'count-cell', String(item.count)), questionCell);
      fragment.append(row);
    });
    document.getElementById('questions-body').replaceChildren(fragment);
    setEmpty('questions-body', 'questions-empty', questions.length > 0);
  }

  function renderDifficult(questions) {
    const fragment = document.createDocumentFragment();
    questions.forEach((item) => {
      const row = document.createElement('tr');
      const rateCell = document.createElement('td');
      rateCell.append(element('strong', `fail-rate ${item.failRate >= 50 ? 'high-fail' : ''}`, `${item.failRate}%`), element('small', '', t('incorrectCount', { failed: item.failed, total: item.total })));
      const questionCell = document.createElement('td');
      questionCell.append(element('strong', '', item.question), element('small', '', `${item.machineName} · ${t('ruleOnly', { number: item.ruleNumber })}`));
      row.append(rateCell, questionCell);
      fragment.append(row);
    });
    document.getElementById('difficult-body').replaceChildren(fragment);
    setEmpty('difficult-body', 'difficult-empty', questions.length > 0);
  }

  function renderUnanswered(questions) {
    const fragment = document.createDocumentFragment();
    questions.forEach((item) => {
      const row = document.createElement('tr');
      row.append(element('td', 'time-cell', formatTime(item.createdAt)), element('td', '', item.machineName), element('td', '', item.question));
      fragment.append(row);
    });
    document.getElementById('unanswered-body').replaceChildren(fragment);
    setEmpty('unanswered-body', 'unanswered-empty', questions.length > 0);
  }

  async function refresh() {
    if (refreshing) return;
    refreshing = true;
    const status = document.getElementById('admin-status');
    try {
      const response = await fetch(withLang('/api/admin/stats'), { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t('refreshFailed'));
      renderMachines(data.machines);
      renderAttempts(data.recentAttempts);
      renderTopQuestions(data.topQuestions);
      renderDifficult(data.difficultQuestions);
      renderUnanswered(data.unanswered);
      document.getElementById('last-updated').textContent = t('lastUpdated', { time: formatTime(data.generatedAt) });
      status.textContent = t('synchronized');
      status.classList.remove('status-error');
    } catch (error) {
      status.textContent = `${error.message} — ${t('retryAutomatically')}`;
      status.classList.add('status-error');
    } finally {
      refreshing = false;
    }
  }

  document.getElementById('refresh-button').addEventListener('click', refresh);
  document.getElementById('machine-stats').addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-machine-id]');
    if (!button) return;
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = t('generating');
    try {
      const response = await fetch(withLang(`/api/admin/quiz/${encodeURIComponent(button.dataset.machineId)}/regenerate`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lang })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t('generationFailed'));
      button.textContent = data.message;
      setTimeout(refresh, 500);
    } catch (error) {
      button.textContent = error.message;
    } finally {
      setTimeout(() => {
        button.disabled = false;
        button.textContent = originalText;
      }, 2500);
    }
  });

  refresh();
  setInterval(refresh, 10000);
})();
