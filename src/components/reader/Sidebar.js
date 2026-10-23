(() => {
  const { html, Fragment, useEffect, useRef, HIGHLIGHT_COLORS, formatDate, formatPercent, Icon } = Books;

  const TABS = [
    { id: 'toc', label: 'Contents' },
    { id: 'bookmarks', label: 'Bookmarks' },
    { id: 'highlights', label: 'Highlights' },
  ];

  /** Left slide-in panel with Contents / Bookmarks / Highlights & Notes tabs. */
  function Sidebar({
    tab,
    onTab,
    onClose,
    title,
    toc,
    activeTocIndex,
    bookmarks,
    highlights,
    onNavigate,
    onDeleteBookmark,
    onDeleteHighlight,
    onEditNote,
  }) {
    const open = !!tab;
    const panelRef = useRef(null);

    // Move focus into the panel and reveal the current chapter when opened.
    useEffect(() => {
      if (!open) return;
      const panel = panelRef.current;
      panel?.querySelector('[aria-selected="true"]')?.focus({ preventScroll: true });
      panel?.querySelector('[data-current="true"]')?.scrollIntoView({ block: 'center' });
    }, [open, tab]);

    const onTabKey = (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      e.stopPropagation();
      const i = TABS.findIndex((x) => x.id === tab);
      const next = TABS[(i + (e.key === 'ArrowRight' ? 1 : -1) + TABS.length) % TABS.length];
      onTab(next.id);
      document.getElementById(`tab-${next.id}`)?.focus();
    };

    return html`
      <${Fragment}>
        <div
          aria-hidden="true"
          onClick=${onClose}
          className=${`fixed inset-0 z-40 bg-black/15 transition-opacity duration-300 ${
            open ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        />
        <aside
          ref=${panelRef}
          aria-label="Book navigation"
          aria-hidden=${!open}
          inert=${open ? undefined : ''}
          className=${`glass safe-top safe-bottom fixed bottom-0 left-0 top-0 z-50 flex w-[340px] max-w-[88vw] flex-col rounded-r-3xl border-r border-line/10 shadow-pop transition-transform duration-300 ease-[cubic-bezier(.2,.8,.2,1)] ${
            open ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center gap-2 px-4 pb-2 pt-3">
            <p className="min-w-0 flex-1 truncate text-[13px] font-semibold">${title}</p>
            <button className="btn-icon h-8 w-8" aria-label="Close sidebar" onClick=${onClose}>
              <${Icon} name="close" size=${15} />
            </button>
          </div>

          <div role="tablist" aria-label="Sidebar sections" className="mx-4 mb-2 flex rounded-lg bg-line/[0.07] p-0.5">
            ${TABS.map(
              (t) => html`
                <button
                  key=${t.id}
                  role="tab"
                  id=${`tab-${t.id}`}
                  aria-selected=${tab === t.id}
                  aria-controls=${`panel-${t.id}`}
                  tabIndex=${tab === t.id ? 0 : -1}
                  onClick=${() => onTab(t.id)}
                  onKeyDown=${onTabKey}
                  className=${`focus-ring flex-1 rounded-md py-1 text-xs font-medium transition-all pointer-coarse:py-1.5 pointer-coarse:text-[13px] ${
                    tab === t.id ? 'bg-elevated text-ink shadow-sm' : 'text-muted hover:text-ink'
                  }`}
                >
                  ${t.label}
                </button>
              `,
            )}
          </div>

          <div
            role="tabpanel"
            id=${`panel-${tab}`}
            aria-labelledby=${`tab-${tab}`}
            className="thin-scroll min-h-0 flex-1 overflow-y-auto px-2 pb-6"
          >
            ${tab === 'toc' && html`<${TocList} toc=${toc} activeIndex=${activeTocIndex} onNavigate=${onNavigate} />`}
            ${tab === 'bookmarks' &&
            html`<${BookmarkList} bookmarks=${bookmarks} onNavigate=${onNavigate} onDelete=${onDeleteBookmark} />`}
            ${tab === 'highlights' &&
            html`<${HighlightList}
              highlights=${highlights}
              onNavigate=${onNavigate}
              onDelete=${onDeleteHighlight}
              onEditNote=${onEditNote}
            />`}
          </div>
        </aside>
      <//>
    `;
  }

  function Empty({ children }) {
    return html`<p className="px-4 py-10 text-center text-[13px] text-muted">${children}</p>`;
  }

  function TocList({ toc, activeIndex, onNavigate }) {
    if (!toc.length) return html`<${Empty}>This book has no table of contents.<//>`;
    return html`
      <ul>
        ${toc.map((item, i) => {
          const current = i === activeIndex;
          return html`
            <li key=${`${item.href}-${i}`}>
              <button
                type="button"
                data-current=${String(current)}
                aria-current=${current ? 'location' : undefined}
                onClick=${() => onNavigate({ type: 'toc', item })}
                className=${`focus-ring w-full rounded-md py-1.5 pr-3 text-left text-[13px] leading-snug transition-colors hover:bg-line/[0.07] ${
                  current ? 'font-semibold text-accent' : 'text-ink/90'
                }`}
                style=${{ paddingLeft: 12 + item.depth * 14 }}
              >
                ${item.label}
              </button>
            </li>
          `;
        })}
      </ul>
    `;
  }

  function BookmarkList({ bookmarks, onNavigate, onDelete }) {
    if (!bookmarks.length) return html`<${Empty}>No bookmarks yet. Tap the bookmark button (or press B) to bookmark the current page.<//>`;
    return html`
      <ul className="space-y-0.5">
        ${bookmarks.map(
          (b) => html`
            <li key=${b.id} className="group relative">
              <button
                type="button"
                onClick=${() => onNavigate({ type: 'cfi', cfi: b.cfi })}
                className="focus-ring w-full rounded-lg px-3 py-2 pr-10 text-left transition-colors hover:bg-line/[0.07]"
              >
                <p className="truncate text-[13px] font-medium">${b.chapter || 'Bookmark'}</p>
                ${b.excerpt && html`<p className="mt-0.5 line-clamp-2 text-xs text-muted">${b.excerpt}</p>`}
                <p className="mt-1 text-[11px] text-muted">
                  ${b.percentage != null ? `${formatPercent(b.percentage)} · ` : ''}${formatDate(b.createdAt)}
                </p>
              </button>
              <button
                type="button"
                aria-label="Delete bookmark"
                onClick=${() => onDelete(b)}
                className="btn-icon reveal-on-hover absolute right-1.5 top-2 h-7 w-7 opacity-0 focus-visible:opacity-100 group-hover:opacity-100"
              >
                <${Icon} name="trash" size=${14} />
              </button>
            </li>
          `,
        )}
      </ul>
    `;
  }

  function HighlightList({ highlights, onNavigate, onDelete, onEditNote }) {
    if (!highlights.length) return html`<${Empty}>Select text in the book to highlight it or add a note.<//>`;
    return html`
      <ul className="space-y-0.5">
        ${highlights.map(
          (h) => html`
            <li key=${h.id} className="group relative">
              <button
                type="button"
                onClick=${() => onNavigate({ type: 'cfi', cfi: h.cfiRange })}
                className="focus-ring flex w-full gap-2.5 rounded-lg px-3 py-2 pr-16 text-left transition-colors hover:bg-line/[0.07]"
              >
                <span
                  className="mt-0.5 w-[3px] shrink-0 self-stretch rounded-full"
                  style=${{ background: HIGHLIGHT_COLORS[h.color] }}
                  aria-hidden="true"
                />
                <span className="min-w-0">
                  ${h.chapter && html`<span className="block truncate text-[11px] font-medium text-muted">${h.chapter}</span>`}
                  <span className="mt-0.5 line-clamp-3 block font-book text-[13px] leading-snug">${h.text}</span>
                  ${h.note &&
                  html`<span className="mt-1.5 block rounded-md bg-line/[0.06] px-2 py-1 text-xs text-ink/80">${h.note}</span>`}
                </span>
              </button>
              <div className="reveal-on-hover absolute right-1.5 top-2 flex opacity-0 focus-within:opacity-100 group-hover:opacity-100">
                <button type="button" aria-label="Edit note" onClick=${() => onEditNote(h)} className="btn-icon h-7 w-7">
                  <${Icon} name="note" size=${14} />
                </button>
                <button type="button" aria-label="Delete highlight" onClick=${() => onDelete(h)} className="btn-icon h-7 w-7">
                  <${Icon} name="trash" size=${14} />
                </button>
              </div>
            </li>
          `,
        )}
      </ul>
    `;
  }

  Books.Sidebar = Sidebar;
})();
