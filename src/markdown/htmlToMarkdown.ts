import TurndownService from 'turndown';
import { tables } from 'turndown-plugin-gfm';

const turndown = new TurndownService({
  codeBlockStyle: 'fenced',
  headingStyle: 'atx',
});

turndown.use(tables);

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

export function htmlToMarkdown(html: string): string {
  return turndown.turndown(html).trim();
}
