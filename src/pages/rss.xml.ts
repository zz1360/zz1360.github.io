import { publishedPosts, postUrl, xml } from '../lib/posts';
import type { APIRoute } from 'astro';
export const GET: APIRoute = async () => {
  const items = (await publishedPosts()).map(p => {
    const url = `https://blog.luckydogs.top${postUrl(p.id)}`;
    return `<item><title>${xml(p.data.title)}</title><description>${xml(p.data.description)}</description><link>${xml(url)}</link><guid isPermaLink="true">${xml(url)}</guid><pubDate>${p.data.date.toUTCString()}</pubDate></item>`;
  }).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>0101 比特酒馆 · Blog</title><link>https://blog.luckydogs.top/blog/</link><description>记录所见，探索未至之境。</description><language>zh-CN</language>${items}</channel></rss>`, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
