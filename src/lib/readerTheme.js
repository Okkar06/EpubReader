// Page themes, typography options and the CSS injected into each EPUB iframe.
(() => {
  const PAGE_THEMES = {
    light: { label: 'Light', bg: '#ffffff', text: '#1d1d1f', link: '#c25e00', selection: 'rgba(255,149,0,.28)', dark: false },
    sepia: { label: 'Sepia', bg: '#f8f1e3', text: '#5b4636', link: '#9c4f12', selection: 'rgba(200,110,20,.25)', dark: false },
    gray: { label: 'Gray', bg: '#4a4a4d', text: '#ebebed', link: '#ffb340', selection: 'rgba(255,159,10,.35)', dark: true },
    dark: { label: 'Dark', bg: '#1c1c1e', text: '#e5e5e7', link: '#ff9f0a', selection: 'rgba(255,159,10,.35)', dark: true },
  };

  const THEME_OPTIONS = ['auto', 'light', 'sepia', 'gray', 'dark'];

  const FONTS = [
    { id: 'original', label: 'Original', stack: null },
    { id: 'georgia', label: 'Georgia', stack: 'Georgia, "Times New Roman", serif' },
    { id: 'palatino', label: 'Palatino', stack: 'Palatino, "Palatino Linotype", "Book Antiqua", serif' },
    { id: 'charter', label: 'Charter', stack: 'Charter, "Bitstream Charter", "Sitka Text", Cambria, serif' },
    { id: 'sans', label: 'System Sans', stack: '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif' },
    { id: 'serif', label: 'Serif', stack: '"Iowan Old Style", "Times New Roman", Times, serif' },
  ];

  const LINE_HEIGHTS = [
    { value: 1.35, label: 'Compact' },
    { value: 1.55, label: 'Normal' },
    { value: 1.8, label: 'Relaxed' },
  ];

  // Horizontal page margins in px (applied as padding around the rendition).
  const MARGINS = { narrow: 20, normal: 56, wide: 112 };

  const FONT_SIZE = { min: 70, max: 200, step: 10 };

  const HIGHLIGHT_COLORS = {
    yellow: '#ffd60a',
    green: '#34c759',
    blue: '#5ac8fa',
    pink: '#ff6fa5',
    purple: '#bf5af2',
  };

  /** SVG attributes for an epub.js highlight mark. Blend mode is set via CSS (.rd-hl). */
  function highlightStyle(color) {
    return { fill: HIGHLIGHT_COLORS[color] || HIGHLIGHT_COLORS.yellow, 'fill-opacity': '0.34', 'mix-blend-mode': 'normal' };
  }

  /** Build the stylesheet that overrides the book's own CSS for the current settings. */
  function buildReaderCss(settings, themeName) {
    const t = PAGE_THEMES[themeName] || PAGE_THEMES.light;
    const font = FONTS.find((f) => f.id === settings.font) || FONTS[0];
    const justify = settings.align === 'justify';

    // For non-light themes we neutralise the book's colours so text never ends up dark-on-dark.
    const colorOverrides =
      t.dark || themeName === 'sepia'
        ? `
      body *:not(img):not(svg):not(image):not(path):not(video):not(canvas) {
        color: inherit !important;
        background-color: transparent !important;
        border-color: ${t.text}33 !important;
      }`
        : '';

    return `
      html {
        color-scheme: ${t.dark ? 'dark' : 'light'} !important;
        background: ${t.bg} !important;
      }
      body {
        background: transparent !important;
        color: ${t.text} !important;
        font-size: ${settings.fontSize}% !important;
        ${font.stack ? `font-family: ${font.stack} !important;` : ''}
        -webkit-font-smoothing: antialiased;
        text-rendering: optimizeLegibility;
      }
      ${font.stack ? 'body *:not(code):not(pre):not(kbd):not(samp):not(tt) { font-family: inherit !important; }' : ''}
      body p, body li, body blockquote, body dd {
        line-height: ${settings.lineHeight} !important;
        text-align: ${justify ? 'justify' : 'left'} !important;
        ${justify ? '-webkit-hyphens: auto; hyphens: auto;' : ''}
      }
      ${colorOverrides}
      a, a * { color: ${t.link} !important; }
      img, svg, video { max-width: 100% !important; }
      ${t.dark ? 'img { filter: brightness(.9) contrast(1.05); }' : ''}
      ::selection { background: ${t.selection}; }
    `;
  }

  const STYLE_ID = 'reader-overrides';

  /** Insert or replace our <style> in an epub.js Contents document. */
  function injectCss(contents, css) {
    const doc = contents?.document;
    if (!doc) return;
    let el = doc.getElementById(STYLE_ID);
    if (!el) {
      el = doc.createElement('style');
      el.id = STYLE_ID;
      (doc.head || doc.documentElement).appendChild(el);
    }
    el.textContent = css;
  }

  Object.assign(Books, {
    PAGE_THEMES,
    THEME_OPTIONS,
    FONTS,
    LINE_HEIGHTS,
    MARGINS,
    FONT_SIZE,
    HIGHLIGHT_COLORS,
    highlightStyle,
    buildReaderCss,
    injectCss,
  });
})();
