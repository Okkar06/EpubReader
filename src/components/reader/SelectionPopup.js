(() => {
  const { html, useLayoutEffect, useRef, useState, HIGHLIGHT_COLORS, clamp, Icon } = Books;

  /**
   * Floating action bar shown above a text selection (mode "new")
   * or an existing highlight (mode "existing").
   */
  function SelectionPopup({ popup, onColor, onNote, onCopy, onLookup, onDelete }) {
    const ref = useRef(null);
    const [pos, setPos] = useState(null);

    useLayoutEffect(() => {
      const el = ref.current;
      if (!popup || !el) return;
      const { width, height } = el.getBoundingClientRect();
      const { rect } = popup;
      const cx = (rect.left + rect.right) / 2;
      const left = clamp(cx - width / 2, 8, window.innerWidth - width - 8);
      const below = Math.min(rect.bottom + 10, window.innerHeight - height - 8);
      // On touch screens iOS shows its own menu above the selection, so go below it.
      const touch = window.matchMedia?.('(pointer: coarse)').matches;
      let top = touch ? below : rect.top - height - 10;
      if (!touch && top < 56) top = below;
      setPos({ left, top });
    }, [popup]);

    if (!popup) return null;
    const current = popup.mode === 'existing' ? popup.highlight.color : null;
    const action =
      'focus-ring inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-ink/85 hover:bg-line/10 hover:text-ink pointer-coarse:px-2.5 pointer-coarse:py-2';

    return html`
      <div
        ref=${ref}
        role="toolbar"
        aria-label=${popup.mode === 'existing' ? 'Highlight actions' : 'Selection actions'}
        className="glass fixed z-50 flex max-w-[calc(100vw-1rem)] animate-pop-in items-center gap-1 rounded-2xl border border-line/10 p-1.5 shadow-pop"
        style=${pos ?? { left: -9999, top: -9999 }}
        onMouseDown=${(e) => e.preventDefault() /* keep the iframe selection alive */}
      >
        <div className="flex items-center gap-1 px-1">
          ${Object.entries(HIGHLIGHT_COLORS).map(
            ([name, hex]) => html`
              <button
                key=${name}
                type="button"
                aria-label=${`Highlight ${name}`}
                aria-pressed=${current === name}
                title=${name[0].toUpperCase() + name.slice(1)}
                onClick=${() => onColor(name)}
                className=${`focus-ring h-[22px] w-[22px] shrink-0 rounded-full pointer-coarse:h-7 pointer-coarse:w-7 border border-black/10 transition-transform hover:scale-110 ${
                  current === name ? 'ring-2 ring-ink/60 ring-offset-1 ring-offset-elevated' : ''
                }`}
                style=${{ background: hex }}
              />
            `,
          )}
        </div>
        <span className="mx-0.5 h-5 w-px bg-line/15" aria-hidden="true" />
        <button type="button" className=${action} onClick=${onNote} aria-label="Note">
          <${Icon} name="note" size=${14} /> <span className="max-sm:hidden">Note</span>
        </button>
        <button type="button" className=${action} onClick=${onCopy} aria-label="Copy">
          <${Icon} name="copy" size=${14} /> <span className="max-sm:hidden">Copy</span>
        </button>
        <button type="button" className=${action} onClick=${onLookup} aria-label="Look Up">
          <${Icon} name="lookup" size=${14} /> <span className="max-sm:hidden">Look Up</span>
        </button>
        ${popup.mode === 'existing' &&
        html`
          <button type="button" className=${`${action} text-red-500 hover:text-red-500`} onClick=${onDelete} aria-label="Delete">
            <${Icon} name="trash" size=${14} /> <span className="max-sm:hidden">Delete</span>
          </button>
        `}
      </div>
    `;
  }

  Books.SelectionPopup = SelectionPopup;
})();
