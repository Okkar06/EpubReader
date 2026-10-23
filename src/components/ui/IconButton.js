(() => {
  const { html, forwardRef, Icon } = Books;

  /** Square toolbar button with an icon; `label` doubles as tooltip and aria-label. */
  const IconButton = forwardRef(function IconButton(
    { icon, label, onClick, active = false, filled = false, className = '', ...rest },
    ref,
  ) {
    return html`
      <button
        ref=${ref}
        type="button"
        aria-label=${label}
        title=${label}
        onClick=${onClick}
        className=${`btn-icon ${active ? 'bg-line/10 text-ink' : ''} ${className}`}
        ...${rest}
      >
        <${Icon} name=${icon} filled=${filled} />
      </button>
    `;
  });

  Books.IconButton = IconButton;
})();
