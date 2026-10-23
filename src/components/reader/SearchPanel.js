(() => {
  const { html, useEffect, useRef, useState, searchBook, Icon } = Books;

  /** Right slide-in panel for full-text search with incremental results. */
  function SearchPanel({ open, onClose, getBook, chapterFor, onJump }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [progress, setProgress] = useState(null); // { done, total, running, query }
    const [active, setActive] = useState(-1);
    const inputRef = useRef(null);
    const ctrlRef = useRef(null);

    useEffect(() => {
      if (!open) return undefined;
      const t = setTimeout(() => inputRef.current?.select(), 60);
      return () => clearTimeout(t);
    }, [open]);

    useEffect(() => () => ctrlRef.current?.abort(), []);

    async function run(e) {
      e.preventDefault();
      const q = query.trim();
      const book = getBook();
      if (q.length < 2 || !book) return;
      ctrlRef.current?.abort();
      const ctrl = new AbortController();
      ctrlRef.current = ctrl;
      setResults([]);
      setActive(-1);
      setProgress({ done: 0, total: book.spine.length, running: true, query: q });
      await searchBook(book, q, {
        signal: ctrl.signal,
        onProgress: (done, total, found) => {
          if (found.length) setResults((r) => [...r, ...found]);
          setProgress({ done, total, running: true, query: q });
        },
      });
      if (!ctrl.signal.aborted) setProgress((p) => ({ ...p, running: false }));
    }

    return html`
      <aside
        aria-label="Search in book"
        aria-hidden=${!open}
        inert=${open ? undefined : ''}
        className=${`glass safe-top safe-bottom fixed bottom-0 right-0 top-0 z-50 flex w-[360px] max-w-[90vw] flex-col rounded-l-3xl border-l border-line/10 shadow-pop transition-transform duration-300 ease-[cubic-bezier(.2,.8,.2,1)] ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <form onSubmit=${run} className="flex items-center gap-2 border-b border-line/10 p-3" role="search">
          <label className="relative flex-1">
            <span className="sr-only">Search text</span>
            <${Icon} name="search" size=${15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              ref=${inputRef}
              type="search"
              value=${query}
              onChange=${(e) => setQuery(e.target.value)}
              placeholder="Search book"
              className="input w-full pl-8"
            />
          </label>
          <button type="button" className="btn-icon" aria-label="Close search" onClick=${onClose}>
            <${Icon} name="close" size=${16} />
          </button>
        </form>

        <div className="px-4 py-2 text-[11px] text-muted" aria-live="polite">
          ${progress?.running &&
          html`
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-accent border-t-transparent" />
              Searching… ${progress.done}/${progress.total} sections · ${results.length} found
            </span>
          `}
          ${progress &&
          !progress.running &&
          html`<span>
            ${results.length === 0 ? 'No results' : `${results.length}${results.length >= 1000 ? '+' : ''} results`} for
            “${progress.query}”
          </span>`}
          ${!progress && 'Type at least 2 characters and press Enter.'}
        </div>

        <ul className="thin-scroll min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 pb-6">
          ${results.map(
            (r, i) => html`
              <li key=${`${r.cfi}-${i}`}>
                <button
                  type="button"
                  onClick=${() => {
                    setActive(i);
                    onJump(r.cfi);
                  }}
                  aria-current=${active === i ? 'true' : undefined}
                  className=${`focus-ring w-full rounded-lg px-3 py-2 text-left transition-colors hover:bg-line/[0.07] ${
                    active === i ? 'bg-accent/15' : ''
                  }`}
                >
                  <span className="block truncate text-[11px] font-medium text-muted">${chapterFor(r.spineIndex) || ' '}</span>
                  <span className="mt-0.5 line-clamp-3 block text-[13px] leading-snug">
                    <${Excerpt} text=${r.excerpt} query=${progress?.query || ''} />
                  </span>
                </button>
              </li>
            `,
          )}
        </ul>
      </aside>
    `;
  }

  /** Excerpt with every match of the query wrapped in <mark>. */
  function Excerpt({ text, query }) {
    if (!query) return text;
    const lower = text.toLowerCase();
    const q = query.toLowerCase();
    const parts = [];
    let i = 0;
    while (i < text.length) {
      const hit = lower.indexOf(q, i);
      if (hit === -1) {
        parts.push(text.slice(i));
        break;
      }
      if (hit > i) parts.push(text.slice(i, hit));
      parts.push(html`<mark key=${hit} className="rounded-sm bg-accent/30 px-0.5 text-ink">${text.slice(hit, hit + q.length)}</mark>`);
      i = hit + q.length;
    }
    return parts;
  }

  Books.SearchPanel = SearchPanel;
})();
