(() => {
  const { html, formatPercent, Cover } = Books;

  /** Larger horizontal card used in the "Continue Reading" row. */
  function ContinueCard({ book, onOpen, onMenu }) {
    return html`
      <button
        type="button"
        onClick=${() => onOpen(book.id)}
        onContextMenu=${(e) => {
          e.preventDefault();
          onMenu(book, e.clientX, e.clientY);
        }}
        aria-label=${`Continue reading ${book.title}, ${formatPercent(book.progress)} read`}
        className="glass focus-ring group flex items-center gap-4 rounded-2xl border border-line/10 p-3 text-left transition-transform active:scale-[0.98]"
      >
        <${Cover} book=${book} className="w-16 shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">${book.title}</p>
          <p className="truncate text-xs text-muted">${book.author || 'Unknown author'}</p>
          <div className="mt-3 flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-line/10">
              <div className="h-full rounded-full bg-accent" style=${{ width: formatPercent(book.progress) }} />
            </div>
            <span className="text-[11px] font-medium tabular-nums text-muted">${formatPercent(book.progress)}</span>
          </div>
        </div>
      </button>
    `;
  }

  Books.ContinueCard = ContinueCard;
})();
