import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import { convertPageToMarkdown } from '../src/markdown/convertPageToMarkdown';

function createDocument(html: string, url = 'https://example.com/transformers'): Document {
  return new JSDOM(html, { url }).window.document;
}

describe('convertPageToMarkdown', () => {
  it('exports article markdown with frontmatter', () => {
    const document = createDocument(`
      <!doctype html>
      <html>
        <head><title>How Transformers Work</title></head>
        <body>
          <article>
            <h1>How Transformers Work</h1>
            <p>Transformers use <a href="/attention">attention</a>.</p>
            <img src="/images/diagram.png" alt="diagram" />
          </article>
        </body>
      </html>
    `);

    const result = convertPageToMarkdown(document, new Date('2026-04-09T12:00:00Z'));

    expect(result.markdown).toContain('title: "How Transformers Work"');
    expect(result.markdown).toContain('url: "https://example.com/transformers"');
    expect(result.markdown).toContain('clipped: "2026-04-09"');
    expect(result.markdown).toContain('tags: ["web_clip"]');
    expect(result.markdown).toContain('source_type: web_clip');
    expect(result.markdown).toContain('images: 1');
    expect(result.markdown).toContain('# How Transformers Work');
    expect(result.markdown).toContain('[attention](https://example.com/attention)');
    expect(result.markdown).toContain('![diagram](https://example.com/images/diagram.png)');
  });

  it('throws when Readability cannot extract content', () => {
    const document = createDocument('<!doctype html><html><body><button>Only UI</button></body></html>');

    expect(() => convertPageToMarkdown(document)).toThrow('无法提取正文');
  });

  it('escapes frontmatter and markdown title line breaks', () => {
    const document = createDocument(`
      <!doctype html>
      <html>
        <head><title>Safe &quot;title&quot;
malicious: true</title></head>
        <body>
          <article>
            <h1>Safe &quot;title&quot;
malicious: true</h1>
            <p>Hello.</p>
          </article>
        </body>
      </html>
    `);

    const result = convertPageToMarkdown(document, new Date('2026-04-09T12:00:00Z'));

    expect(result.markdown).toContain('title: "Safe \\"title\\" malicious: true"');
    expect(result.markdown).toContain('# Safe "title" malicious: true');
    expect(result.markdown).not.toContain('title: "Safe "title"\nmalicious: true"');
  });

  it('removes unsafe link and image protocols', () => {
    const document = createDocument(`
      <!doctype html>
      <html>
        <head><title>Unsafe URLs</title></head>
        <body>
          <article>
            <h1>Unsafe URLs</h1>
            <p><a href="javascript:alert(1)">bad link</a></p>
            <img src="data:image/svg+xml,<svg></svg>" alt="bad image" />
            <img src="https://example.com/safe.png" alt="safe image" />
          </article>
        </body>
      </html>
    `);

    const result = convertPageToMarkdown(document, new Date('2026-04-09T12:00:00Z'));

    expect(result.imageCount).toBe(1);
    expect(result.markdown).toContain('bad link');
    expect(result.markdown).not.toContain('javascript:alert');
    expect(result.markdown).not.toContain('data:image');
    expect(result.markdown).toContain('![safe image](https://example.com/safe.png)');
    expect(result.markdown).toContain('images: 1');
  });

  it('demotes article headings and removes bold markers from heading text', () => {
    const document = createDocument(`
      <!doctype html>
      <html>
        <head><title>Heading Rules</title></head>
        <body>
          <article>
            <h1><strong>Main Section</strong></h1>
            <h2><strong>Nested Section</strong></h2>
            <p>Body.</p>
          </article>
        </body>
      </html>
    `);

    const result = convertPageToMarkdown(document, new Date('2026-04-09T12:00:00Z'));

    expect(result.markdown).toContain('\n## Main Section\n');
    expect(result.markdown).toContain('\n### Nested Section\n');
    expect(result.markdown).not.toContain('## **');
    expect(result.markdown).not.toContain('### **');
  });

  it('converts article tables to markdown tables', () => {
    const document = createDocument(`
      <!doctype html>
      <html>
        <head><title>Table Article</title></head>
        <body>
          <article>
            <h1>Table Article</h1>
            <table>
              <thead>
                <tr><th>Name</th><th>Score</th></tr>
              </thead>
              <tbody>
                <tr><td>Alice</td><td>95</td></tr>
                <tr><td>Bob</td><td>88</td></tr>
              </tbody>
            </table>
          </article>
        </body>
      </html>
    `);

    const result = convertPageToMarkdown(document, new Date('2026-04-09T12:00:00Z'));

    expect(result.markdown).toContain('| Name | Score |');
    expect(result.markdown).toContain('| --- | --- |');
    expect(result.markdown).toContain('| Alice | 95 |');
    expect(result.markdown).toContain('| Bob | 88 |');
  });

  it('converts tables without thead to markdown tables', () => {
    const document = createDocument(`
      <!doctype html>
      <html>
        <head><title>No Thead Table</title></head>
        <body>
          <article>
            <h1>No Thead Table</h1>
            <table>
              <tbody>
                <tr><td>token</td><td>izer</td><td>:</td></tr>
                <tr><td>hello</td><td>world</td><td>!</td></tr>
              </tbody>
            </table>
          </article>
        </body>
      </html>
    `);

    const result = convertPageToMarkdown(document, new Date('2026-04-09T12:00:00Z'));

    expect(result.markdown).toContain('| token | izer | : |');
    expect(result.markdown).toContain('| --- | --- | --- |');
    expect(result.markdown).toContain('| hello | world | ! |');
    expect(result.markdown).not.toContain('<table>');
    expect(result.markdown).not.toContain('<td>');
  });

  it('converts strikethrough text', () => {
    const document = createDocument(`
      <!doctype html>
      <html>
        <head><title>Strikethrough</title></head>
        <body>
          <article>
            <h1>Strikethrough</h1>
            <p>This is <del>deleted</del> and <s>struck</s> text.</p>
          </article>
        </body>
      </html>
    `);

    const result = convertPageToMarkdown(document, new Date('2026-04-09T12:00:00Z'));

    expect(result.markdown).toContain('~deleted~');
    expect(result.markdown).toContain('~struck~');
  });

  it('preserves code block language from pre class attribute', () => {
    const document = createDocument(`
      <!doctype html>
      <html>
        <head><title>Code</title></head>
        <body>
          <article>
            <h1>Code</h1>
            <pre class="language-python"><code>def hello():
    print("world")</code></pre>
            <pre><code class="language-javascript">const x = 1;</code></pre>
          </article>
        </body>
      </html>
    `);

    const result = convertPageToMarkdown(document, new Date('2026-04-09T12:00:00Z'));

    expect(result.markdown).toContain('\`\`\`python');
    expect(result.markdown).toContain('\`\`\`javascript');
  });

  it('compresses excessive blank lines', () => {
    const document = createDocument(`
      <!doctype html>
      <html>
        <head><title>Spacing</title></head>
        <body>
          <article>
            <h1>Spacing</h1>
            <p>First paragraph.</p>
            <p></p>
            <p></p>
            <p></p>
            <p>Last paragraph.</p>
          </article>
        </body>
      </html>
    `);

    const result = convertPageToMarkdown(document, new Date('2026-04-09T12:00:00Z'));

    expect(result.markdown).not.toMatch(/\n{4,}/);
  });

  it('converts figure with figcaption to italic caption', () => {
    const document = createDocument(`
      <!doctype html>
      <html>
        <head><title>Figure</title></head>
        <body>
          <article>
            <h1>Figure</h1>
            <figure>
              <img src="/diagram.png" alt="Architecture diagram" />
              <figcaption>The transformer architecture</figcaption>
            </figure>
            <p>More text.</p>
          </article>
        </body>
      </html>
    `);

    const result = convertPageToMarkdown(document, new Date('2026-04-09T12:00:00Z'));

    expect(result.markdown).toContain('![Architecture diagram](https://example.com/diagram.png)');
    expect(result.markdown).toContain('*The transformer architecture*');
  });

  it('converts kbd elements to inline code', () => {
    const document = createDocument(`
      <!doctype html>
      <html>
        <head><title>Kbd</title></head>
        <body>
          <article>
            <h1>Kbd</h1>
            <p>Press <kbd>Ctrl</kbd> + <kbd>C</kbd> to copy.</p>
          </article>
        </body>
      </html>
    `);

    const result = convertPageToMarkdown(document, new Date('2026-04-09T12:00:00Z'));

    expect(result.markdown).toContain('`Ctrl`');
    expect(result.markdown).toContain('`C`');
  });

  it('converts mark elements to highlighted text', () => {
    const document = createDocument(`
      <!doctype html>
      <html>
        <head><title>Mark</title></head>
        <body>
          <article>
            <h1>Mark</h1>
            <p>This is <mark>important</mark> and this is <mark>also important</mark>.</p>
          </article>
        </body>
      </html>
    `);

    const result = convertPageToMarkdown(document, new Date('2026-04-09T12:00:00Z'));

    expect(result.markdown).toContain('==important==');
    expect(result.markdown).toContain('==also important==');
  });
});
