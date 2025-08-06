// tell Astro this API route is always server-rendered
export const prerender = false;

import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ params }) => {
  const rawQuery = params.query;
  if (!rawQuery) {
    return new Response(
      JSON.stringify({ results: [], error: 'Missing search term in path' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const q = decodeURIComponent(rawQuery);
  const key = import.meta.env.VITE_RAWG_API_KEY;
  const apiUrl =
    `https://api.rawg.io/api/games?key=${key}` +
    `&search=${encodeURIComponent(q)}&page_size=10`;

  const rawgRes = await fetch(apiUrl);
  if (!rawgRes.ok) {
    return new Response(
      JSON.stringify({ results: [], error: `RAWG error ${rawgRes.status}` }),
      {
        status: rawgRes.status,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const data = await rawgRes.json();
  return new Response(JSON.stringify({ results: data.results }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
