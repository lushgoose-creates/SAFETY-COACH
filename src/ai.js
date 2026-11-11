const API_KEY = (process.env.API_KEY || '').trim();
const API_BASE_URL = (process.env.API_BASE_URL || 'https://api.deepseek.com')
  .trim()
  .replace(/[,，\s]+$/g, '')
  .replace(/\/+$/g, '');
const MODEL_NAME = (process.env.MODEL_NAME || 'deepseek-chat').trim();

function isAiConfigured() {
  return Boolean(API_KEY);
}

async function requestChat({ system, user, timeoutMs = 30000 }) {
  if (!API_KEY) {
    const error = new Error('API_KEY is not configured');
    error.code = 'AI_NOT_CONFIGURED';
    throw error;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const endpoint = API_BASE_URL.endsWith('/chat/completions')
      ? API_BASE_URL
      : `${API_BASE_URL}/chat/completions`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
        stream: false
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const details = (await response.text()).slice(0, 500);
      throw new Error(`AI request failed (${response.status}): ${details}`);
    }

    const payload = await response.json();
    const content = payload.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) {
      throw new Error('AI returned an empty response');
    }
    return content.trim();
  } finally {
    clearTimeout(timeout);
  }
}

function parseJsonContent(content) {
  const cleaned = content
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error('AI response was not valid JSON');
  }
}

module.exports = { isAiConfigured, requestChat, parseJsonContent };
