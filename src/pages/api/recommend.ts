import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const { gameNames } = body;

  if (!Array.isArray(gameNames) || gameNames.length === 0) {
    return new Response(JSON.stringify({ error: 'No games provided.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
  const RAWG_API_KEY = import.meta.env.VITE_RAWG_API_KEY;

  const prompt = `The user enjoys these games: ${gameNames.join(', ')}.

Recommend 3 modern games they might love. Respond ONLY with a plain comma-separated list like:
Game Title A, Game Title B, Game Title C
Do not include any explanations.`;

  const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a game recommendation expert. Only respond with game titles.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 200,
    }),
  });

  const aiJson = await aiRes.json();
  const titleLine = aiJson.choices?.[0]?.message?.content?.trim() ?? "No titles found";
  const titles = titleLine.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 3);

  const fetchGame = async (title: string) => {
    const res = await fetch(
      `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(title)}`
    );
    const json = await res.json();
    const game = json.results?.[0];
    return {
      title,
      name: game?.name || title,
      released: game?.released || "Unknown",
      image: game?.background_image || null,
      slug: game?.slug || null,
      url: game?.slug ? `https://rawg.io/games/${game.slug}` : null,
    };
  };

  const enriched = await Promise.all(titles.map(fetchGame));

  const explainPrompt = `The user enjoys: ${gameNames.join(', ')}. Based on that, you recommended: ${titles.join(', ')}.

Now explain in 3 paragraphs — one per game — why the user would enjoy each title. Mention gameplay, story, style, or similarities to their favorites. No bullet points or markdown. Use full sentences.`;

  const explainRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-lite",
      messages: [
        {
          role: "system",
          content: "You are a helpful game recommendation analyst.",
        },
        { role: "user", content: explainPrompt },
      ],
      max_tokens: 1024,
    }),
  });

  const explainJson = await explainRes.json();
  const explanation = explainJson.choices?.[0]?.message?.content?.trim() ?? "";

  return new Response(
    JSON.stringify({ recommended: enriched, explanation }),
    { headers: { "Content-Type": "application/json" } }
  );
};
