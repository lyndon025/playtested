import type { PagesFunction } from "@cloudflare/workers-types";

export const onRequestPost: PagesFunction = async ({ request, env }: { request: Request; env: { OPENROUTER_API_KEY: string } }) => {
  const body = await request.json().catch(() => ({}));
  const gameNames = Array.isArray(body?.gameNames) ? body.gameNames : [];

  if (gameNames.length < 2) {
    return new Response(JSON.stringify({ error: "Please provide at least two games to compare." }), {
      status: 400, headers: { "Content-Type": "application/json" }
    });
  }

  const OPENROUTER_API_KEY = env.OPENROUTER_API_KEY;

  const prompt = `You're a game AI tool helping a player decide between: ${gameNames.join(", ")}.

Compare them naturally but systematically. Focus on:
- Gameplay and mechanics
- Story and characters
- Overall vibe and setting`;

  const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-lite",
      messages: [
        { role: "system", content: "You are a trusted gaming expert giving friendly analysis." },
        { role: "user", content: prompt },
      ],
      max_tokens: 1024,
    }),
  });

  const json = await aiResponse.json();
  const result = json.choices?.[0]?.message?.content ?? "No response.";
  return new Response(JSON.stringify({ result }), { headers: { "Content-Type": "application/json" } });
};
