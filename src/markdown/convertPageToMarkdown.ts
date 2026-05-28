import { extractArticle } from './extractArticle';
import { htmlToMarkdown } from './htmlToMarkdown';
import type { ConversionResult } from '../shared/types';

const DEFAULT_TAGS = ['web_clip'];
const SOURCE_TYPE = 'web_clip';
const SAFE_LINK_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);
const SAFE_IMAGE_PROTOCOLS = new Set(['http:', 'https:']);

export function convertPageToMarkdown(document: Document, clippedAt = new Date()): ConversionResult {
  const article = extractArticle(document);
  const articleDocument = document.implementation.createHTMLDocument(article.title);
  articleDocument.body.innerHTML = article.content;

  normalizeResourceUrls(articleDocument, document.location.href);

  const bodyMarkdown = htmlToMarkdown(articleDocument.body.innerHTML);
  const imageCount = articleDocument.querySelectorAll('img[src]').length;
  const clipped = formatDate(clippedAt);
  const frontmatter = buildFrontmatter({
    title: article.title,
    url: document.location.href,
    clipped,
    imageCount,
  });
  const markdown = `${frontmatter}\n\n# ${formatMarkdownTitle(article.title)}\n\n${bodyMarkdown}`.trimEnd();

  return {
    title: article.title,
    url: document.location.href,
    clipped,
    imageCount,
    markdown,
  };
}

function normalizeResourceUrls(document: Document, baseUrl: string) {
  document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((link) => {
    const href = toSafeAbsoluteUrl(link.getAttribute('href'), baseUrl, SAFE_LINK_PROTOCOLS);
    if (href) {
      link.href = href;
    } else {
      link.removeAttribute('href');
    }
  });

  document.querySelectorAll<HTMLImageElement>('img[src]').forEach((image) => {
    const src = toSafeAbsoluteUrl(image.getAttribute('src'), baseUrl, SAFE_IMAGE_PROTOCOLS);
    if (src) {
      image.src = src;
    } else {
      image.remove();
    }
  });
}

function toSafeAbsoluteUrl(value: string | null, baseUrl: string, allowedProtocols: Set<string>): string {
  if (!value) {
    return '';
  }

  try {
    const url = new URL(value, baseUrl);
    return allowedProtocols.has(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

function buildFrontmatter({
  title,
  url,
  clipped,
  imageCount,
}: {
  title: string;
  url: string;
  clipped: string;
  imageCount: number;
}): string {
  return [
    '---',
    `title: "${escapeYamlString(title)}"`,
    `url: "${escapeYamlString(url)}"`,
    `clipped: "${clipped}"`,
    `tags: [${DEFAULT_TAGS.map((tag) => `"${escapeYamlString(tag)}"`).join(', ')}]`,
    `source_type: ${SOURCE_TYPE}`,
    `images: ${imageCount}`,
    '---',
  ].join('\n');
}

function escapeYamlString(value: string): string {
  return value
    .replaceAll('\\', '\\\\')
    .replaceAll('"', '\\"')
    .replaceAll('\n', '\\n')
    .replaceAll('\r', '\\r')
    .replaceAll('\t', '\\t')
    .replaceAll('\u0085', '\\x85')
    .replaceAll('\u2028', '\\u2028')
    .replaceAll('\u2029', '\\u2029');
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatMarkdownTitle(title: string): string {
  return title.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
}
