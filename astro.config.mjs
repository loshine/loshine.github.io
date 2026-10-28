import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import { legacyMarkdown } from './src/lib/legacy-markdown.mjs';

export default defineConfig({
  site: 'https://loshine.github.io',
  trailingSlash: 'always',
  output: 'static',
  markdown: {
    shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' }, langAlias: { gradle: 'groovy' } },
    processor: unified({
      smartypants: false,
      rehypePlugins: [legacyMarkdown],
    }),
  },
});
