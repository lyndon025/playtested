import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export const GET = async ({ site }) => {
  const posts = await getCollection('article');
  const items = posts
    .sort((a,b) => +b.data.pubDate - +a.data.pubDate)
    .map((p) => ({
      link: `/article/${p.slug}`,
      title: p.data.title,
      pubDate: p.data.pubDate,
      description: p.data.description,
    }));

  return rss({
    title: 'PlayTested',
    description: 'PlayTested is a no-nonsense gaming review platform and tech blog. Objective, honest reviews that cut through the noise. Powered by AI.',
    site: site?.toString() ?? 'https://playtested.net',
    items
  });
};
