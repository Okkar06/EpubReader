(() => {
  const { html, SettingsProvider, App } = Books;

  ReactDOM.createRoot(document.getElementById('root')).render(html`<${SettingsProvider}><${App} /><//>`);

  // Offline support + installable app (needs http(s), so skipped when opened as a file).
  if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('./sw.js').catch((err) => console.warn('Service worker not registered', err));
  }
  // Ask the browser not to evict the library (Safari can clear site data that isn't persisted).
  navigator.storage?.persist?.().catch(() => {});
})();
