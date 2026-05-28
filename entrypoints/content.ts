import { convertPageToMarkdown } from '../src/markdown/convertPageToMarkdown';
import { CONVERT_PAGE_MESSAGE, type ConvertPageResponse } from '../src/shared/messages';

export default defineContentScript({
  matches: [],
  registration: 'runtime',
  main() {
    const global = globalThis as typeof globalThis & { __web2markdownContentReady?: boolean };
    if (global.__web2markdownContentReady) {
      return;
    }
    global.__web2markdownContentReady = true;

    browser.runtime.onMessage.addListener((message: { type?: string }): Promise<ConvertPageResponse> | undefined => {
      if (message?.type !== CONVERT_PAGE_MESSAGE) {
        return undefined;
      }

      return Promise.resolve()
        .then(() => convertPageToMarkdown(document))
        .then((result) => ({ ok: true as const, result }))
        .catch((error: unknown) => ({
          ok: false,
          error: error instanceof Error ? error.message : '转换失败',
        }));
    });
  },
});
