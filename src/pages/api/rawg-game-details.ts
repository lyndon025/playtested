// src/pages/api/rawg-game-details.ts
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url }) => {
  const id = url.searchParams.get('id');
  if (!id) {
    return new Response(
      JSON.stringify({ error: "Missing game 'id' parameter" }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const key = import.meta.env.VITE_RAWG_API_KEY;
  if (!key) {
    return new Response(
      JSON.stringify({ error: "Missing VITE_RAWG_API_KEY" }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const res = await fetch(
      `https://api.rawg.io/api/games/${id}?key=${key}`
    );
    if (!res.ok) {
      const errorText = await res.text();
      return new Response(
        JSON.stringify({ error: `RAWG returned status ${res.status}`, details: errorText }),
        { status: res.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await res.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }
};