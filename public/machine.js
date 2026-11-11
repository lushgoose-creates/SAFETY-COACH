(() => {
  'use strict';

  const { lang, locale, t, withLang } = window.SafetyCoachI18n;
  const machineId = decodeURIComponent(window.location.pathname.split('/').filter(Boolean).pop());
  const screens = ['identity', 'briefing', 'chat', 'quiz', 'result'];
  const state = {
    machine: null,
    name: readStored('safetyCoachName'),
    studentId: readStored('safetyCoachStudentId'),
    mode: readStored('safetyCoachMode') || 'student',
    quiz: null,
    lastQuestion: '',
    asking: false
  };

  const elements = {
    machineName: document.getElementById('machine-name'),
    machineDescription: document.getElementById('machine-description'),
    alert: document.getElementById('app-alert'),
    briefingList: document.getElementById('briefing-list'),
    briefingNext: document.getElementById('briefing-next'),
    chatMessages: document.getElementById('chat-messages'),
    chatForm: document.getElementById('chat-form'),
    questionInput: document.getElementById('question-input'),
    askButton: document.getElementById('ask-button'),
    chatNext: document.getElementById('chat-next'),
    quizQuestions: document.getElementById('quiz-questions'),
    quizSubmit: document.getElementById('quiz-submit'),
    resultCard: document.getElementById('result-card'),
    retryQuiz: document.getElementById('retry-quiz'),
    visitorDone: document.getElementById('visitor-done'),
    identityForm: document.getElementById('identity-form'),
    studentName: document.getElementById('student-name'),
    studentId: document.getElementById('student-id'),
    identitySubmit: document.getElementById('identity-submit'),
    botFab: document.getElementById('ai-bot-fab'),
    botPanel: document.querySelector('.ai-bot-panel'),
    botClose: document.getElementById('ai-bot-close'),
    botForm: document.getElementById('ai-bot-form'),
    botInput: document.getElementById('ai-bot-input'),
    botMessages: document.getElementById('ai-bot-messages')
  };

  function readStored(key) {
    try { return localStorage.getItem(key) || ''; } catch { return ''; }
  }

  function storeIdentity() {
    try {
      localStorage.setItem('safetyCoachName', state.name);
      localStorage.setItem('safetyCoachStudentId', state.studentId);
      localStorage.setItem('safetyCoachMode', state.mode);
    } catch {
      // The flow still works if private browsing blocks localStorage.
    }
  }

  function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function showAlert(message) {
    elements.alert.textContent = message;
    elements.alert.hidden = !message;
  }

  function showScreen(name) {
    const isVisitor = state.mode === 'visitor';
    const stepOrder = isVisitor ? ['identity', 'briefing', 'chat', 'result'] : screens;
    const stepIndex = stepOrder.indexOf(name);
    for (const screen of screens) {
      document.getElementById(`screen-${screen}`).hidden = screen !== name;
    }
    document.querySelectorAll('#step-progress li').forEach((item, index) => {
      item.hidden = isVisitor && index === 3;
      if (item.hidden) return;
      item.classList.toggle('active', index === stepIndex);
      item.classList.toggle('complete', stepIndex > index || name === 'result');
      if (index === stepIndex) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
    });
    showAlert('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function api(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: options.body ? { 'Content-Type': 'application/json', ...options.headers } : options.headers
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.error || t('serviceUnavailable'));
      error.retryable = data.retryable;
      throw error;
    }
    return data;
  }

  async function loadBriefing() {
    showScreen('briefing');
    elements.briefingNext.disabled = true;
    elements.briefingList.replaceChildren(createElement('li', 'card loading-card', t('briefingLoading')));
    try {
      const data = await api(withLang(`/api/briefing/${encodeURIComponent(machineId)}`));
      const fragment = document.createDocumentFragment();
      data.items.forEach((text, index) => {
        const item = createElement('li', 'briefing-item card');
        item.append(createElement('span', 'briefing-number', String(index + 1).padStart(2, '0')));
        item.append(createElement('p', '', text));
        fragment.append(item);
      });
      elements.briefingList.replaceChildren(fragment);
      elements.briefingNext.disabled = false;
    } catch (error) {
      elements.briefingList.replaceChildren(createElement('li', 'card error-card', error.message));
      elements.briefingNext.disabled = false;
      elements.briefingNext.textContent = t('briefingRetry');
      elements.briefingNext.onclick = () => {
        elements.briefingNext.textContent = t('briefingNext');
        elements.briefingNext.onclick = enterChat;
        loadBriefing();
      };
    }
  }

  function enterChat() {
    showScreen('chat');
    elements.questionInput.focus({ preventScroll: true });
  }

  function appendMessage(role, text, citedRules = [], unanswered = false) {
    const wrapper = createElement('div', `message ${role === 'user' ? 'user-message' : 'assistant-message'}${unanswered ? ' unanswered-message' : ''}`);
    wrapper.append(createElement('div', 'message-label', role === 'user' ? t('you') : unanswered ? t('coachEscalation') : t('coach')));
    wrapper.append(createElement('p', '', text));
    if (citedRules.length) {
      const citations = createElement('div', 'citations');
      citedRules.forEach((rule) => citations.append(createElement('span', '', t('rule', { number: rule }))));
      wrapper.append(citations);
    }
    elements.chatMessages.append(wrapper);
    wrapper.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return wrapper;
  }

  function appendChatError(message) {
    const wrapper = createElement('div', 'message chat-error');
    wrapper.append(createElement('p', '', message));
    const retry = createElement('button', 'button retry-button', t('retryQuestion'));
    retry.type = 'button';
    retry.dataset.retry = 'true';
    wrapper.append(retry);
    elements.chatMessages.append(wrapper);
    retry.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  async function askQuestion(question, isRetry = false) {
    if (state.asking) return;
    state.asking = true;
    state.lastQuestion = question;
    elements.askButton.disabled = true;
    elements.askButton.textContent = t('checkingSop');
    elements.chatMessages.querySelectorAll('.chat-error').forEach((item) => item.remove());
    if (!isRetry) appendMessage('user', question);
    const loading = appendMessage('assistant', t('verifyingSop'));
    loading.classList.add('loading-message');
    try {
      const data = await api('/api/ask', {
        method: 'POST',
        body: JSON.stringify({ machineId, question, lang })
      });
      loading.remove();
      appendMessage('assistant', data.answer, data.citedRules, !data.answered);
    } catch (error) {
      loading.remove();
      appendChatError(error.message);
    } finally {
      state.asking = false;
      elements.askButton.disabled = false;
      elements.askButton.textContent = t('sendQuestion');
      elements.questionInput.focus({ preventScroll: true });
    }
  }

  async function enterQuiz() {
    showScreen('quiz');
    state.quiz = null;
    elements.quizSubmit.disabled = true;
    elements.quizSubmit.textContent = t('quizPreparing');
    elements.quizQuestions.replaceChildren(createElement('div', 'card loading-card', t('quizLoading')));
    try {
      const data = await api(withLang(`/api/quiz/${encodeURIComponent(machineId)}`));
      state.quiz = data;
      renderQuiz();
    } catch (error) {
      elements.quizQuestions.replaceChildren(createElement('div', 'card error-card', error.message));
      const retry = createElement('button', 'button secondary full-width', t('quizRetryLoad'));
      retry.type = 'button';
      retry.addEventListener('click', enterQuiz);
      elements.quizQuestions.append(retry);
    }
  }

  function renderQuiz() {
    const fragment = document.createDocumentFragment();
    state.quiz.questions.forEach((question, questionIndex) => {
      const fieldset = createElement('fieldset', 'quiz-card card');
      const legend = createElement('legend', '', t('questionNumber', { number: questionIndex + 1 }));
      fieldset.append(legend);
      fieldset.append(createElement('h3', '', question.question));
      fieldset.append(createElement('span', 'rule-tag', t('testsRule', { number: question.ruleNumber })));
      const options = createElement('div', 'option-list');
      question.options.forEach((option, optionIndex) => {
        const label = createElement('label', 'option-label');
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = `question-${question.id}`;
        input.value = String(optionIndex);
        input.dataset.questionId = question.id;
        const letter = createElement('span', 'option-letter', String.fromCharCode(65 + optionIndex));
        const text = createElement('span', 'option-text', option);
        label.append(input, letter, text);
        options.append(label);
      });
      fieldset.append(options);
      fragment.append(fieldset);
    });
    elements.quizQuestions.replaceChildren(fragment);
    updateQuizProgress();
  }

  function updateQuizProgress() {
    const checked = elements.quizQuestions.querySelectorAll('input:checked').length;
    elements.quizSubmit.disabled = !state.quiz;
    elements.quizSubmit.textContent = t('submitAnswers', { checked });
  }

  function renderResult(result) {
    showScreen('result');
    elements.resultCard.className = `result-card ${result.passed ? 'pass-card' : 'fail-card'}`;
    const badge = createElement('div', 'result-badge', result.passed ? 'PASS' : 'RETRY');
    const title = createElement('h2', '', result.passed ? t('passTitle') : t('failTitle'));
    const score = createElement('p', 'result-score', t('score', { score: result.score, total: result.total }));
    const message = createElement('p', 'result-message', result.message);
    const details = createElement('dl', 'result-details');
    const rows = [
      [t('resultName'), state.name],
      [t('resultStudentId'), state.studentId],
      [t('resultMachine'), state.machine.name],
      [t('resultTime'), formatTime(result.createdAt)]
    ];
    rows.forEach(([label, value]) => {
      details.append(createElement('dt', '', label), createElement('dd', '', value));
    });
    elements.resultCard.replaceChildren(badge, title, score, message, details);
    if (!result.passed) {
      const review = createElement('div', 'review-box');
      review.append(createElement('strong', '', t('reviewRules')));
      const rules = createElement('div', 'review-rules');
      result.rulesToReview.forEach((rule) => rules.append(createElement('span', '', t('rule', { number: rule }))));
      review.append(rules);
      elements.resultCard.append(review);
    } else {
      elements.resultCard.append(createElement('p', 'pass-note', t('passNote')));
    }
    elements.retryQuiz.hidden = result.passed;
    elements.visitorDone.hidden = true;
  }

  function formatTime(value) {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }).format(new Date(value));
  }

  document.getElementById('identity-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const name = elements.studentName.value.trim();
    const modeInput = document.querySelector('input[name="mode"]:checked');
    const mode = modeInput ? modeInput.value : 'student';
    const studentId = elements.studentId.value.trim();
    if (!name) return showAlert(t('identityRequired'));
    if (mode === 'student' && !studentId) return showAlert(t('identityRequired'));
    if (studentId && !/^[\p{L}\p{N}_-]+$/u.test(studentId)) return showAlert(t('studentIdInvalid'));
    state.name = name;
    state.studentId = mode === 'student' ? studentId : '';
    state.mode = mode;
    storeIdentity();
    loadBriefing();
  });

  function updateModeUI() {
    const isVisitor = state.mode === 'visitor';
    elements.studentId.required = !isVisitor;
    elements.studentId.disabled = isVisitor;
    elements.studentId.value = isVisitor ? '' : elements.studentId.value;
    elements.identitySubmit.textContent = isVisitor ? t('identitySubmitVisitor') : t('identitySubmit');
    elements.chatNext.textContent = isVisitor ? t('visitorChatNext') : t('chatNext');
    const checked = document.querySelector(`input[name="mode"][value="${state.mode}"]`);
    if (checked) checked.checked = true;
  }

  function showVisitorResult() {
    showScreen('result');
    elements.resultCard.className = 'result-card visitor-card';
    const badge = createElement('div', 'result-badge visitor-badge', t('modeVisitor'));
    const title = createElement('h2', '', t('visitorResultTitle'));
    const message = createElement('p', 'result-message', t('visitorResultMessage'));
    const details = createElement('dl', 'result-details');
    const rows = [
      [t('resultName'), state.name],
      [t('resultMachine'), state.machine.name],
      [t('resultTime'), formatTime(new Date().toISOString())]
    ];
    rows.forEach(([label, value]) => {
      details.append(createElement('dt', '', label), createElement('dd', '', value));
    });
    elements.resultCard.replaceChildren(badge, title, message, details);
    elements.retryQuiz.hidden = true;
    elements.visitorDone.hidden = false;
  }

  elements.briefingNext.onclick = enterChat;
  elements.chatNext.addEventListener('click', () => {
    if (state.mode === 'visitor') showVisitorResult();
    else enterQuiz();
  });
  elements.visitorDone.addEventListener('click', () => {
    state.name = '';
    state.studentId = '';
    state.mode = 'student';
    storeIdentity();
    elements.studentName.value = '';
    elements.studentId.value = '';
    updateModeUI();
    showScreen('identity');
  });
  document.querySelectorAll('input[name="mode"]').forEach((input) => {
    input.addEventListener('change', () => {
      state.mode = input.value;
      updateModeUI();
    });
  });
  elements.chatForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const question = elements.questionInput.value.trim();
    if (!question) return;
    elements.questionInput.value = '';
    askQuestion(question);
  });
  elements.chatMessages.addEventListener('click', (event) => {
    if (event.target.dataset.retry === 'true' && state.lastQuestion) askQuestion(state.lastQuestion, true);
  });
  elements.quizQuestions.addEventListener('change', updateQuizProgress);
  document.getElementById('quiz-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!state.quiz) return;
    const answers = state.quiz.questions.map((question) => {
      const checked = elements.quizQuestions.querySelector(`input[name="question-${question.id}"]:checked`);
      return { questionId: question.id, selectedIndex: checked ? Number(checked.value) : -1 };
    });
    if (answers.some((answer) => answer.selectedIndex < 0)) return showAlert(t('completeQuiz'));
    elements.quizSubmit.disabled = true;
    elements.quizSubmit.textContent = t('grading');
    try {
      const result = await api('/api/quiz/submit', {
        method: 'POST',
        body: JSON.stringify({ machineId, name: state.name, studentId: state.studentId, answers, lang })
      });
      renderResult(result);
    } catch (error) {
      showAlert(error.message);
      elements.quizSubmit.disabled = false;
      updateQuizProgress();
    }
  });
  elements.retryQuiz.addEventListener('click', enterQuiz);

  /* ---------- Floating AI safety bot ---------- */
  function openBot() {
    elements.botPanel.hidden = false;
    document.getElementById('ai-bot').setAttribute('aria-hidden', 'false');
    if (!elements.botMessages.children.length) {
      appendBotMessage('coach', t('botGreeting'));
    }
    elements.botInput.focus({ preventScroll: true });
  }
  function closeBot() {
    elements.botPanel.hidden = true;
    document.getElementById('ai-bot').setAttribute('aria-hidden', 'true');
  }
  function appendBotMessage(role, text, citedRules = [], unanswered = false) {
    const bubble = createElement('div', `bot-msg ${role === 'user' ? 'you' : 'coach'}${unanswered ? ' unanswered-message' : ''}`);
    bubble.textContent = text;
    if (citedRules && citedRules.length) {
      citedRules.forEach((rule) => {
        const tag = createElement('span', 'bot-citation', t('rule', { number: rule }));
        bubble.append(document.createElement('br'), tag);
      });
    }
    elements.botMessages.append(bubble);
    elements.botMessages.scrollTop = elements.botMessages.scrollHeight;
    return bubble;
  }
  async function askBot(question) {
    appendBotMessage('user', question);
    elements.botInput.value = '';
    const typing = createElement('div', 'bot-msg coach');
    typing.innerHTML = '<span class="bot-typing"><span></span><span></span><span></span></span>';
    elements.botMessages.append(typing);
    elements.botMessages.scrollTop = elements.botMessages.scrollHeight;
    try {
      const data = await api('/api/ask', {
        method: 'POST',
        body: JSON.stringify({ machineId, question, lang })
      });
      typing.remove();
      appendBotMessage('coach', data.answer, data.citedRules, !data.answered);
    } catch (error) {
      typing.remove();
      appendBotMessage('coach', error.message);
    }
  }
  elements.botFab.addEventListener('click', () => {
    if (elements.botPanel.hidden) openBot(); else closeBot();
  });
  elements.botClose.addEventListener('click', closeBot);
  elements.botForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const question = elements.botInput.value.trim();
    if (!question) return;
    askBot(question);
  });

  async function initialize() {
    updateModeUI();
    elements.studentName.value = state.name;
    elements.studentId.value = state.studentId;
    updateQuizProgress();
    try {
      state.machine = await api(withLang(`/api/machine/${encodeURIComponent(machineId)}`));
      elements.machineName.textContent = state.machine.name;
      elements.machineDescription.textContent = state.machine.description;
      document.title = t('machineTitle', { machine: state.machine.name });
      const canAutoStart = state.mode === 'visitor' ? state.name : (state.name && state.studentId);
      if (canAutoStart) {
        loadBriefing();
      } else {
        showScreen('identity');
      }
    } catch (error) {
      showScreen('identity');
      showAlert(error.message);
      elements.identitySubmit.disabled = true;
    }
  }

  initialize();
})();
