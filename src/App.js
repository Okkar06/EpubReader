(() => {
  const { html, useCallback, useEffect, useState, Library, Reader } = Books;

  // Minimal hash routing: "#/" = library, "#/book/<id>" = reader. Keeps browser Back working.
  function parseHash() {
    const match = window.location.hash.match(/^#\/book\/([\w-]+)/);
    return match ? match[1] : null;
  }

  function App() {
    const [bookId, setBookId] = useState(parseHash);

    useEffect(() => {
      const onHash = () => setBookId(parseHash());
      window.addEventListener('hashchange', onHash);
      return () => window.removeEventListener('hashchange', onHash);
    }, []);

    const openBook = useCallback((id) => {
      window.location.hash = `#/book/${id}`;
    }, []);
    const closeBook = useCallback(() => {
      window.location.hash = '#/';
    }, []);

    if (!bookId) return html`<${Library} onOpen=${openBook} />`;
    return html`<${Reader} key=${bookId} bookId=${bookId} onExit=${closeBook} />`;
  }

  Books.App = App;
})();
