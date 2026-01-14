
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "node:crypto";

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

// Recursively get all markdown files
function getFilesRecursive(dir) {
    if (!fs.existsSync(dir)) return [];
    let results = [];
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
            results = results.concat(getFilesRecursive(fullPath));
        } else if (item.name.endsWith(".md") || item.name.endsWith(".mdx")) {
            results.push(fullPath);
        }
    }
    return results;
}

const buildRagIndex = () => {
    console.log("Building RAG index (Node.js version)...");

    const collections = ["article", "submissions"];
    let allPosts = [];
    const authorsSet = new Set();
    const categoryCounts = {};

    // 1. Process Content Collections (RECURSIVELY)
    collections.forEach(col => {
        const colDir = path.join(CONTENT_DIR, col);
        const files = getFilesRecursive(colDir);

        files.forEach(filePath => {
            const content = fs.readFileSync(filePath, "utf-8");
            const { data, body } = parseFrontmatter(content);
            const slug = path.basename(filePath, path.extname(filePath));

            // Track authors
            if (data.author) {
                authorsSet.add(data.author);
            }

            // Track categories
            const category = (data.category || "uncategorized").toLowerCase();
            categoryCounts[category] = (categoryCounts[category] || 0) + 1;

            // Generate a short, unique ID using MD5 hash
            const shortId = crypto.createHash('md5').update(slug + filePath).digest('hex');

            allPosts.push({
                id: shortId,
                title: data.title || slug,
                description: data.description || "",
                tags: Array.isArray(data.tags) ? data.tags.join(", ") : (data.tags || ""),
                author: data.author || "lyndonguitar",
                category: category,
                body: body,
                url: `/article/${slug}/`,
                pubDate: data.pubDate || new Date().toISOString()
            });
        });
    });

    // 2. Build Author Info from actual data
    const authorsList = Array.from(authorsSet);
    const authorInfo = authorsList.length > 0
        ? `Authors: ${authorsList.join(", ")}. The main author and creator of PlayTested.net is Lyndon (lyndonguitar).`
        : "Main Author: Lyndon (lyndonguitar). He is the creator of PlayTested.net.";

    // 3. Build Category Stats
    const categoryStats = Object.entries(categoryCounts)
        .map(([cat, count]) => `- ${cat}: ${count} articles`)
        .join("\n");

    // 4. Read About page for site context
    let aboutText = "";
    try {
        const aboutPath = path.resolve(__dirname, "../src/pages/about.astro");
        const aboutContent = fs.readFileSync(aboutPath, "utf-8");
        // Naive HTML strip: remove tags
        aboutText = aboutContent.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
        // Truncate to keep it reasonable
        if (aboutText.length > 2000) {
            aboutText = aboutText.substring(0, 2000) + "...";
        }
    } catch (e) {
        console.warn("Could not read about.astro for RAG index:", e);
    }

    const totalArticles = allPosts.length;

    // Create a special document for Site Meta
    const siteMetaDoc = {
        id: "site-meta-info",
        title: "About PlayTested - Site Info & Stats",
        description: "Information about the website, authors, and statistics.",
        tags: "about, meta, authors, stats, lyndon, count, reviews, tech, write-up",
        author: "system",
        category: "meta",
        body: `
### About PlayTested
PlayTested is a no-nonsense gaming review platform and tech blog. Objective, honest reviews that cut through the noise. Created by Lyndon (lyndonguitar).

### Authors
${authorInfo}

### Statistics
- Total Articles: ${totalArticles} reviews and posts.
${categoryStats}
- Platform: Built with Astro, Tailwind, and Cloudflare.
        `.trim(),
        url: "/about/",
        pubDate: new Date().toISOString()
    };

    allPosts.push(siteMetaDoc);

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(allPosts, null, 2));
    console.log(`✅ rag-index.json built with ${allPosts.length} entries (Including Site Meta).`);
    console.log(`📊 Categories: ${JSON.stringify(categoryCounts)}`);
    console.log(`👤 Authors found: ${authorsList.join(", ")}`);
};

buildRagIndex();
