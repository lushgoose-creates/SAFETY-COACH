(() => {
  'use strict';

  const { lang, locale, t, withLang } = window.SafetyCoachI18n;
  const machineId = decodeURIComponent(window.location.pathname.split('/').filter(Boolean).pop());
  const screens = ['identity', 'briefing', 'chat', 'quiz', 'result'];
  const state = {
    machine: null,
    name: readStored('safetyCoachName'),
    studentId: readStored('safetyCoachStudentId'),
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
    quizQuestions: document.getElementById('quiz-questions'),
    quizSubmit: document.getElementById('quiz-submit'),
    resultCard: document.getElementById('result-card'),
    retryQuiz: document.getElementById('retry-quiz')
  };

  function readStored(key) {
    try { return localStorage.getItem(key) || ''; } catch { return ''; }
  }

  function storeIdentity() {
    try {
      localStorage.setItem('safetyCoachName', state.name);
      localStorage.setItem('safetyCoachStudentId', state.studentId);
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
    const stepIndex = screens.indexOf(name);
    for (const screen of screens) {
      document.getElementById(`screen-${screen}`).hidden = screen !== name;
    }
    document.querySelectorAll('#step-progress li').forEach((item, index) => {
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
  }

  function formatTime(value) {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }).format(new Date(value));
  }

  document.getElementById('identity-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const name = document.getElementById('student-name').value.trim();
    const studentId = document.getElementById('student-id').value.trim();
    if (!name || !studentId) return showAlert(t('identityRequired'));
    if (!/^[\p{L}\p{N}_-]+$/u.test(studentId)) return showAlert(t('studentIdInvalid'));
    state.name = name;
    state.studentId = studentId;
    storeIdentity();
    loadBriefing();
  });

  elements.briefingNext.onclick = enterChat;
  document.getElementById('chat-next').addEventListener('click', enterQuiz);
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

  async function initialize() {
    updateQuizProgress();
    try {
      state.machine = await api(withLang(`/api/machine/${encodeURIComponent(machineId)}`));
      elements.machineName.textContent = state.machine.name;
      elements.machineDescription.textContent = state.machine.description;
      document.title = t('machineTitle', { machine: state.machine.name });
      if (state.name && state.studentId) {
        loadBriefing();
      } else {
        showScreen('identity');
      }
    } catch (error) {
      showScreen('identity');
      showAlert(error.message);
      document.getElementById('identity-form').querySelector('button').disabled = true;
    }
  }

  initialize();
})();
