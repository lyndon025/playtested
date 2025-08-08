// /scripts/build-search-index.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getCollection } from "astro:content";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.resolve(__dirname, "../public/search-index.json");

const buildSearchIndex = async () => {
  const articles = await getCollection("article");

  const index = articles.map((post) => ({
    id: post.slug,
    title: post.data.title,
    description: post.data.description ?? "",
    tags: post.data.tags?.join(", ") ?? "",
    body: post.body.slice(0, 1000),
    url: `/article/${post.slug}`,
  }));

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(index, null, 2));
  console.log(`✅ search-index.json built with ${index.length} entries.`);
};

buildSearchIndex();
