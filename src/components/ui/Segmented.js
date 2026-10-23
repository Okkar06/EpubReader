(() => {
  const { html } = Books;

  /** macOS-style segmented control (radio group). */
  function Segmented({ label, value, options, onChange }) {
    return html`
      <div>
        <p className="section-label mb-1.5">${label}</p>
        <div role="radiogroup" aria-label=${label} className="flex rounded-lg bg-line/[0.07] p-0.5">
          ${options.map((opt) => {
            const selected = opt.value === value;
            return html`
              <button
                key=${String(opt.value)}
                type="button"
                role="radio"
                aria-checked=${selected}
                onClick=${() => onChange(opt.value)}
                className=${`focus-ring flex-1 rounded-md px-2 py-1 text-xs font-medium transition-all ${
                  selected ? 'bg-elevated text-ink shadow-sm ring-1 ring-line/5' : 'text-muted hover:text-ink'
                }`}
              >
                ${opt.label}
              </button>
            `;
          })}
        </div>
      </div>
    `;
  }

  Books.Segmented = Segmented;
})();
