(() => {
  const { html, Fragment, useState, formatPercent } = Books;

  /** Chapter title, slim progress slider and page / percentage readout. */
  function BottomBar({ visible, loc, locationsReady, onSeek, onHover }) {
    const [drag, setDrag] = useState(null); // preview value while scrubbing
    const pct = drag ?? loc?.percentage ?? 0;

    const commit = () => {
      if (drag != null) onSeek(drag);
      setDrag(null);
    };

    const pagesLeft = loc?.chapterPages ? Math.max(0, loc.chapterPages - loc.chapterPage) : null;
    const pageLabel = !locationsReady
      ? 'Calculating pages…'
      : drag != null
        ? formatPercent(drag)
        : loc?.page
          ? `Page ${loc.page} of ${loc.total}`
          : '';

    return html`
      <${Fragment}>
        <footer
          onPointerEnter=${(e) => e.pointerType === 'mouse' && onHover(true)}
          onPointerLeave=${(e) => e.pointerType === 'mouse' && onHover(false)}
          onFocusCapture=${() => onHover(true)}
          onBlurCapture=${() => onHover(false)}
          className=${`safe-x fixed inset-x-0 bottom-0 z-30 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] transition-all duration-300 ease-out ${
            visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0'
          }`}
        >
          <div className="glass mx-auto max-w-3xl rounded-2xl border border-line/10 px-4 pb-2.5 pt-2 shadow-pop sm:px-5">
            <div className="mb-1.5 flex items-center justify-between gap-4 text-[11px] text-muted">
              <span className="min-w-0 truncate font-medium text-ink/80">${loc?.chapter || ' '}</span>
              ${pagesLeft != null &&
              pagesLeft > 0 &&
              html`<span className="hidden shrink-0 sm:inline">
                ${pagesLeft} ${pagesLeft === 1 ? 'page' : 'pages'} left in chapter
              </span>`}
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                className="slider"
                min=${0}
                max=${1000}
                value=${Math.round(pct * 1000)}
                disabled=${!locationsReady}
                onChange=${(e) => setDrag(Number(e.target.value) / 1000)}
                onPointerUp=${commit}
                onKeyUp=${commit}
                onBlur=${() => setDrag(null)}
                aria-label="Reading position"
                aria-valuetext=${`${formatPercent(pct)} read`}
                style=${{ '--val': `${pct * 100}%` }}
              />
              <span className="shrink-0 text-right text-[11px] tabular-nums text-muted sm:w-36">
                ${pageLabel}
                ${locationsReady && drag == null && html`<span className="ml-1.5 text-ink/70">${formatPercent(pct)}</span>`}
              </span>
            </div>
          </div>
        </footer>

        <!-- Minimal persistent indicator while the bar is hidden -->
        <div
          aria-hidden="true"
          className=${`pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-20 text-center text-[11px] tabular-nums text-muted transition-opacity duration-300 ${
            visible || !locationsReady ? 'opacity-0' : 'opacity-70'
          }`}
        >
          ${loc?.page ? `${loc.page} of ${loc.total}` : ''}
        </div>
      <//>
    `;
  }

  Books.BottomBar = BottomBar;
})();
