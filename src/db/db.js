(() => {
  // All data lives in the browser's IndexedDB.
  // - books:      metadata, cover Blob, progress, cached page locations
  // - files:      raw EPUB ArrayBuffers (kept apart so the library list stays light)
  // - bookmarks / highlights: per-book annotations
  // - settings:   key/value app preferences
  const db = new Dexie('epub-reader');

  db.version(1).stores({
    books: 'id, title, author, addedAt, lastOpenedAt',
    files: 'id',
    bookmarks: 'id, bookId, createdAt',
    highlights: 'id, bookId, createdAt',
    settings: 'key',
  });

  /** Delete a book and everything attached to it. */
  async function removeBook(id) {
    await db.transaction('rw', db.books, db.files, db.bookmarks, db.highlights, async () => {
      await db.books.delete(id);
      await db.files.delete(id);
      await db.bookmarks.where('bookId').equals(id).delete();
      await db.highlights.where('bookId').equals(id).delete();
    });
  }

  Object.assign(Books, { db, removeBook });
})();
