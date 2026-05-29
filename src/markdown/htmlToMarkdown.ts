import TurndownService from 'turndown';
import { strikethrough, tables } from 'turndown-plugin-gfm';

const turndown = new TurndownService({
  codeBlockStyle: 'fenced',
  headingStyle: 'atx',
});

turndown.use([tables, strikethrough]);

turndown.addRule('articleHeadings', {
  filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
  replacement(content, node) {
    const element = node as HTMLElement;
    const originalLevel = Number(element.getAttribute('data-web2markdown-heading-level') || node.nodeName.slice(1));
    const level = Math.min(originalLevel + 1, 6);
    const headingText = content.replace(/\*\*([^\n]+?)\*\*/g, '$1').trim();

    if (!headingText) {
      return '';
    }

    return `\n\n${'#'.repeat(level)} ${headingText}\n\n`;
  },
});

turndown.addRule('preCodeBlock', {
  filter(node) {
    const firstChild = node.firstChild as HTMLElement | null;
    return (
      node.nodeName === 'PRE' &&
      firstChild?.nodeName === 'CODE' &&
      !firstChild.className &&
      !!(node as HTMLElement).className
    );
  },
  replacement(_content, node) {
    const pre = node as HTMLElement;
    const language = (pre.className.match(/language-(\S+)/) || [])[1] || '';
    const code = pre.textContent || '';
    return `\n\n\`\`\`${language}\n${code}\n\`\`\`\n\n`;
  },
});

turndown.addRule('figcaption', {
  filter: 'figcaption',
  replacement(content) {
    const text = content.trim();
    return text ? `\n\n*${text}*\n\n` : '';
  },
});

turndown.addRule('kbd', {
  filter: 'kbd',
  replacement(content) {
    return `\`${content}\``;
  },
});

turndown.addRule('mark', {
  filter: 'mark',
  replacement(content) {
    const text = content.trim();
    return text ? `==${text}==` : '';
  },
});

export function htmlToMarkdown(html: string): string {
  const markdown = turndown.turndown(html).trim();
  return markdown.replace(/\n{3,}/g, '\n\n');
}
