import { defineConfig } from 'astro/config';
export default defineConfig({ site: 'https://blog.luckydogs.top', output: 'static', trailingSlash: 'always', markdown: { shikiConfig: { themes: { dark: 'github-dark', light: 'github-light' } } } });
