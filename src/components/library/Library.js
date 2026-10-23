(() => {
  const {
    html,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    useLiveQuery,
    db,
    removeBook,
    importEpubFiles,
    useSettings,
    BookCard,
    ContinueCard,
    BookMenu,
    ConfirmDialog,
    Icon,
  } = Books;

  const SORTERS = {
    recent: (a, b) => (b.lastOpenedAt || b.addedAt) - (a.lastOpenedAt || a.addedAt),
    title: (a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }),
    author: (a, b) => (a.author || '~').localeCompare(b.author || '~', undefined, { sensitivity: 'base' }),
  };

  function Library({ onOpen }) {
    const { settings, update } = useSettings();
    const books = useLiveQuery(() => db.books.toArray(), [], null);
    const [query, setQuery] = useState('');
    const [importing, setImporting] = useState(null); // { done, total }
    const [errors, setErrors] = useState([]);
    const [dragDepth, setDragDepth] = useState(0);
    const [menu, setMenu] = useState(null); // { book, x, y }
    const [confirm, setConfirm] = useState(null); // book pending removal
    const fileInput = useRef(null);
    const searchInput = useRef(null);

    const sort = settings.librarySort;

    const handleFiles = useCallback(async (fileList) => {
      const files = Array.from(fileList || []);
      if (!files.length) return;
      setErrors([]);
      setImporting({ done: 0, total: files.length });
      const result = await importEpubFiles(files, (done, total) => setImporting({ done, total }));
      setImporting(null);
      setErrors(result.errors);
    }, []);

    // "/" focuses search, Cmd/Ctrl+O opens the file picker.
    useEffect(() => {
      const onKey = (e) => {
        const typing = /input|textarea|select/i.test(e.target.tagName);
        if (e.key === '/' && !typing) {
          e.preventDefault();
          searchInput.current?.focus();
        } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'o') {
          e.preventDefault();
          fileInput.current?.click();
        }
      };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, []);

    const visible = useMemo(() => {
      if (!books) return [];
      const q = query.trim().toLowerCase();
      const filtered = q
        ? books.filter((b) => b.title.toLowerCase().includes(q) || (b.author || '').toLowerCase().includes(q))
        : books;
      return [...filtered].sort(SORTERS[sort] || SORTERS.recent);
    }, [books, query, sort]);

    const continueReading = useMemo(
      () =>
        (books || [])
          .filter((b) => b.lastOpenedAt && !b.finished)
          .sort((a, b) => b.lastOpenedAt - a.lastOpenedAt)
          .slice(0, 3),
      [books],
    );

    const openMenu = useCallback((book, x, y) => setMenu({ book, x, y }), []);
    const closeMenu = useCallback(() => setMenu(null), []);

    // Drag & drop anywhere on the page. A depth counter avoids flicker over child elements.
    const onDragEnter = (e) => {
      if (e.dataTransfer?.types?.includes('Files')) setDragDepth((d) => d + 1);
    };
    const onDragLeave = () => setDragDepth((d) => Math.max(0, d - 1));
    const onDragOver = (e) => e.preventDefault();
    const onDrop = (e) => {
      e.preventDefault();
      setDragDepth(0);
      handleFiles(e.dataTransfer.files);
    };

    const isEmpty = books && books.length === 0;

    return html`
      <div className="relative min-h-full" onDragEnter=${onDragEnter} onDragLeave=${onDragLeave} onDragOver=${onDragOver} onDrop=${onDrop}>
        <div className="wallpaper" aria-hidden="true" />

        <!-- Header: on phones the search field drops to its own full-width row. -->
        <header className="glass safe-top safe-x sticky top-0 z-20 border-b border-line/10">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-2 gap-y-2.5 px-4 py-3 sm:gap-x-3 sm:px-6 md:px-10">
            <h1 className="mr-auto text-[28px] font-bold leading-tight tracking-tight sm:text-xl">Library</h1>
            <label className="relative order-last w-full sm:order-none sm:w-auto">
              <span className="sr-only">Search library</span>
              <${Icon} name="search" size=${15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                ref=${searchInput}
                type="search"
                value=${query}
                onChange=${(e) => setQuery(e.target.value)}
                placeholder="Search"
                className="input w-full pl-8 sm:w-56"
              />
            </label>
            <label className="relative flex items-center">
              <span className="sr-only">Sort books</span>
              <${Icon} name="sort" size=${15} className="pointer-events-none absolute left-2.5 text-muted" />
              <select
                value=${sort}
                onChange=${(e) => update({ librarySort: e.target.value })}
                className="input appearance-none pl-8 pr-3"
              >
                <option value="recent">Recent</option>
                <option value="title">Title</option>
                <option value="author">Author</option>
              </select>
            </label>
            <button
              type="button"
              className="btn-primary rounded-full"
              aria-label="Add Book"
              onClick=${() => fileInput.current?.click()}
            >
              <${Icon} name="plus" size=${15} strokeWidth=${2.2} /> <span className="max-[380px]:hidden">Add Book</span>
            </button>
            <input
              ref=${fileInput}
              type="file"
              accept=".epub,application/epub+zip"
              multiple
              hidden
              onChange=${(e) => {
                handleFiles(e.target.files);
                e.target.value = '';
              }}
            />
          </div>
        </header>

        <main className="safe-x mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 sm:pt-8 md:px-10">
          ${books === null && html`<p className="text-sm text-muted">Loading library…</p>`}

          ${isEmpty &&
          html`
            <div className="glass mx-auto mt-10 flex max-w-md flex-col items-center rounded-3xl border border-line/10 px-8 py-14 text-center sm:mt-16">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 text-accent">
                <${Icon} name="book" size=${28} />
              </div>
              <h2 className="text-lg font-semibold">Your library is empty</h2>
              <p className="mt-1.5 text-sm text-muted">
                Tap <span className="font-medium text-ink">Add Book</span> to choose EPUB files, or drag them here. Everything
                stays on this device.
              </p>
            </div>
          `}

          ${!query &&
          continueReading.length > 0 &&
          html`
            <section aria-labelledby="continue-heading" className="mb-10 sm:mb-12">
              <h2 id="continue-heading" className="mb-3 text-[17px] font-semibold sm:mb-4 sm:text-[15px]">Continue Reading</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                ${continueReading.map((b) => html`<${ContinueCard} key=${b.id} book=${b} onOpen=${onOpen} onMenu=${openMenu} />`)}
              </div>
            </section>
          `}

          ${books &&
          books.length > 0 &&
          html`
            <section aria-labelledby="all-heading">
              <div className="mb-4 flex items-baseline gap-2">
                <h2 id="all-heading" className="text-[17px] font-semibold sm:text-[15px]">${query ? 'Results' : 'All Books'}</h2>
                <span className="text-xs text-muted">${visible.length}</span>
              </div>
              ${visible.length === 0
                ? html`<p className="py-10 text-center text-sm text-muted">No books match “${query}”.</p>`
                : html`
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-x-4 gap-y-7 sm:grid-cols-[repeat(auto-fill,minmax(130px,1fr))] sm:gap-x-7 sm:gap-y-9 md:grid-cols-[repeat(auto-fill,minmax(150px,1fr))]">
                      ${visible.map((b) => html`<${BookCard} key=${b.id} book=${b} onOpen=${onOpen} onMenu=${openMenu} />`)}
                    </div>
                  `}
            </section>
          `}
        </main>

        <!-- Drop overlay -->
        ${dragDepth > 0 &&
        html`
          <div className="pointer-events-none fixed inset-0 z-40 flex animate-fade-in items-center justify-center bg-canvas/70 backdrop-blur-sm">
            <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-accent px-16 py-12 text-accent">
              <${Icon} name="upload" size=${36} />
              <p className="mt-3 text-base font-semibold">Drop EPUB files to add them</p>
            </div>
          </div>
        `}

        <!-- Import progress & errors -->
        <div
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+1.5rem)] left-1/2 z-40 flex w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 flex-col gap-2"
          aria-live="polite"
        >
          ${importing &&
          html`
            <div className="glass flex animate-slide-up items-center gap-3 rounded-xl border border-line/10 px-4 py-3 text-[13px] shadow-pop">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              Importing ${Math.min(importing.done + 1, importing.total)} of ${importing.total}…
            </div>
          `}
          ${errors.length > 0 &&
          html`
            <div role="alert" className="glass animate-slide-up rounded-xl border border-line/10 px-4 py-3 text-[13px] shadow-pop">
              <div className="flex items-center gap-2">
                <${Icon} name="alert" size=${16} className="text-red-500" />
                <p className="flex-1 font-semibold">
                  ${errors.length === 1 ? 'A file couldn’t be added' : `${errors.length} files couldn’t be added`}
                </p>
                <button className="btn-icon h-6 w-6" aria-label="Dismiss" onClick=${() => setErrors([])}>
                  <${Icon} name="close" size=${14} />
                </button>
              </div>
              <ul className="thin-scroll mt-2 max-h-40 space-y-1 overflow-auto pl-6">
                ${errors.map(
                  (e, i) => html`
                    <li key=${i}>
                      <span className="font-medium">${e.name}</span> — <span className="text-muted">${e.message}</span>
                    </li>
                  `,
                )}
              </ul>
            </div>
          `}
        </div>

        ${menu &&
        html`
          <${BookMenu}
            menu=${menu}
            onClose=${closeMenu}
            onOpen=${(id) => {
              closeMenu();
              onOpen(id);
            }}
            onToggleFinished=${(book) => {
              closeMenu();
              db.books.update(book.id, book.finished ? { finished: false } : { finished: true, progress: 1 });
            }}
            onRemove=${(book) => {
              closeMenu();
              setConfirm(book);
            }}
          />
        `}

        ${confirm &&
        html`
          <${ConfirmDialog}
            title=${`Remove “${confirm.title}”?`}
            message="The book, its bookmarks and highlights will be deleted from this device."
            onCancel=${() => setConfirm(null)}
            onConfirm=${() => {
              removeBook(confirm.id);
              setConfirm(null);
            }}
          />
        `}
      </div>
    `;
  }

  Books.Library = Library;
})();
