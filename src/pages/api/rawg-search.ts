import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ url }) => {
  const RAWG_API_KEY = import.meta.env.VITE_RAWG_API_KEY;
  const query = url.searchParams.get("query");

  if (!query) {
    return new Response(JSON.stringify({ results: [], error: "Missing search term" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const res = await fetch(
      `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(query)}&page_size=10`
    );
    const data = await res.json();
    return new Response(JSON.stringify({ results: data.results }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ results: [], error: "RAWG fetch failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
