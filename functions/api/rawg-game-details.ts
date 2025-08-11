export const onRequestGet: PagesFunction = async ({ request, env }) => {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");
  if (!slug) {
    return new Response(JSON.stringify({ error: "Missing slug" }), {
      status: 400, headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const r = await fetch(`https://api.rawg.io/api/games/${encodeURIComponent(slug)}?key=${env.RAWG_API_KEY}`);
    const data = await r.json();
    return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
  } catch {
    return new Response(JSON.stringify({ error: "RAWG fetch failed" }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }
};
