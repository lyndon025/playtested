import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getCollection } from "astro:content";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.resolve(__dirname, "../public/search-index.json");

const buildSearchIndex = async () => {
  // Fetch both the 'article' and 'submissions' collections
  const articles = await getCollection("article");
  const submissions = await getCollection("submissions");
  
  // Combine the content from both collections
  const allPosts = [...articles, ...submissions];

  // Create the search index from the combined posts
  const index = allPosts.map((post) => ({
    id: post.slug,
    title: post.data.title,
    description: post.data.description ?? "",
    tags: post.data.tags?.join(", ") ?? "",
    body: post.body.slice(0, 1000),
    url: `/article/${post.slug}`, // Note: This URL structure might need adjusting if submissions have a different base path.
    pubDate: post.data.pubDate,
  }));

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(index, null, 2));
  console.log(`✅ search-index.json built with ${index.length} entries.`);
};

buildSearchIndex();