// src/utils/SendToLLM.js
export default async function getAIResponse(prompt) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openai/gpt-3.5-turbo', // Using a faster model. Change to 'gpt-4' if needed.
      messages: [{ role: 'user', content: prompt }],
    })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({})); // Gracefully handle non-json error responses
    throw new Error(errorData?.error?.message || `Request failed with status ${res.status}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content;
}