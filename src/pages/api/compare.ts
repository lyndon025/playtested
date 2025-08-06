// src/pages/api/compare.ts
export const prerender = false;

import type { APIRoute } from 'astro';
import getAIResponse from '../../utils/SendToLLM.js';

export const POST: APIRoute = async ({ request }) => {
  const { gameNames } = await request.json();

  if (!Array.isArray(gameNames) || gameNames.length < 2) {
    return new Response(
      JSON.stringify({ error: 'Please provide at least two games to compare.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

const prompt = `You're a gaming analyst AI helping the user decide between these games: ${gameNames.join(', ')}. Share your honest thoughts and impressions. Write in full sentences and keep a relaxed tone. Focus on gameplay, story, vibe, and how they differ. If the games are in the same series, determine how important it us to play the previous entry or entries, or not; and how the games differ and have evolved. No bullet points or markdown formatting.`;


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
