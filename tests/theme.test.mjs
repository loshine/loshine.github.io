import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { parseHTML } from 'linkedom';

const { document } = parseHTML(readFileSync('dist/index.html', 'utf8'));
const script = document.querySelector('script[data-theme-script]').textContent;

function themePage({ stored, dark = false, blocked = false } = {}) {
  const events = {};
  const root = { dataset: {} };
  const meta = {};
  const button = {
    hidden: true,
    setAttribute(name, value) { this[name] = value; },
    addEventListener(name, callback) { events[name] = callback; },
  };
  const system = { matches: dark, addEventListener(_, callback) { events.system = callback; } };
  let ready = false;
  runInNewContext(script, {
    window: { matchMedia: () => system, addEventListener(name, callback) { events[name] = callback; } },
    document: {
      documentElement: root,
      querySelector: () => meta,
      getElementById: () => ready ? button : null,
      addEventListener(name, callback) { events[name] = callback; },
    },
    localStorage: {
      getItem() { if (blocked) throw new Error('Storage disabled'); return stored; },
      setItem(_, value) { if (blocked) throw new Error('Storage disabled'); stored = value; },
    },
  });
  ready = true;
  events.DOMContentLoaded();
  return { root, button, meta, events, system, stored: () => stored };
}

test('theme follows system until a manual preference is saved and restored', () => {
  const page = themePage({ stored: 'invalid' });
  assert.equal(page.root.dataset.theme, 'light');
  assert.equal(page.button.hidden, false);
  page.system.matches = true;
  page.events.system();
  assert.equal(page.root.dataset.theme, 'dark');
  assert.equal(page.button['aria-pressed'], 'true');
  page.events.click();
  assert.equal(page.stored(), 'light');
  page.events.system();
  page.events.pageshow();
  assert.equal(page.root.dataset.theme, 'light');
  assert.equal(page.meta.content, '#fafafa');
  assert.equal(themePage({ stored: page.stored(), dark: true }).root.dataset.theme, 'light');
});

test('blocked browser storage still allows theme toggle and page restoration', () => {
  const page = themePage({ blocked: true, dark: true });
  assert.equal(page.root.dataset.theme, 'dark');
  page.events.click();
  page.events.pageshow();
  assert.equal(page.root.dataset.theme, 'light');
  assert.equal(page.button['aria-pressed'], 'false');
});
