import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({
    base: './source/_posts',
    pattern: '**/*.md',
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string().optional(),
    category: z.array(z.string()).optional(),
    categories: z.array(z.string()).optional(),
    tags: z.array(z.string()).default([]),
    toc: z.boolean().default(true),
    comments: z.boolean().default(true),
  }),
});

const about = defineCollection({
  loader: glob({ base: './source/about', pattern: '*.md' }),
  schema: z.object({ title: z.string() }),
});

export const collections = { posts, about };
