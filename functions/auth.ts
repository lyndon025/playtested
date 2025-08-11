export const onRequestGet: PagesFunction = async ({ request, env }) => {
  const url = new URL(request.url);
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const state = Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
  const redirectUri = `${url.origin}/auth/callback`;

  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: redirectUri,
    // Use "public_repo" for public repos; switch to "repo" if your content repo is private
    scope: "public_repo",
    state,
    allow_signup: "true"
  });

  return new Response(null, {
    status: 302,
    headers: {
      Location: `https://github.com/login/oauth/authorize?${params}`,
      "Set-Cookie": `gh_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`
    }
  });
};
