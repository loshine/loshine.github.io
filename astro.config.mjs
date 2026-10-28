import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import { legacyMarkdown } from './src/lib/legacy-markdown.mjs';

export default defineConfig({
  site: 'https://loshine.github.io',
  trailingSlash: 'always',
  output: 'static',
  markdown: {
    shikiConfig: { theme: 'github-light', langAlias: { gradle: 'groovy' } },
    processor: unified({
      smartypants: false,
      rehypePlugins: [legacyMarkdown],
    }),
  },
});
