import { Readability } from '@mozilla/readability';

export type ExtractedArticle = {
  title: string;
  content: string;
};

export function extractArticle(document: Document): ExtractedArticle {
  const clonedDocument = document.cloneNode(true) as Document;
  markOriginalHeadingLevels(clonedDocument);
  const article = new Readability(clonedDocument).parse();

  if (!article?.content) {
    throw new Error('无法提取正文');
  }

  return {
    title: article.title || document.title || 'Untitled',
    content: article.content,
  };
}

function markOriginalHeadingLevels(document: Document) {
  document.querySelectorAll<HTMLHeadingElement>('h1, h2, h3, h4, h5, h6').forEach((heading) => {
    heading.dataset.web2markdownHeadingLevel = heading.tagName.slice(1);
  });
}
