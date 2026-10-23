(() => {
  const { html, IconButton, AppearancePopover } = Books;

  /** Auto-hiding translucent top bar. Hovering or focusing it keeps it visible. */
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
    onCloseAppearance,
    onHover,
  }) {
    return html`
      <header
        onMouseEnter=${() => onHover(true)}
        onMouseLeave=${() => onHover(false)}
        onFocusCapture=${() => onHover(true)}
        onBlurCapture=${() => onHover(false)}
        className=${`fixed inset-x-0 top-0 z-30 transition-all duration-300 ease-out ${
          visible ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0'
        }`}
      >
        <div className="glass flex h-12 items-center gap-1 border-b border-line/10 px-3">
          <${IconButton} icon="chevronLeft" label="Back to Library" onClick=${onBack} />
          <${IconButton} icon="list" label="Table of Contents (T)" active=${sidebarTab === 'toc'} onClick=${onToc} />

          <p className="min-w-0 flex-1 truncate px-3 text-center text-[13px] font-semibold text-ink/85">${title}</p>

          <${IconButton} icon="search" label="Search in Book (F)" active=${searchOpen} onClick=${onSearch} />
          <div className="relative">
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
            ${appearanceOpen && html`<${AppearancePopover} onClose=${onCloseAppearance} />`}
          </div>
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
