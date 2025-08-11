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

function popupMessage(type: string, payload: string) {
  return new Response(
    `<!doctype html><meta charset="utf-8"><script>
      (function () {
        var msg = ${JSON.stringify(type)} + ':' + ${JSON.stringify(payload)};
        function post(){ try{ window.opener && window.opener.postMessage(msg, '*'); }catch(e){} }
        post(); setTimeout(post, 50); setTimeout(post, 150);
        window.close();
      })();
    </script>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

export const onRequestGet: PagesFunction = async ({ request, env }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookie = request.headers.get("Cookie") || "";
  const expected = cookie.match(/(?:^|; )gh_oauth_state=([^;]+)/)?.[1] || "";
  const redirectUri = `${url.origin}/auth/callback`;

  if (!code) return popupMessage("authorization:github:error", "missing_code");
  if (!state || state !== expected) return popupMessage("authorization:github:error", "bad_state");

  try {
    const data = await exchangeToken(code, redirectUri, env);
    const token = data?.access_token;
    if (!token) return popupMessage("authorization:github:error", "no_token");
    return popupMessage("authorization:github:success", token);
  } catch (e: any) {
    return popupMessage("authorization:github:error", String(e?.message || e));
  }
};
