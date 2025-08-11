async function exchange(code: string, redirectUri: string, env: any) {
  const r = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Accept": "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri
    })
  });
  if (!r.ok) throw new Error(`Token exchange failed: ${r.status}`);
  return r.json();
}

export const GET = async ({ request, url, locals }) => {
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expected = (request.headers.get("Cookie")||"").match(/(?:^|; )gh_oauth_state=([^;]+)/)?.[1];

  const send = (type: string, payload: string) =>
    new Response(`<!doctype html><html><body><script>
      (function(){
        var msg='authorization:github:success:${payload}';
        if(window.opener) window.opener.postMessage(msg,'*');
        window.close();
      })();</script></body></html>`, { headers: { "Content-Type": "text/html" } });

  if (!code) return send("authorization:github:error","missing_code");
  if (!state || state !== expected) return send("authorization:github:error","bad_state");

  const redirectUri = new URL("/auth/callback", url.origin).toString();
  const data = await exchange(code, redirectUri, locals.runtime.env);
  if (!data.access_token) return send("authorization:github:error","no_token");
  return send("authorization:github:success", data.access_token);
};
