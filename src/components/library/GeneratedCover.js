// Fallback cover for books without one: a tasteful gradient seeded by the title.
(() => {
  const { html } = Books;

  const PALETTES = [
    ['#2c3e50', '#4a6572'],
    ['#7b2d26', '#b5523b'],
    ['#264d3b', '#3f7a5c'],
    ['#3d2c5e', '#6b4f9e'],
    ['#5e4b2c', '#9c7a43'],
    ['#1f3a5f', '#3b6ea5'],
  ];

  function hash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  function GeneratedCover({ title, author }) {
    const [a, b] = PALETTES[hash(title || '') % PALETTES.length];
    return html`
      <div
        className="flex h-full w-full flex-col justify-between p-3 text-left text-white"
        style=${{ background: `linear-gradient(160deg, ${a}, ${b})` }}
      >
        <p className="line-clamp-5 font-book text-[15px] font-semibold leading-snug">${title}</p>
        ${author && html`<p className="line-clamp-2 text-[10px] uppercase tracking-wider opacity-80">${author}</p>`}
      </div>
    `;
  }

  Books.GeneratedCover = GeneratedCover;
})();
