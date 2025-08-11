// src/pages/auth.ts
import type { APIRoute } from "astro";

const rand = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

export const GET: APIRoute = async ({ url, locals }) => {
  // If TS complains about `runtime.env`, cast or add the augmentation below
  const env = (locals as any).runtime.env as {
    GITHUB_CLIENT_ID: string;
  };

  const state = rand();
  const redirectUri = new URL("/auth/callback", url.origin).toString();

  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: "repo",          // use "public_repo" only if your repo is public
    state,
    allow_signup: "true",
  });

  return new Response(null, {
    status: 302,
    headers: {
      Location: `https://github.com/login/oauth/authorize?${params}`,
      "Set-Cookie":
        `gh_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
    },
  });
};
