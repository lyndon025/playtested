// src/pages/api/compare.ts
export const prerender = false;

import type { APIRoute } from 'astro';
import getAIResponse from '../../utils/SendToLLM.js';

export const POST: APIRoute = async ({ request }) => {
  const { gameNames } = await request.json();
  if (!Array.isArray(gameNames) || gameNames.length !== 2) {
    return new Response(
      JSON.stringify({ error: 'Please provide exactly two games to compare.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const [a, b] = gameNames;
  const prompt = `Compare "${a}" versus "${b}" across gameplay, art style, story, and player experience. Summarize who each game is best for.`;

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
