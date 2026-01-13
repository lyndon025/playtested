
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

        if (env.AI && env.VECTOR_DB) {
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
                console.error("Vector search failed, falling back to keywords:", e);
            }
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

        // 4. Build Context
        if (topDocs.length > 0) {
            contextText = "Here is some relevant context from the website articles:\n\n" +
                topDocs.map(d => `Title: ${d.title}\nURL: ${d.url}\nContent excerpt: ${d.body.substring(0, 1500)}...`).join("\n\n---\n\n");
        }

        // 5. Construct Prompt & Call AI
        const systemPrompt: Message = {
            role: "system",
            content: `You are a helpful assistant for the 'PlayTested.net' tech and gaming review site. 
        Use the following retrieved context to answer the user's question. 
        If the answer is in the context, cite the article title. 
        If not, answer generally but mention you couldn't find specific info in the blog.
        
        CONTEXT:
        ${contextText}`
        };

        const finalMessages = [systemPrompt, ...messages];

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": url.origin,
                "X-Title": "Storyteller Blog",
            },
            body: JSON.stringify({
                model: "google/gemini-2.0-flash-lite-preview-02-05:free",
                messages: finalMessages,
                stream: true,
            }),
        });

        return response;

    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
    }
};
