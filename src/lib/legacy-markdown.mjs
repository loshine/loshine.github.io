// Preserve Hexo's case-sensitive URLs and heading anchors for existing links.
export function legacySlug(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u0000-\u001f]/g, '')
    .replace(/[\s~`!@#$%^&*()\-_+=[\]{}|\\;:"'<>,.?/]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function legacyMarkdown() {
  return (tree) => {
    const counts = new Map();
    const text = (node) => node.type === 'text' ? node.value : (node.children ?? []).map(text).join('');
    function visit(node) {
      if (node.type === 'element' && /^h[1-6]$/.test(node.tagName)) {
        const slug = legacySlug(text(node).replace(/<[^>]*>/g, '').trim());
        const count = counts.get(slug) ?? 0;
        node.properties.id = count ? `${slug}-${count}` : slug;
        counts.set(slug, count + 1);
      }
      if ((node.type === 'comment' && node.value.trim() === 'more') || (node.type === 'raw' && /^<!--\s*more\s*-->$/.test(node.value.trim()))) {
        node.type = 'element';
        node.tagName = 'span';
        node.properties = { id: 'more' };
        node.children = [];
      }
      if (node.type === 'element' && node.tagName === 'img') {
        node.properties.loading = 'lazy';
        node.properties.decoding = 'async';
      }
      for (const child of node.children ?? []) visit(child);
    }
    visit(tree);
  };
}
