// SF Symbols–inspired line icons (24×24, stroke-based).
(() => {
  const { html } = Books;

  const PATHS = {
    chevronLeft: 'M15 18l-6-6 6-6',
    chevronRight: 'M9 18l6-6-6-6',
    list: 'M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01',
    search: 'M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15zM21 21l-5.2-5.2',
    bookmark: 'M6.5 3.5h11a.5.5 0 0 1 .5.5v16.5l-6-4.2-6 4.2V4a.5.5 0 0 1 .5-.5z',
    highlighter: 'M4 20.5h16M7 16.5l-1-4 8.8-8.8a1.5 1.5 0 0 1 2.1 0l1.9 1.9a1.5 1.5 0 0 1 0 2.1L10 16.5zM6 12.5l4 4',
    note: 'M5 4h14v11l-5 5H5zM14 20v-5h5M8.5 9h7M8.5 12.5h4',
    copy: 'M9 9h10v11H9zM5 15V4h10',
    lookup: 'M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5zM20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z',
    trash: 'M4 7h16M10 11v6M14 11v6M5.5 7l1 12.5A1.5 1.5 0 0 0 8 21h8a1.5 1.5 0 0 0 1.5-1.5l1-12.5M9 7V4.5A.5.5 0 0 1 9.5 4h5a.5.5 0 0 1 .5.5V7',
    close: 'M17 7L7 17M7 7l10 10',
    plus: 'M12 5v14M5 12h14',
    more: 'M6 12h.01M12 12h.01M18 12h.01',
    check: 'M5 12.5l4.5 4.5L19 7.5',
    book: 'M12 6.5C10.5 5 8 4.5 4 4.5v14c4 0 6.5.5 8 2 1.5-1.5 4-2 8-2v-14c-4 0-6.5.5-8 2zM12 6.5v14',
    upload: 'M12 16V4M7 9l5-5 5 5M4 16v3.5A.5.5 0 0 0 4.5 20h15a.5.5 0 0 0 .5-.5V16',
    alert: 'M12 9v4M12 17h.01M10.3 3.9L2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
    sort: 'M7 4v16M3.5 16.5L7 20l3.5-3.5M17 20V4M13.5 7.5L17 4l3.5 3.5',
  };

  function Icon({ name, size = 18, filled = false, strokeWidth = 1.7, className = '' }) {
    return html`
      <svg
        width=${size}
        height=${size}
        viewBox="0 0 24 24"
        fill=${filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth=${name === 'more' ? 3 : strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
        className=${className}
      >
        <path d=${PATHS[name]} />
      </svg>
    `;
  }

  Books.Icon = Icon;
})();
