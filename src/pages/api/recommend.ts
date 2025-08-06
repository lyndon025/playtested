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

  const prompt = `Based on these games: ${gameNames.join(', ')}, please recommend 3 other games and explain why each would suit a fan of those titles.`;

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
