(() => {
  const { html, useEffect, useLayoutEffect, useRef, useState, Icon } = Books;

  /** Context menu anchored at (x, y). Closes on outside click, Esc, scroll or resize. */
  function BookMenu({ menu, onClose, onOpen, onToggleFinished, onRemove }) {
    const ref = useRef(null);
    const [pos, setPos] = useState({ left: menu.x, top: menu.y });

    // Keep the menu inside the viewport.
    useLayoutEffect(() => {
      const el = ref.current;
      if (!el) return;
      const { width, height } = el.getBoundingClientRect();
      setPos({
        left: Math.min(menu.x, window.innerWidth - width - 8),
        top: Math.min(menu.y, window.innerHeight - height - 8),
      });
      el.querySelector('[role="menuitem"]')?.focus();
    }, [menu]);

    useEffect(() => {
      const onDown = (e) => !ref.current?.contains(e.target) && onClose();
      const onKey = (e) => {
        if (e.key === 'Escape') onClose();
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          const items = [...ref.current.querySelectorAll('[role="menuitem"]')];
          const i = items.indexOf(document.activeElement);
          const next = (i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
          items[next]?.focus();
        }
      };
      document.addEventListener('mousedown', onDown);
      document.addEventListener('keydown', onKey);
      window.addEventListener('resize', onClose);
      window.addEventListener('scroll', onClose, true);
      return () => {
        document.removeEventListener('mousedown', onDown);
        document.removeEventListener('keydown', onKey);
        window.removeEventListener('resize', onClose);
        window.removeEventListener('scroll', onClose, true);
      };
    }, [onClose]);

    const { book } = menu;
    const item =
      'focus-ring flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-left text-[13px] hover:bg-accent hover:text-white focus-visible:bg-accent focus-visible:text-white pointer-coarse:py-2.5 pointer-coarse:text-[15px]';

    return html`
      <div
        ref=${ref}
        role="menu"
        aria-label=${`Options for ${book.title}`}
        className="glass fixed z-50 w-56 animate-pop-in rounded-2xl border border-line/10 p-1 shadow-pop"
        style=${pos}
      >
        <button role="menuitem" className=${item} onClick=${() => onOpen(book.id)}>
          <${Icon} name="book" size=${16} /> Open
        </button>
        <button role="menuitem" className=${item} onClick=${() => onToggleFinished(book)}>
          <${Icon} name="check" size=${16} /> ${book.finished ? 'Mark as Unread' : 'Mark as Finished'}
        </button>
        <div className="mx-2 my-1 h-px bg-line/10" />
        <button role="menuitem" className=${`${item} text-red-500`} onClick=${() => onRemove(book)}>
          <${Icon} name="trash" size=${16} /> Remove…
        </button>
      </div>
    `;
  }

  Books.BookMenu = BookMenu;
})();
