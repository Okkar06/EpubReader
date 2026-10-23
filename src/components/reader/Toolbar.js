(() => {
  const { html, IconButton } = Books;

  /** Auto-hiding floating glass bar. Hovering (mouse) or focusing it keeps it visible. */
  function Toolbar({
    visible,
    title,
    bookmarked,
    sidebarTab,
    searchOpen,
    appearanceOpen,
    onBack,
    onToc,
    onSearch,
    onHighlights,
    onBookmark,
    onToggleAppearance,
    onHover,
  }) {
    return html`
      <header
        onPointerEnter=${(e) => e.pointerType === 'mouse' && onHover(true)}
        onPointerLeave=${(e) => e.pointerType === 'mouse' && onHover(false)}
        onFocusCapture=${() => onHover(true)}
        onBlurCapture=${() => onHover(false)}
        className=${`safe-x fixed inset-x-0 top-0 z-30 px-2 pt-[calc(env(safe-area-inset-top)+0.5rem)] transition-all duration-300 ease-out ${
          visible ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0'
        }`}
      >
        <div className="glass mx-auto flex h-12 max-w-3xl items-center gap-0.5 rounded-2xl border border-line/10 px-1.5 shadow-pop sm:gap-1">
          <${IconButton} icon="chevronLeft" label="Back to Library" onClick=${onBack} />
          <${IconButton} icon="list" label="Table of Contents (T)" active=${sidebarTab === 'toc'} onClick=${onToc} />

          <p className="min-w-0 flex-1 truncate px-1 text-center text-[13px] font-semibold text-ink/85 sm:px-3">${title}</p>

          <${IconButton} icon="search" label="Search in Book (F)" active=${searchOpen} onClick=${onSearch} />
          <button
            type="button"
            data-aa-trigger="true"
            aria-label="Appearance"
            title="Appearance"
            aria-expanded=${appearanceOpen}
            aria-haspopup="dialog"
            onClick=${onToggleAppearance}
            className=${`btn-icon w-9 font-book text-[15px] ${appearanceOpen ? 'bg-line/10 text-ink' : ''}`}
          >
            <span aria-hidden="true"><span className="text-[12px]">A</span>a</span>
          </button>
          <${IconButton}
            icon="highlighter"
            label="Highlights & Notes"
            active=${sidebarTab === 'highlights'}
            onClick=${onHighlights}
          />
          <${IconButton}
            icon="bookmark"
            label=${bookmarked ? 'Remove Bookmark (B)' : 'Add Bookmark (B)'}
            aria-pressed=${bookmarked}
            filled=${bookmarked}
            onClick=${onBookmark}
            className=${bookmarked ? 'text-red-500 hover:text-red-500' : ''}
          />
        </div>
      </header>
    `;
  }

  Books.Toolbar = Toolbar;
})();
