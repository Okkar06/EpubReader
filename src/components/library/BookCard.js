(() => {
  const { html, useObjectUrl, formatPercent, GeneratedCover, Icon } = Books;

  function Cover({ book, className = '' }) {
    const url = useObjectUrl(book.cover);
    return html`
      <div className=${`relative aspect-[2/3] overflow-hidden rounded-[5px] bg-surface shadow-cover ${className}`}>
        ${url
          ? html`<img src=${url} alt="" className="h-full w-full object-cover" loading="lazy" draggable=${false} />`
          : html`<${GeneratedCover} title=${book.title} author=${book.author} />`}
        <!-- Subtle spine sheen like a physical book -->
        <div className="pointer-events-none absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-black/15 to-transparent" />
      </div>
    `;
  }

  function ProgressLabel({ book }) {
    if (book.finished) {
      return html`
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted">
          <${Icon} name="check" size=${12} strokeWidth=${2.2} /> Finished
        </span>
      `;
    }
    if (!book.lastOpenedAt) {
      return html`<span className="text-[11px] font-semibold uppercase tracking-wide text-accent">New</span>`;
    }
    return html`
      <span className="flex items-center gap-1.5 text-[11px] font-medium tabular-nums text-muted">
        <span className="h-[3px] w-10 overflow-hidden rounded-full bg-line/15">
          <span className="block h-full rounded-full bg-muted" style=${{ width: formatPercent(book.progress) }} />
        </span>
        ${formatPercent(book.progress)}
      </span>
    `;
  }

  /** Grid item: cover, title/author, progress and a "…" menu. Right-click also opens the menu. */
  function BookCard({ book, onOpen, onMenu }) {
    const label = `${book.title}${book.author ? `, by ${book.author}` : ''}`;
    return html`
      <div
        className="group flex flex-col"
        onContextMenu=${(e) => {
          e.preventDefault();
          onMenu(book, e.clientX, e.clientY);
        }}
      >
        <button
          type="button"
          onClick=${() => onOpen(book.id)}
          aria-label=${`Open ${label}`}
          className="focus-ring flex aspect-[2/3] items-end rounded-[5px] transition-transform duration-200 hover:-translate-y-1"
        >
          <${Cover} book=${book} className="w-full transition-shadow duration-200 group-hover:shadow-cover-hover" />
        </button>
        <div className="mt-2.5 flex items-start gap-1">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium leading-tight" title=${book.title}>${book.title}</p>
            <p className="mt-0.5 truncate text-xs text-muted">${book.author || 'Unknown author'}</p>
            <div className="mt-1.5"><${ProgressLabel} book=${book} /></div>
          </div>
          <button
            type="button"
            aria-label=${`More options for ${book.title}`}
            aria-haspopup="menu"
            onClick=${(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              onMenu(book, r.left, r.bottom + 4);
            }}
            className="btn-icon -mr-1 h-7 w-7 opacity-60 group-hover:opacity-100"
          >
            <${Icon} name="more" size=${16} />
          </button>
        </div>
      </div>
    `;
  }

  Object.assign(Books, { Cover, ProgressLabel, BookCard });
})();
