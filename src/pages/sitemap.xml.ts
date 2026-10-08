import { publishedPosts, postUrl, xml } from '../lib/posts';
import type { APIRoute } from 'astro';
export const GET: APIRoute = async () => {
  const paths = ['/', '/blog/', '/explore/dnd/', '/dnd/', '/dnd/works/yinhun/', '/privacy/', '/support/', ...(await publishedPosts()).map(p => postUrl(p.id))];
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(path => `<url><loc>${xml('https://blog.luckydogs.top' + path)}</loc></url>`).join('')}</urlset>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
