(() => {
  const { html, SettingsProvider, App } = Books;

  ReactDOM.createRoot(document.getElementById('root')).render(html`<${SettingsProvider}><${App} /><//>`);
})();
