(() => {
  /** Random id; falls back when crypto.randomUUID is unavailable (non-secure contexts). */
  function uid() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }

  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

  /** Reject if a promise takes longer than `ms` (epub.js can hang on broken files). */
  function withTimeout(promise, ms, message) {
    let timer;
    return Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), ms);
      }),
    ]).finally(() => clearTimeout(timer));
  }

  /** Turn low-level parser/storage errors into something a reader can act on. */
  function friendlyError(err) {
    const msg = String(err?.message || err || '');
    if (err?.name === 'QuotaExceededError' || /quota/i.test(msg)) {
      return 'Not enough browser storage space. Remove some books and try again.';
    }
    if (/zip|end of data|central directory|corrupt|signature/i.test(msg)) {
      return 'This EPUB file appears to be damaged or is not a valid EPUB archive.';
    }
    if (/container\.xml|rootfile|package|opf/i.test(msg)) {
      return 'This EPUB is missing required files (container or package document).';
    }
    return msg || 'Something went wrong while opening this book.';
  }

  function formatDate(ts) {
    return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  const formatPercent = (p) => `${Math.round((p || 0) * 100)}%`;

  Object.assign(Books, { uid, clamp, withTimeout, friendlyError, formatDate, formatPercent });
})();
