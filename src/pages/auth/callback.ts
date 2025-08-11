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

// Updated message format that Decap CMS expects
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
          function postAuthMessage() {
            if (window.opener) {
              // Send the message in the format CMS expects
              const message = 'authorization:github:${type}:${payload}';
              console.log('Sending message to parent:', message);
              
              window.opener.postMessage(message, '*');
              
              // Also try object format as backup
              window.opener.postMessage({
                type: 'authorization:github:${type}',
                payload: '${payload}'
              }, '*');
            }
          }
          
          // Send immediately
          postAuthMessage();
          
          // Send again after delays (in case parent isn't ready)
          setTimeout(postAuthMessage, 50);
          setTimeout(postAuthMessage, 200);
          setTimeout(postAuthMessage, 500);
          
          // Close window
          setTimeout(function() {
            console.log('Closing auth window');
            try {
              window.close();
            } catch(e) {
              console.log('Could not close window automatically');
            }
          }, 1500);
        })();
      </script>
      <div style="padding: 20px; text-align: center; font-family: system-ui;">
        <h2>Authorization ${type === 'success' ? 'Successful' : 'Failed'}</h2>
        <p>This window will close automatically...</p>
        <button onclick="window.close()" style="padding: 8px 16px; margin-top: 10px;">Close Window</button>
      </div>
    </body>
    </html>`,
    { 
      headers: { 
        "Content-Type": "text/html",
        "Cache-Control": "no-cache, no-store, must-revalidate"
      } 
    }
  );

export const GET = async ({ request, url, locals }: any) => {
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  
  if (error) {
    console.error('OAuth error:', error);
    return send("error", error);
  }
  
  const expected =
    (request.headers.get("Cookie") || "").match(/(?:^|; )gh_oauth_state=([^;]+)/)?.[1] || "";
  const redirectUri = new URL("/auth/callback", url.origin).toString();

  if (!code) return send("error", "missing_code");
  if (!state || state !== expected) return send("error", "bad_state");

  try {
    const data = await exchange(code, redirectUri, locals.runtime.env);
    if (!data.access_token) return send("error", "no_token");
    
    console.log('OAuth success, sending token to CMS');
    return send("success", data.access_token);
  } catch (error) {
    console.error("OAuth exchange error:", error);
    return send("error", "exchange_failed");
  }
};