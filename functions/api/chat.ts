
interface Env {
    OPENROUTER_API_KEY: string;
    AI: any;
    VECTOR_DB: any;
}

interface Message {
    role: "user" | "assistant" | "system";
    content: string;
}

interface RagDoc {
    id: string;
    title: string;
    body: string;
    url: string;
    tags: string;
    author?: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env, next }) => {
    try {
        const { messages } = await request.json() as { messages: Message[] };
        if (!messages || messages.length === 0) {
            return new Response("No messages provided", { status: 400 });
        }

        const lastMessage = messages[messages.length - 1].content;
        let contextText = "";

        // 1. Fetch Full Content Index (needed for body text)
        const url = new URL(request.url);
        const indexUrl = `${url.origin}/rag-index.json`;
        const indexRes = await fetch(indexUrl);
        let fullIndex: RagDoc[] = [];
        if (indexRes.ok) {
            fullIndex = await indexRes.json();
        }

        // 2. VECTOR SEARCH (Try Vectorize first)
        let topDocs: RagDoc[] = [];

        if (env.AI && env.VECTOR_DB && typeof env.VECTOR_DB.query === 'function') {
            try {
                // Generate Query Vector
                const model = "@cf/baai/bge-base-en-v1.5";
                const { data: embeddings } = await env.AI.run(model, { text: [lastMessage] });
                const queryVector = embeddings[0];

                // Query Vector DB
                const vectorResults = await env.VECTOR_DB.query(queryVector, { topK: 3, returnMetadata: true });

                // Map IDs back to full content
                const foundIds = vectorResults.matches.map(m => m.id);
                topDocs = fullIndex.filter(d => foundIds.includes(d.id));

                console.log(`Vector Search found: ${foundIds.join(', ')}`);
            } catch (e) {
                // Silent fallback to keywords - this is expected in local dev
                console.log("Using keyword search (vector unavailable)");
            }
        } else {
            // Local mode - use keyword search directly
            console.log("Local mode: using keyword search");
        }

        // 3. Fallback: KEYWORD SEARCH (if Vector failed or returned nothing)
        if (topDocs.length === 0 && fullIndex.length > 0) {
            const keywords = lastMessage.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 3);
            const scoredDocs = fullIndex.map(doc => {
                let score = 0;
                const textToSearch = (doc.title + " " + doc.tags + " " + doc.body).toLowerCase();
                keywords.forEach(kw => { if (textToSearch.includes(kw)) score++; });
                return { doc, score };
            });
            topDocs = scoredDocs.filter(d => d.score > 0).sort((a, b) => b.score - a.score).slice(0, 3).map(d => d.doc);
        }

        // 4. Build Context - ALWAYS include Site Info for author/stats queries
        const siteInfo = fullIndex.find(d => d.id === "site-meta-info");
        if (siteInfo && !topDocs.some(d => d.id === "site-meta-info")) {
            topDocs.unshift(siteInfo); // Add Site Info at the start
        }

        // Build context with numbered references to prevent URL corruption
        let articleList = "";
        let referenceList = "";
        if (topDocs.length > 0) {
            topDocs.forEach((d, i) => {
                const refNum = i + 1;
                articleList += `[${refNum}] "${d.title}" by ${d.author || 'lyndonguitar'}\nExcerpt: ${d.body.substring(0, 600)}...\n\n`;
                referenceList += `[${refNum}] https://playtested.net${d.url}\n`;
            });
            contextText = `ARTICLES:\n${articleList}\nREFERENCE LINKS (use these exact URLs):\n${referenceList}`;
        }

        // 5. Construct Prompt & Call AI
        const systemPrompt: Message = {
            role: "system",
            content: `You are the helpful AI assistant for PlayTested.net, a gaming and tech review site.

HOW TO RESPOND:
- When mentioning an article, bold the title and add its reference number: **Article Title** [1]
- At the END of your response, add a "Links:" section with the actual URLs for any references you used
- Format: Links:\n[1] URL\n[2] URL
- Only include links you actually referenced in your answer

EXAMPLE RESPONSE:
We have a review of that game! Check out **Chained Echoes - First Impressions** [1] by lyndonguitar. It covers the combat system and worldbuilding.

Links:
[1] https://playtested.net/article/chainedechoes/

INSTRUCTIONS:
- Answer ONLY based on the provided "ARTICLES" context. Do not make up info.
- If the user asks about the site owner, authors, or article counts, check the context for "About PlayTested" or "Statistics".
- Give brief, friendly answers (2-3 sentences max per point).
- If no relevant articles found, answer generally and suggest browsing the site.
- ALWAYS include the Links section at the end if you referenced any articles.

${contextText}`
        };

        const finalMessages = [systemPrompt, ...messages];

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": url.origin,
                "X-Title": "PlayTested.Net",
            },
            body: JSON.stringify({
                model: "google/gemma-3-27b-it:free", // Free Gemma model with numbered refs

                messages: finalMessages,
                max_tokens: 2048,
                stream: true,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("OpenRouter API Error:", response.status, errorText);
            return new Response(JSON.stringify({ error: `OpenRouter error: ${response.status}`, details: errorText }), {
                status: response.status,
                headers: { "Content-Type": "application/json" }
            });
        }

        return response;

    } catch (err) {
        console.error("Chat Error:", err);
        return new Response(JSON.stringify({ error: "Internal Server Error", details: String(err) }), { status: 500 });
    }
};
