async function exchangeToken(code: string, redirectUri: string, env: any) {
  const r = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri
    })
  });
  if (!r.ok) throw new Error(`token exchange failed ${r.status}`);
  return r.json();
}

function popupMessage(type: string, payload: any) {
  const msg = `${type}:${JSON.stringify(payload)}`;
  return `
    <!doctype html>
    <meta charset="utf-8">
    <script>
      (function() {
        function receiveMessage(e) {
          console.log("receiveMessage %o", e);
          window.opener.postMessage(
            ${JSON.stringify(msg)},
            e.origin
          );
        }
        window.addEventListener("message", receiveMessage, false);
        // Signal to opener that we're ready
        window.opener.postMessage("authorizing:github", "*");
      })();
    </script>`;
}

export const onRequestGet: PagesFunction = async ({ request, env }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookie = request.headers.get("Cookie") || "";
  const expected = cookie.match(/(?:^|; )gh_oauth_state=([^;]+)/)?.[1] || "";
  const redirectUri = `${url.origin}/auth/callback`;

  if (!code) return new Response(popupMessage("authorization:github:error", { error: "missing_code" }), { headers: { "Content-Type": "text/html; charset=utf-8" } });
  if (!state || state !== expected) return new Response(popupMessage("authorization:github:error", { error: "bad_state" }), { headers: { "Content-Type": "text/html; charset=utf-8" } });

  try {
    const data = await exchangeToken(code, redirectUri, env);
    const token = data?.access_token;
    if (!token) return new Response(popupMessage("authorization:github:error", { error: "no_token" }), { headers: { "Content-Type": "text/html; charset=utf-8" } });
    return new Response(popupMessage("authorization:github:success", { token, provider: "github" }), { headers: { "Content-Type": "text/html; charset=utf-8" } });
  } catch (e: any) {
    return new Response(popupMessage("authorization:github:error", { error: String(e?.message || e) }), { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }
};