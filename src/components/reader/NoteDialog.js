(() => {
  const { html, useEffect, useRef, useState, HIGHLIGHT_COLORS } = Books;

  /** Modal for writing a note attached to a highlight. Cmd/Ctrl+Enter saves. */
  function NoteDialog({ highlight, onSave, onClose }) {
    const [text, setText] = useState(highlight.note || '');
    const ref = useRef(null);

    useEffect(() => {
      ref.current?.focus();
    }, []);

    return html`
      <div className="fixed inset-0 z-[60] flex animate-fade-in items-center justify-center bg-black/30 p-4" onClick=${onClose}>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="note-title"
          className="glass w-full max-w-md animate-pop-in rounded-2xl border border-line/10 p-5 shadow-pop"
          onClick=${(e) => e.stopPropagation()}
        >
          <h2 id="note-title" className="text-[15px] font-semibold">Note</h2>
          <blockquote
            className="mt-3 line-clamp-4 border-l-[3px] pl-3 font-book text-[13px] italic text-muted"
            style=${{ borderColor: HIGHLIGHT_COLORS[highlight.color] }}
          >
            ${highlight.text}
          </blockquote>
          <textarea
            ref=${ref}
            value=${text}
            onChange=${(e) => setText(e.target.value)}
            onKeyDown=${(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onSave(text);
            }}
            rows=${5}
            placeholder="Write a note…"
            aria-label="Note text"
            className="input mt-4 w-full resize-none text-[14px] leading-relaxed"
          />
          <div className="mt-4 flex justify-end gap-2">
            <button className="btn-secondary" onClick=${onClose}>Cancel</button>
            <button className="btn-primary" onClick=${() => onSave(text)}>Save</button>
          </div>
        </div>
      </div>
    `;
  }

  Books.NoteDialog = NoteDialog;
})();
