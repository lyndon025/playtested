// src/pages/auth/callback.ts

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
  if (!r.ok) {
    const errorBody = await r.json().catch(() => ({ error_description: "Failed to parse error from GitHub." }));
    throw new Error(errorBody.error_description || `Token exchange failed: ${r.status}`);
  }
  return r.json();
}

export const GET = async ({ request, url, locals }) => {
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expected = (request.headers.get("Cookie")||"").match(/(?:^|; )gh_oauth_state=([^;]+)/)?.[1];

  const send = (type: string, payload: any) =>
    new Response(`<!doctype html><html><body><script>
      (function(){
        // Escape the payload to prevent script injection
        const payload = ${JSON.stringify(JSON.stringify(payload))};
        var msg='${type}:${payload}';
        if(window.opener) window.opener.postMessage(msg,'*');
        window.close();
      })();</script><p><b>Error:</b> ${payload.error_description || payload.error || "An unknown error occurred."}</p></body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );

  try {
    if (!code) throw new Error("Authentication failed: No 'code' parameter was provided.");
    if (!state || state !== expected) throw new Error("Authentication failed: State mismatch. Please try again.");

    const redirectUri = new URL("/auth/callback", url.origin).toString();
    const data = await exchange(code, redirectUri, locals.runtime.env);
    
    if (!data.access_token) throw new Error("Authentication failed: No access token was returned from GitHub.");

    return send("authorization:github:success", { token: data.access_token, provider: "github" });
  } catch (err) {
    console.error(err);
    // Send a failure message back to the main window
    return send("authorization:github:error", { error: err.message });
  }
};