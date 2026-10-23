(() => {
  const { html, useEffect, useRef } = Books;

  /** Small modal confirmation (used for destructive actions). */
  function ConfirmDialog({ title, message, confirmLabel = 'Remove', onConfirm, onCancel }) {
    const cancelRef = useRef(null);

    useEffect(() => {
      cancelRef.current?.focus();
      const onKey = (e) => e.key === 'Escape' && onCancel();
      document.addEventListener('keydown', onKey);
      return () => document.removeEventListener('keydown', onKey);
    }, [onCancel]);

    return html`
      <div className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-black/30 p-4" onClick=${onCancel}>
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          aria-describedby="confirm-msg"
          className="glass w-full max-w-sm animate-pop-in rounded-2xl border border-line/10 p-5 shadow-pop"
          onClick=${(e) => e.stopPropagation()}
        >
          <h2 id="confirm-title" className="text-[15px] font-semibold">${title}</h2>
          <p id="confirm-msg" className="mt-1.5 text-[13px] text-muted">${message}</p>
          <div className="mt-5 flex justify-end gap-2">
            <button ref=${cancelRef} className="btn-secondary" onClick=${onCancel}>Cancel</button>
            <button className="btn bg-red-500 text-white hover:bg-red-600" onClick=${onConfirm}>${confirmLabel}</button>
          </div>
        </div>
      </div>
    `;
  }

  Books.ConfirmDialog = ConfirmDialog;
})();
