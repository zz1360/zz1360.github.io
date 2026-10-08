import { getCollection } from 'astro:content';

export async function publishedPosts() {
  const now = new Date();
  return (await getCollection('blog', ({ data }) => !data.draft && data.date <= now))
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export function postUrl(id: string) {
  return `/blog/${id.split('/').map(encodeURIComponent).join('/')}/`;
}

export function displayDate(date: Date) {
  return new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', year: 'numeric', month: 'long', day: 'numeric' }).format(date);
}

export function xml(value: string) {
  return value.replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c]!);
}
