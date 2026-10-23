(() => {
  const { html, useEffect, useRef, useSettings, FONTS, FONT_SIZE, LINE_HEIGHTS, PAGE_THEMES, THEME_OPTIONS, clamp, Segmented } =
    Books;

  /** Apple Books–style "Aa" panel: theme, size, font, spacing, margins, alignment, layout. A bottom sheet on phones. */
  function AppearancePopover({ onClose }) {
    const { settings, update } = useSettings();
    const ref = useRef(null);

    useEffect(() => {
      ref.current?.querySelector('button')?.focus();
      const onDown = (e) => {
        if (!ref.current?.contains(e.target) && !e.target.closest?.('[data-aa-trigger]')) onClose();
      };
      document.addEventListener('pointerdown', onDown);
      return () => document.removeEventListener('pointerdown', onDown);
    }, [onClose]);

    const step = (d) => update((s) => ({ fontSize: clamp(s.fontSize + d, FONT_SIZE.min, FONT_SIZE.max) }));
    const pct = ((settings.fontSize - FONT_SIZE.min) / (FONT_SIZE.max - FONT_SIZE.min)) * 100;

    return html`
      <div
        ref=${ref}
        role="dialog"
        aria-label="Appearance settings"
        className="glass thin-scroll fixed z-40 max-h-[70dvh] origin-bottom animate-slide-up space-y-5 overflow-y-auto rounded-3xl border border-line/10 p-4 shadow-pop max-sm:inset-x-2 max-sm:bottom-[calc(env(safe-area-inset-bottom)+0.5rem)] sm:right-[max(1rem,calc(50vw-24rem+0.5rem))] sm:top-[calc(env(safe-area-inset-top)+4rem)] sm:max-h-[calc(100dvh-5rem)] sm:w-[300px] sm:origin-top-right sm:animate-pop-in"
      >
        <!-- Themes -->
        <div>
          <p className="section-label mb-2">Theme</p>
          <div role="radiogroup" aria-label="Theme" className="flex justify-between">
            ${THEME_OPTIONS.map((id) => {
              const selected = settings.theme === id;
              const label = id === 'auto' ? 'Auto' : PAGE_THEMES[id].label;
              const background = id === 'auto' ? 'linear-gradient(135deg, #ffffff 50%, #1c1c1e 50%)' : PAGE_THEMES[id].bg;
              return html`
                <button
                  key=${id}
                  type="button"
                  role="radio"
                  aria-checked=${selected}
                  aria-label=${`${label} theme`}
                  onClick=${() => update({ theme: id })}
                  className="focus-ring group flex flex-col items-center gap-1 rounded-lg"
                >
                  <span
                    className=${`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition-shadow ${
                      selected ? 'ring-2 ring-accent ring-offset-2 ring-offset-elevated' : 'border-line/15'
                    }`}
                    style=${{ background, color: id === 'auto' ? '#888' : PAGE_THEMES[id].text }}
                  >
                    ${id === 'auto' ? '' : 'Aa'}
                  </span>
                  <span className=${`text-[11px] ${selected ? 'font-semibold text-ink' : 'text-muted'}`}>${label}</span>
                </button>
              `;
            })}
          </div>
        </div>

        <!-- Font size -->
        <div>
          <p className="section-label mb-2">Text size · ${settings.fontSize}%</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="btn-icon text-xs font-semibold"
              aria-label="Decrease font size"
              onClick=${() => step(-FONT_SIZE.step)}
            >
              A
            </button>
            <input
              type="range"
              className="slider"
              min=${FONT_SIZE.min}
              max=${FONT_SIZE.max}
              step=${FONT_SIZE.step}
              value=${settings.fontSize}
              onChange=${(e) => update({ fontSize: Number(e.target.value) })}
              aria-label="Font size"
              aria-valuetext=${`${settings.fontSize}%`}
              style=${{ '--val': `${pct}%` }}
            />
            <button
              type="button"
              className="btn-icon text-lg font-semibold"
              aria-label="Increase font size"
              onClick=${() => step(FONT_SIZE.step)}
            >
              A
            </button>
          </div>
        </div>

        <!-- Fonts -->
        <div>
          <p className="section-label mb-1.5">Font</p>
          <div role="radiogroup" aria-label="Font" className="overflow-hidden rounded-lg bg-line/[0.05]">
            ${FONTS.map((f) => {
              const selected = settings.font === f.id;
              return html`
                <button
                  key=${f.id}
                  type="button"
                  role="radio"
                  aria-checked=${selected}
                  onClick=${() => update({ font: f.id })}
                  className="focus-ring flex w-full items-center justify-between border-b border-line/[0.06] px-3 py-2 text-left text-[14px] last:border-0 hover:bg-line/[0.05]"
                  style=${{ fontFamily: f.stack || undefined }}
                >
                  ${f.label}
                  ${selected && html`<span className="text-accent" aria-hidden="true">✓</span>`}
                </button>
              `;
            })}
          </div>
        </div>

        <${Segmented}
          label="Line spacing"
          value=${settings.lineHeight}
          options=${LINE_HEIGHTS}
          onChange=${(v) => update({ lineHeight: v })}
        />
        <${Segmented}
          label="Margins"
          value=${settings.margin}
          options=${[
            { value: 'narrow', label: 'Narrow' },
            { value: 'normal', label: 'Normal' },
            { value: 'wide', label: 'Wide' },
          ]}
          onChange=${(v) => update({ margin: v })}
        />
        <${Segmented}
          label="Alignment"
          value=${settings.align}
          options=${[
            { value: 'justify', label: 'Justified' },
            { value: 'left', label: 'Left' },
          ]}
          onChange=${(v) => update({ align: v })}
        />
        <${Segmented}
          label="Layout"
          value=${settings.spread}
          options=${[
            { value: 'auto', label: 'Auto' },
            { value: 'single', label: 'Single' },
            { value: 'double', label: 'Two Pages' },
          ]}
          onChange=${(v) => update({ spread: v })}
        />
      </div>
    `;
  }

  Books.AppearancePopover = AppearancePopover;
})();
