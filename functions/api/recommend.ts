export const onRequestPost: PagesFunction = async ({ request, env }) => {
  const body = await request.json().catch(() => ({}));
  const gameNames = Array.isArray(body?.gameNames) ? body.gameNames : [];

  if (gameNames.length === 0) {
    return new Response(JSON.stringify({ error: "No games provided." }), {
      status: 400, headers: { "Content-Type": "application/json" }
    });
  }

  const OPENROUTER_API_KEY = env.OPENROUTER_API_KEY;
  const RAWG_API_KEY = env.RAWG_API_KEY;

  const prompt = `The user enjoys these games: ${gameNames.join(", ")}.

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
        { role: "system", content: "You are a game recommendation expert. Only respond with game titles." },
        { role: "user", content: prompt },
      ],
      max_tokens: 200,
    }),
  });

  const aiJson = await aiRes.json();
  const titleLine = aiJson.choices?.[0]?.message?.content?.trim() ?? "";
  const titles = titleLine.split(",").map((t: string) => t.trim()).filter(Boolean).slice(0, 3);

  async function fetchGame(title: string) {
    const r = await fetch(`https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(title)}`);
    const j = await r.json();
    const g = j.results?.[0];
    return {
      title,
      name: g?.name || title,
      released: g?.released || "Unknown",
      image: g?.background_image || null,
      slug: g?.slug || null,
      url: g?.slug ? `https://rawg.io/games/${g.slug}` : null,
    };
  }

  const enriched = await Promise.all(titles.map(fetchGame));

  const explainPrompt = `The user enjoys: ${gameNames.join(", ")}. Based on that, you recommended: ${titles.join(", ")}.

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
        { role: "system", content: "You are a helpful game recommendation analyst." },
        { role: "user", content: explainPrompt },
      ],
      max_tokens: 1024,
    }),
  });
  const explainJson = await explainRes.json();
  const explanation = explainJson.choices?.[0]?.message?.content?.trim() ?? "";

  return new Response(JSON.stringify({ recommended: enriched, explanation }), {
    headers: { "Content-Type": "application/json" },
  });
};
