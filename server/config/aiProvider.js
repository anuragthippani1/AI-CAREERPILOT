const { getModel } = require('./gemini');

function stripJsonFences(text) {
  return String(text || '')
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();
}

function parseJsonResponse(text) {
  const cleaned = stripJsonFences(text);
  return JSON.parse(cleaned);
}

async function generateWithOpenAI({ systemPrompt, userPrompt, model }) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || process.env.OPENAI_MODEL || 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      temperature: 0.2,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('OpenAI returned an empty response');
  }

  return parseJsonResponse(content);
}

async function generateWithGemini({ systemPrompt, userPrompt, model }) {
  const geminiModel = getModel(model || process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite');
  const result = await geminiModel.generateContent(`${systemPrompt}\n\n${userPrompt}`);
  const response = await result.response;
  return parseJsonResponse(response.text());
}

function isRecoverableAiError(error) {
  const message = (error && (error.message || String(error))) || '';
  const lower = message.toLowerCase();

  return (
    lower.includes('quota') ||
    lower.includes('429') ||
    lower.includes('api key') ||
    lower.includes('unauthorized') ||
    lower.includes('permission') ||
    lower.includes('rate limit') ||
    lower.includes('empty response') ||
    lower.includes('json') ||
    lower.includes('openai request failed') ||
    lower.includes('fetch failed')
  );
}

async function generateStructuredJson({
  systemPrompt,
  userPrompt,
  preferredProvider = process.env.AI_PROVIDER || 'openai',
  openAiModel,
  geminiModel,
}) {
  const providers =
    preferredProvider === 'gemini'
      ? ['gemini', 'openai']
      : ['openai', 'gemini'];

  let lastError = null;

  for (const provider of providers) {
    try {
      if (provider === 'openai') {
        return await generateWithOpenAI({
          systemPrompt,
          userPrompt,
          model: openAiModel,
        });
      }

      return await generateWithGemini({
        systemPrompt,
        userPrompt,
        model: geminiModel,
      });
    } catch (error) {
      lastError = error;
      if (!isRecoverableAiError(error)) {
        throw error;
      }
    }
  }

  throw lastError || new Error('No AI provider available');
}

module.exports = {
  generateStructuredJson,
  isRecoverableAiError,
};
