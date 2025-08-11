// src/pages/auth/callback.ts
async function exchange(code: string, redirectUri: string, env: any) {
  const r = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri,
    }),
  });
  if (!r.ok) throw new Error(`Token exchange failed: ${r.status}`);
  return r.json();
}

export const GET = async ({ request, url, locals }) => {
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const cookie = request.headers.get("Cookie") || "";
  const expected =
    cookie.match(/(?:^|; )gh_oauth_state=([^;]+)/)?.[1] || "";

  const redirectUri = new URL("/auth/callback", url.origin).toString();

  // IMPORTANT: Inline-serialize the strings server-side
  const send = (msgType: string, payload: string) =>
    new Response(
      `<!doctype html><meta charset="utf-8"><script>
        (function () {
          var msg = ${JSON.stringify(msgType)} + ':' + ${JSON.stringify(payload)};
          function post(){ try{ window.opener && window.opener.postMessage(msg, '*'); }catch(e){} }
          post(); setTimeout(post, 50); setTimeout(post, 150);
          window.close();
        })();
      </script>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );

  if (!code) return send("authorization:github:error", "missing_code");
  if (!state || state !== expected)
    return send("authorization:github:error", "bad_state");

  try {
    const data = await exchange(code, redirectUri, locals.runtime.env);
    if (!data?.access_token)
      return send("authorization:github:error", "no_token");
    return send("authorization:github:success", data.access_token);
  } catch (err: any) {
    return send("authorization:github:error", String(err?.message || err));
  }
};
