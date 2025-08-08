// scripts/export-articles.ts
import fs from "fs";
import { getCollection } from "astro:content";

const posts = await getCollection("article");

const simplified = posts.map((post) => ({
  slug: post.slug,
  title: post.data.title,
  description: post.data.description || "",
  tags: post.data.tags || [],
}));

fs.writeFileSync("public/articles.json", JSON.stringify(simplified, null, 2));
console.log("✅ articles.json generated");
