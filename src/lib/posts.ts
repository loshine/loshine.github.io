import { getCollection, type CollectionEntry } from 'astro:content';
import { legacySlug } from './legacy-markdown.mjs';

export type Post = CollectionEntry<'posts'>;
export const siteTitle = '饭窝';
export const siteDescription = 'Loshine 的技术笔记，记录 Android、Kotlin 与跨平台开发。';
export const dateLabel = (post: Post) => post.data.date.toISOString().slice(0, 10);
export const postPath = (post: Post) => `/${dateLabel(post).replaceAll('-', '/')}/${post.id.replace(/^\d{4}-\d{2}-\d{2}-/, '')}/`;
export const categories = (post: Post) => post.data.categories ?? post.data.category ?? ['uncategorized'];
export const taxonomyPath = (kind: 'tags' | 'categories', name: string) => `/${kind}/${encodeURIComponent(legacySlug(name))}/`;

export async function getPosts() {
  return (await getCollection('posts')).sort((a, b) => b.data.date.getTime() - a.data.date.getTime() || a.id.localeCompare(b.id));
}

export function summary(post: Post) {
  if (post.data.description) return post.data.description;
  return (post.body ?? '').split(/<!--\s*more\s*-->/)[0]
    .replace(/```[\s\S]*?```/g, '').replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[#*`>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 160);
}

export function listingRoutes(posts: Post[]) {
  const routes: { params: { path: string | undefined }; props: { title: string; posts: Post[]; page: number; pages: number; base: string } }[] = [];
  function add(base: string, title: string, entries: Post[]) {
    const pages = Math.max(1, Math.ceil(entries.length / 10));
    for (let page = 1; page <= pages; page++) {
      const path = page === 1 ? base : `${base ? `${base}/` : ''}page/${page}`;
      routes.push({ params: { path: path || undefined }, props: { title, posts: entries.slice((page - 1) * 10, page * 10), page, pages, base } });
    }
  }
  add('', '文章', posts);
  add('archives', '所有归档', posts);
  const periods = new Set(posts.flatMap((post) => [dateLabel(post).slice(0, 4), dateLabel(post).slice(0, 7).replace('-', '/')]));
  for (const period of periods) add(`archives/${period}`, `${period.replace('/', ' 年 ')} 归档`, posts.filter((post) => dateLabel(post).replaceAll('-', '/').startsWith(period)));
  for (const kind of ['tags', 'categories'] as const) {
    const names = new Set(posts.flatMap((post) => kind === 'tags' ? post.data.tags : categories(post)));
    for (const name of names) add(`${kind}/${legacySlug(name)}`, `${kind === 'tags' ? '标签' : '分类'}：${name}`, posts.filter((post) => (kind === 'tags' ? post.data.tags : categories(post)).includes(name)));
  }
  return routes;
}
