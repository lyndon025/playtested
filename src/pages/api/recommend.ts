// src/pages/api/recommend.ts
export const prerender = false;

import type { APIRoute } from 'astro';
import getAIResponse from '../../utils/SendToLLM.js';

export const POST: APIRoute = async ({ request }) => {
  const { gameNames } = await request.json();
  if (!Array.isArray(gameNames) || gameNames.length === 0) {
    return new Response(
      JSON.stringify({ error: 'No games provided' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

const prompt = `The user loves these games: ${gameNames.join(', ')}. Based on that, recommend 3 games they might enjoy. Start by listing the 3 game titles clearly up front, then follow it with a natural, paragraph-style explanation on why they'd like each one. No markdown, no bullet points. Full sentences only.`;

  try {
    const aiText = await getAIResponse(prompt);
    return new Response(
      JSON.stringify({ result: aiText }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
