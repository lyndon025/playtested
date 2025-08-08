import type { APIRoute } from "astro";
import fs from "fs";
import path from "path";
import { getCollection } from "astro:content";

export const GET: APIRoute = async () => {
  const articles = await getCollection("article");

  const index = articles.map((post) => ({
    id: post.slug,
    title: post.data.title,
    description: post.data.description ?? "",
    tags: post.data.tags?.join(", ") ?? "",
    body: post.body.slice(0, 1000),
    url: `/article/${post.slug}`,
  }));

  const filePath = path.resolve("./public/search-index.json");
  fs.writeFileSync(filePath, JSON.stringify(index, null, 2));

  return new Response(`✅ search-index.json built (${index.length} items)`);
};
