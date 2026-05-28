export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(() => {
    // Background entrypoint kept intentionally thin for future browser actions.
  });
});
