import './style.css';
import { CONVERT_PAGE_MESSAGE, type ConvertPageResponse } from '../../src/shared/messages';

const copyButton = document.querySelector<HTMLButtonElement>('#copy');
const statusText = document.querySelector<HTMLParagraphElement>('#status');
const output = document.querySelector<HTMLTextAreaElement>('#output');
const CONTENT_SCRIPT_FILE = '/content-scripts/content.js';

function setStatus(message: string) {
  if (statusText) {
    statusText.textContent = message;
  }
}

function setMarkdown(markdown: string) {
  if (output && copyButton) {
    output.value = markdown;
    copyButton.disabled = markdown.length === 0;
  }
}

async function getActiveTabId(): Promise<number> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (tab?.id == null) {
    throw new Error('找不到当前标签页');
  }
  return tab.id;
}

async function injectContentScript(tabId: number) {
  if (import.meta.env.FIREFOX) {
    await browser.tabs.executeScript(tabId, { file: CONTENT_SCRIPT_FILE });
    return;
  }

  await browser.scripting.executeScript({
    target: { tabId },
    files: [CONTENT_SCRIPT_FILE],
  });
}

async function convertCurrentPage() {
  setMarkdown('');
  setStatus('Converting current page...');

  try {
    const tabId = await getActiveTabId();
    await injectContentScript(tabId);
    const response = (await browser.tabs.sendMessage(tabId, {
      type: CONVERT_PAGE_MESSAGE,
    })) as ConvertPageResponse;

    if (!response.ok) {
      throw new Error(response.error);
    }

    setMarkdown(response.result.markdown);
    setStatus(`Converted: ${response.result.title}`);
  } catch (error) {
    setStatus(error instanceof Error ? error.message : '转换失败');
  }
}

copyButton?.addEventListener('click', async () => {
  if (!output?.value) {
    return;
  }

  try {
    await navigator.clipboard.writeText(output.value);
    setStatus('Copied to clipboard.');
  } catch {
    setStatus('复制失败，请手动复制。');
  }
});

void convertCurrentPage();
