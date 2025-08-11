async function exchangeCodeForToken(code, redirectUri, env) {
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Accept": "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri,
    }),
  });
  if (!res.ok) throw new Error(`GitHub token exchange failed: ${res.status}`);
  return res.json();
}

function getCookie(req, name) {
  const cookie = req.headers.get("Cookie") || "";
  const m = cookie.match(new RegExp(`(?:^|; )${name}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : "";
}

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = getCookie(request, "gh_oauth_state");
  const redirectUri = new URL("/auth/callback", url.origin).toString();

  const send = (type, payload) => new Response(
    `<!doctype html><html><body><script>
      (function(){
        function msg(){ window.opener && window.opener.postMessage('${type}:${payload}', '*'); window.close(); }
        msg();
      })();
    </script></body></html>`,
    { headers: { "Content-Type": "text/html" } }
  );

  try {
    if (!code) return send("authorization:github:error", "missing_code");
    if (!state || state !== cookieState) return send("authorization:github:error", "bad_state");

    const data = await exchangeCodeForToken(code, redirectUri, env);
    if (!data.access_token) return send("authorization:github:error", "no_token");

    return send("authorization:github:success", data.access_token);
  } catch (e) {
    return send("authorization:github:error", (e && e.message) || "unknown_error");
  }
}
