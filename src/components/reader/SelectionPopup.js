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
      let top = rect.top - height - 10;
      if (top < 56) top = Math.min(rect.bottom + 10, window.innerHeight - height - 8);
      setPos({ left, top });
    }, [popup]);

    if (!popup) return null;
    const current = popup.mode === 'existing' ? popup.highlight.color : null;
    const action =
      'focus-ring inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-ink/85 hover:bg-line/10 hover:text-ink';

    return html`
      <div
        ref=${ref}
        role="toolbar"
        aria-label=${popup.mode === 'existing' ? 'Highlight actions' : 'Selection actions'}
        className="glass fixed z-50 flex animate-pop-in items-center gap-1 rounded-xl border border-line/10 p-1.5 shadow-pop"
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
                className=${`focus-ring h-[22px] w-[22px] rounded-full border border-black/10 transition-transform hover:scale-110 ${
                  current === name ? 'ring-2 ring-ink/60 ring-offset-1 ring-offset-elevated' : ''
                }`}
                style=${{ background: hex }}
              />
            `,
          )}
        </div>
        <span className="mx-0.5 h-5 w-px bg-line/15" aria-hidden="true" />
        <button type="button" className=${action} onClick=${onNote}><${Icon} name="note" size=${14} /> Note</button>
        <button type="button" className=${action} onClick=${onCopy}><${Icon} name="copy" size=${14} /> Copy</button>
        <button type="button" className=${action} onClick=${onLookup}><${Icon} name="lookup" size=${14} /> Look Up</button>
        ${popup.mode === 'existing' &&
        html`
          <button type="button" className=${`${action} text-red-500 hover:text-red-500`} onClick=${onDelete}>
            <${Icon} name="trash" size=${14} /> Delete
          </button>
        `}
      </div>
    `;
  }

  Books.SelectionPopup = SelectionPopup;
})();
