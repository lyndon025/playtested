export const GET = ({ url, locals }) => {
  const state = crypto.getRandomValues(new Uint8Array(16))
    .reduce((s,b)=>s+b.toString(16).padStart(2,"0"),"");
  const redirectUri = new URL("/auth/callback", url.origin).toString();
  const params = new URLSearchParams({
    client_id: locals.runtime.env.GITHUB_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: "public_repo", // or "repo" for private
    state,
    allow_signup: "true",
  });
  return new Response(null, {
    status: 302,
    headers: {
      Location: `https://github.com/login/oauth/authorize?${params}`,
      "Set-Cookie": `gh_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
    }
  });
};
