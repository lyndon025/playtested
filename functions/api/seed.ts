
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
        const model = "@cf/baai/bge-base-en-v1.5";

        let upsertCount = 0;
        const batchSize = 5;

        // 2. Process in Batches
        for (let i = 0; i < docs.length; i += batchSize) {
            const batch = docs.slice(i, i + batchSize);
            const texts = batch.map(d => `Title: ${d.title}\n${d.body.substring(0, 800)}`);

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
