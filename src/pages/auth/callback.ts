// src/pages/auth/callback.ts
async function exchange(code: string, redirectUri: string, env: any) {
  const r = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
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

const send = (type: string, payload: string) =>
  new Response(
    `<!doctype html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Authorizing...</title>
    </head>
    <body>
      <script>
        (function() {
          var receiveMessage = function(message) {
            window.opener.postMessage(
              'authorization:github:${type}:${payload}',
              message.origin
            );
            window.removeEventListener("message", receiveMessage, false);
          }
          
          // Send message immediately
          if (window.opener) {
            window.opener.postMessage(
              'authorization:github:${type}:${payload}',
              '*'
            );
            
            // Try multiple times in case the parent isn't ready
            setTimeout(function() {
              window.opener.postMessage(
                'authorization:github:${type}:${payload}',
                '*'
              );
            }, 100);
            
            setTimeout(function() {
              window.opener.postMessage(
                'authorization:github:${type}:${payload}',
                '*'
              );
            }, 500);
          }
          
          // Close window after a delay
          setTimeout(function() {
            window.close();
          }, 1000);
        })();
      </script>
      <p>Authorization ${type}. This window should close automatically.</p>
    </body>
    </html>`,
    { 
      headers: { 
        "Content-Type": "text/html",
        "Cache-Control": "no-cache"
      } 
    }
  );

export const GET = async ({ request, url, locals }: any) => {
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expected =
    (request.headers.get("Cookie") || "").match(/(?:^|; )gh_oauth_state=([^;]+)/)?.[1] || "";
  const redirectUri = new URL("/auth/callback", url.origin).toString();

  if (!code) return send("error", "missing_code");
  if (!state || state !== expected) return send("error", "bad_state");

  try {
    const data = await exchange(code, redirectUri, locals.runtime.env);
    if (!data.access_token) return send("error", "no_token");
    return send("success", data.access_token);
  } catch (error) {
    console.error("OAuth exchange error:", error);
    return send("error", "exchange_failed");
  }
};