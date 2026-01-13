
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.resolve(__dirname, "../src/content");
const OUTPUT_PATH = path.resolve(__dirname, "../public/rag-index.json");

function parseFrontmatter(fileContent) {
    const match = fileContent.match(/^---\s*([\s\S]*?)\s*---\s*([\s\S]*)$/);
    if (!match) return { data: {}, body: fileContent };

    const frontmatterRaw = match[1];
    const body = match[2].trim();
    const data = {};

    frontmatterRaw.split("\n").forEach(line => {
        const parts = line.split(":");
        if (parts.length >= 2) {
            const key = parts[0].trim();
            let value = parts.slice(1).join(":").trim();
            if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
            if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
            if (value.startsWith("[") && value.endsWith("]")) {
                value = value.slice(1, -1).split(",").map(s => s.trim().replace(/^['"]|['"]$/g, ""));
                data[key] = value;
            } else {
                data[key] = value;
            }
        }
    });

    return { data, body };
}

function getFiles(dir) {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir).filter(f => f.endsWith(".md") || f.endsWith(".mdx")).map(f => path.join(dir, f));
}

const buildRagIndex = () => {
    console.log("Building RAG index (Node.js version)...");

    const collections = ["article", "submissions"];
    let allPosts = [];

    collections.forEach(col => {
        const colDir = path.join(CONTENT_DIR, col);
        const files = getFiles(colDir);

        files.forEach(filePath => {
            const content = fs.readFileSync(filePath, "utf-8");
            const { data, body } = parseFrontmatter(content);
            const slug = path.basename(filePath, path.extname(filePath));

            allPosts.push({
                id: slug,
                title: data.title || slug,
                description: data.description || "",
                tags: Array.isArray(data.tags) ? data.tags.join(", ") : (data.tags || ""),
                body: body,
                url: `/article/${slug}/`,
                pubDate: data.pubDate || new Date().toISOString()
            });
        });
    });

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(allPosts, null, 2));
    console.log(`✅ rag-index.json built with ${allPosts.length} entries (Full Text).`);
};

buildRagIndex();
