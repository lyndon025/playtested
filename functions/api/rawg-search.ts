export const onRequestGet: PagesFunction = async ({ request, env }) => {
  const url = new URL(request.url);
  const query = url.searchParams.get("query");
  if (!query) {
    return new Response(JSON.stringify({ results: [], error: "Missing search term" }), {
      status: 400, headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const r = await fetch(
      `https://api.rawg.io/api/games?key=${env.RAWG_API_KEY}&search=${encodeURIComponent(query)}&page_size=10`
    );
    if (!r.ok) {
      return new Response(JSON.stringify({ results: [], error: `RAWG error ${r.status}` }), {
        status: r.status, headers: { "Content-Type": "application/json" }
      });
    }
    const data = await r.json();
    return new Response(JSON.stringify({ results: data.results }), { headers: { "Content-Type": "application/json" } });
  } catch {
    return new Response(JSON.stringify({ results: [], error: "RAWG fetch failed" }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }
};
