import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { parseHTML } from 'linkedom';

const component = readFileSync('src/components/Comments.astro', 'utf8');
const script = ts.transpileModule(component.match(/<script>([\s\S]*?)<\/script>/)[1], {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText;

test('comments load only on request, allow retry, and sync theme only to giscus', () => {
  const { document, window } = parseHTML(readFileSync('dist/2024/12/21/compose-ui-custom-layout/index.html', 'utf8'));
  let onTheme;
  runInNewContext(script, {
    document,
    MutationObserver: class {
      constructor(callback) { onTheme = callback; }
      observe() {}
    },
  });
  const button = document.querySelector('#load-comments');
  const container = document.querySelector('.giscus');
  assert.equal(container.querySelector('script'), null);
  document.documentElement.dataset.theme = 'dark';
  button.click();
  let embed = container.querySelector('script');
  assert.equal(embed.src, 'https://giscus.app/client.js');
  assert.equal(embed.dataset.theme, 'dark');
  assert.equal(embed.dataset.term, '/2024/12/21/compose-ui-custom-layout/');
  assert.equal(button.disabled, true);
  embed.dispatchEvent(new window.Event('error'));
  assert.equal(button.disabled, false);
  assert.equal(container.querySelector('script'), null);
  assert.match(document.querySelector('#comments-status').textContent, /重试/);
  button.click();
  embed = container.querySelector('script');
  assert.equal(container.querySelectorAll('script').length, 1);
  const iframe = document.createElement('iframe');
  iframe.className = 'giscus-frame';
  const messages = [];
  iframe.contentWindow = { postMessage: (data, origin) => messages.push({ data, origin }) };
  container.appendChild(iframe);
  embed.dispatchEvent(new window.Event('load'));
  assert.equal(button.hidden, true);
  document.documentElement.dataset.theme = 'light';
  onTheme();
  assert.equal(messages.at(-1).data.giscus.setConfig.theme, 'light');
  assert.equal(messages.at(-1).origin, 'https://giscus.app');
});
