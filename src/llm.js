// LLM provider abstraction. Set ANTHROPIC_API_KEY or OPENAI_API_KEY to enable
// real AI responses; otherwise the game falls back to a scripted Lexi brain.

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

async function anthropicChat(system, messages) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 1024,
      system,
      messages,
    }),
  });
  if (!res.ok) throw new Error(`Anthropic API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.content.map((b) => b.text).join('');
}

async function openaiChat(system, messages) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      max_tokens: 1024,
      messages: [{ role: 'system', content: system }, ...messages],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

export function getProvider() {
  if (process.env.ANTHROPIC_API_KEY) {
    return { name: 'anthropic', model: ANTHROPIC_MODEL, chat: anthropicChat };
  }
  if (process.env.OPENAI_API_KEY) {
    return { name: 'openai', model: OPENAI_MODEL, chat: openaiChat };
  }
  return null;
}
