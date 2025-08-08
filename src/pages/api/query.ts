export const onRequestGet: PagesFunction = async (ctx) => {
  const url = new URL(ctx.request.url);
  const query = url.searchParams.get("query");

  console.log("🔍 query=", query);


  if (!query) {
    return new Response(
      JSON.stringify({ results: [], error: "Missing search term" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const rawgRes = await fetch(
      `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(query)}&page_size=10`
    );

    if (!rawgRes.ok) {
      return new Response(
        JSON.stringify({ results: [], error: `RAWG error ${rawgRes.status}` }),
        {
          status: rawgRes.status,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const data = await rawgRes.json();
    return new Response(JSON.stringify({ results: data.results }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ results: [], error: "RAWG fetch failed" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};
