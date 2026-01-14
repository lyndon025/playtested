
interface Env {
    AI: any;
    VECTOR_DB: any;
}

interface RagDoc {
    id: string;
    title: string;
    body: string;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
    try {
        const url = new URL(request.url);
        const indexUrl = `${url.origin}/rag-index.json`;

        // 1. Load Data
        const indexRes = await fetch(indexUrl);
        if (!indexRes.ok) return new Response("Failed to load rag-index.json", { status: 500 });

        const docs: RagDoc[] = await indexRes.json();

        // Check if we're in local dev (Vectorize not available)
        if (!env.VECTOR_DB || typeof env.VECTOR_DB.upsert !== 'function') {
            return new Response(JSON.stringify({
                success: true,
                message: `[LOCAL MODE] Simulated seed of ${docs.length} documents. In local dev, the chat uses keyword search instead of vectors.`,
                mode: "local-simulation",
                docCount: docs.length
            }), { headers: { "Content-Type": "application/json" } });
        }

        const model = "@cf/baai/bge-base-en-v1.5";

        let upsertCount = 0;
        const batchSize = 5;

        // 2. Process in Batches
        for (let i = 0; i < docs.length; i += batchSize) {
            const batch = docs.slice(i, i + batchSize);
            // Sanitize text: remove special chars, limit length to 512 to avoid API limits (except Site Info)
            const texts = batch.map(d => {
                const isSiteInfo = d.id === "site-meta-info";
                const maxLength = isSiteInfo ? 2000 : 512;

                const cleanText = `Title: ${d.title}\n${d.body}`
                    .replace(/[^\w\s.,!?-]/g, ' ') // Remove special chars
                    .replace(/\s+/g, ' ')          // Normalize whitespace
                    .trim()
                    .substring(0, maxLength);      // Limit length
                return cleanText || "No content";
            });

            // Generate Embeddings
            const { data: embeddings } = await env.AI.run(model, { text: texts });

            // Prepare Vectorize Payload
            const vectors = batch.map((doc, idx) => ({
                id: doc.id,
                values: embeddings[idx],
                metadata: { title: doc.title }
            }));

            // Upsert
            await env.VECTOR_DB.upsert(vectors);
            upsertCount += vectors.length;
        }

        return new Response(JSON.stringify({
            success: true,
            message: `Successfully seeded ${upsertCount} documents into Vectorize (Local)`,
            index: "playbook-local"
        }), { headers: { "Content-Type": "application/json" } });

    } catch (err) {
        return new Response(JSON.stringify({
            error: err.message,
            stack: err.stack,
            availableEnvKeys: Object.keys(env) // Return keys to debug
        }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
};
