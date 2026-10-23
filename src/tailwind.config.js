// Configuration for the in-browser Tailwind runtime (vendor/tailwind.js).
(() => {
  const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

  tailwind.config = {
    theme: {
      extend: {
        // Theme tokens are CSS variables (see styles.css) so every theme reuses the same classes.
        colors: {
          canvas: token('canvas'),
          surface: token('surface'),
          elevated: token('elevated'),
          ink: token('ink'),
          muted: token('muted'),
          line: token('line'),
          accent: token('accent'),
        },
        fontFamily: {
          ui: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', 'Inter', '"Segoe UI"', 'system-ui', 'sans-serif'],
          book: ['"Iowan Old Style"', 'Georgia', '"Times New Roman"', 'serif'],
        },
        boxShadow: {
          cover: '0 1px 2px rgba(0,0,0,.10), 0 8px 18px -6px rgba(0,0,0,.30)',
          'cover-hover': '0 2px 4px rgba(0,0,0,.12), 0 16px 28px -8px rgba(0,0,0,.38)',
          // --glass-shine (styles.css) keeps the specular edge of .glass when a pop shadow is applied.
          pop: 'var(--glass-shine), 0 12px 40px -8px rgba(0,0,0,.35), 0 0 0 .5px rgba(0,0,0,.12)',
        },
        keyframes: {
          popIn: {
            from: { opacity: '0', transform: 'scale(.96) translateY(-4px)' },
            to: { opacity: '1', transform: 'none' },
          },
          fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
          slideUp: {
            from: { opacity: '0', transform: 'translateY(8px)' },
            to: { opacity: '1', transform: 'none' },
          },
        },
        animation: {
          'pop-in': 'popIn .16s cubic-bezier(.2,.8,.2,1)',
          'fade-in': 'fadeIn .2s ease-out',
          'slide-up': 'slideUp .25s cubic-bezier(.2,.8,.2,1)',
        },
      },
    },
    plugins: [
      // `pointer-coarse:` styles apply on touch screens (phones, tablets).
      ({ addVariant }) => addVariant('pointer-coarse', '@media (pointer: coarse)'),
    ],
  };
})();
