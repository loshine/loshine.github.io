import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parseHTML } from 'linkedom';
import { legacySlug, legacyMarkdown } from '../src/lib/legacy-markdown.mjs';

const baseline = JSON.parse(readFileSync(new URL('./fixtures/legacy-site.json', import.meta.url), 'utf8'));
const readPage = (path) => parseHTML(readFileSync(join('dist', path), 'utf8')).document;

test('legacy heading slugs retain case, Chinese, punctuation handling, and duplicate suffixes', () => {
  assert.equal(legacySlug('Android Studio'), 'Android-Studio');
  assert.equal(legacySlug('Compose UI 自定义布局实战'), 'Compose-UI-自定义布局实战');
  assert.equal(legacySlug('  Café: A / B!  '), 'Cafe-A-B');
  assert.equal(legacySlug('同一作用域内，不能同名'), '同一作用域内，不能同名');
  const heading = () => ({ type: 'element', tagName: 'h2', properties: {}, children: [{ type: 'text', value: 'Layout' }] });
  const tree = { type: 'root', children: [heading(), heading(), { type: 'comment', value: ' more ' }] };
  legacyMarkdown()(tree);
  assert.equal(tree.children[0].properties.id, 'Layout');
  assert.equal(tree.children[1].properties.id, 'Layout-1');
  assert.equal(tree.children[2].properties.id, 'more');
});

test('every published Hexo page still exists at its original URL', () => {
  for (const route of baseline.routes) assert.ok(existsSync(join('dist', route)), `Missing old URL: ${route}`);
});

test('all 52 articles retain canonical URLs, heading anchors, and stable giscus mapping', () => {
  for (const [path, post] of Object.entries(baseline.posts)) {
    const document = readPage(`${path}index.html`);
    assert.equal(document.querySelector('link[rel="canonical"]').getAttribute('href'), new URL(path, 'https://loshine.github.io').href);
    const ids = new Set([...document.querySelectorAll('[id]')].map((node) => node.id));
    for (const heading of post.headings) assert.ok(ids.has(heading), `${path}: missing #${heading}`);
    const comments = document.querySelector('.giscus');
    assert.equal(comments.getAttribute('data-repo'), 'loshine/loshine.github.io');
    assert.equal(comments.getAttribute('data-mapping'), 'specific');
    assert.equal(comments.getAttribute('data-term'), path);
    assert.equal(comments.getAttribute('data-strict'), '1');
    assert.ok(comments.getAttribute('data-category-id'), `${path}: missing giscus category`);
    assert.equal(document.querySelector('meta[name="giscus:backlink"]').getAttribute('content'), new URL(path, 'https://loshine.github.io').href);
    assert.equal(document.querySelector('script[src*="disqus.com"]'), null);
    assert.equal(document.querySelector('#disqus_thread'), null);
    assert.ok(document.querySelector('[data-pagefind-body]'), `${path}: missing search body`);
  }
});

test('generated navigation and table-of-contents links resolve', () => {
  const pages = readdirSync('dist', { recursive: true }).filter((path) => path.endsWith('.html'));
  for (const path of pages) {
    const document = readPage(path);
    const links = document.querySelectorAll('nav a, header a, footer a, .post-list a, .taxonomy-grid a');
    for (const link of links) {
      const href = link.getAttribute('href');
      if (!href || !/^[#/]/.test(href)) continue;
      const url = new URL(href, `https://loshine.github.io/${path}`);
      const target = decodeURIComponent(url.pathname).replace(/^\//, '') + (url.pathname.endsWith('/') ? 'index.html' : '');
      assert.ok(existsSync(join('dist', target)), `${path}: broken link ${href}`);
      if (url.hash) assert.ok(readPage(target).getElementById(decodeURIComponent(url.hash.slice(1))), `${path}: broken anchor ${href}`);
    }
  }
});

test('Pagefind, favicon and error page are present; old template tags are gone', () => {
  for (const file of ['pagefind/pagefind.js', 'pagefind/pagefind-component-ui.js', 'pagefind/pagefind-component-ui.css', 'assets/img/avatar.png', 'assets/img/favicon.png', '404.html', '.nojekyll']) assert.ok(existsSync(join('dist', file)), file);
  assert.ok(readPage('2024/12/21/compose-ui-custom-layout/index.html').getElementById('more'));
  const rime = readPage('2015/09/12/rime/index.html');
  assert.ok(!rime.querySelector('.prose').textContent.includes('{% highlight'));
  assert.ok(!rime.querySelector('.prose').textContent.includes('{% endhighlight'));
});
