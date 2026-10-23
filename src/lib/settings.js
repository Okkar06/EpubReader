(() => {
  const { html, createContext, useCallback, useContext, useEffect, useState, db } = Books;

  const DEFAULT_SETTINGS = {
    theme: 'auto', // auto | light | sepia | gray | dark
    fontSize: 100, // percent
    font: 'original',
    lineHeight: 1.55,
    margin: 'normal', // narrow | normal | wide
    align: 'justify', // justify | left
    spread: 'auto', // auto | single | double
    librarySort: 'recent', // recent | title | author
  };

  const SettingsContext = createContext(null);

  function useSystemDark() {
    const query = '(prefers-color-scheme: dark)';
    const [dark, setDark] = useState(() => window.matchMedia(query).matches);
    useEffect(() => {
      const mq = window.matchMedia(query);
      const onChange = (e) => setDark(e.matches);
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    }, []);
    return dark;
  }

  /** Loads settings from IndexedDB, persists changes, and applies the UI theme to <html>. */
  function SettingsProvider({ children }) {
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [loaded, setLoaded] = useState(false);
    const systemDark = useSystemDark();

    useEffect(() => {
      db.settings
        .get('app')
        .then((row) => row && setSettings({ ...DEFAULT_SETTINGS, ...row.value }))
        .catch(() => {})
        .finally(() => setLoaded(true));
    }, []);

    useEffect(() => {
      if (loaded) db.settings.put({ key: 'app', value: settings }).catch(() => {});
    }, [settings, loaded]);

    const resolvedTheme = settings.theme === 'auto' ? (systemDark ? 'dark' : 'light') : settings.theme;

    useEffect(() => {
      document.documentElement.dataset.theme = resolvedTheme;
      // Tints the browser / status bar to match the page.
      const canvas = getComputedStyle(document.documentElement).getPropertyValue('--canvas').trim();
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', `rgb(${canvas.split(/\s+/).join(',')})`);
    }, [resolvedTheme]);

    // Accepts a partial object or a function (current) => partial.
    const update = useCallback((patch) => {
      setSettings((s) => ({ ...s, ...(typeof patch === 'function' ? patch(s) : patch) }));
    }, []);

    if (!loaded) return null;

    return html`<${SettingsContext.Provider} value=${{ settings, update, resolvedTheme }}>${children}<//>`;
  }

  const useSettings = () => useContext(SettingsContext);

  Object.assign(Books, { DEFAULT_SETTINGS, SettingsProvider, useSettings });
})();
