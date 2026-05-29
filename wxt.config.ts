import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: ({ browser }) => ({
    name: 'Web2Markdown',
    description: 'Extract article content and convert it to Markdown.',
    permissions: browser === 'firefox' ? ['activeTab', 'clipboardWrite'] : ['activeTab', 'clipboardWrite', 'scripting'],
    ...(browser === 'firefox'
      ? {
          browser_specific_settings: {
            gecko: {
              id: 'web2markdown@devcxl',
              data_collection_permissions: {
                required: ['none'],
              },
            },
          },
        }
      : {}),
  }),
});
