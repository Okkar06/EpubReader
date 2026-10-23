(() => {
  const MAX_RESULTS = 1000;

  /**
   * Full-text search across the spine, one section at a time so memory stays bounded.
   * Calls onProgress(done, total, newResults) after each section. Stops when signal aborts.
   */
  async function searchBook(book, query, { signal, onProgress }) {
    const items = book.spine.spineItems;
    let count = 0;
    for (let i = 0; i < items.length; i++) {
      if (signal?.aborted || count >= MAX_RESULTS) return;
      const item = items[i];
      let found = [];
      try {
        await item.load(book.load.bind(book));
        found = (item.find(query) || []).map((r) => ({
          cfi: r.cfi,
          excerpt: r.excerpt.replace(/\s+/g, ' ').trim(),
          spineIndex: item.index,
        }));
      } catch {
        // A broken section shouldn't abort the whole search.
      } finally {
        item.unload();
      }
      found = found.slice(0, MAX_RESULTS - count);
      count += found.length;
      if (signal?.aborted) return;
      onProgress?.(i + 1, items.length, found);
      // Yield to keep the UI responsive.
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  Books.searchBook = searchBook;
})();
