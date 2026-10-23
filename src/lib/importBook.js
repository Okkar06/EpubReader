(() => {
  const { db, friendlyError, uid, withTimeout } = Books;

  const MAX_BYTES = 300 * 1024 * 1024;
  const COVER_MAX_PX = 600;

  /** Import several files sequentially; returns a summary with per-file errors. */
  async function importEpubFiles(files, onProgress) {
    const errors = [];
    let added = 0;
    for (let i = 0; i < files.length; i++) {
      try {
        await importOne(files[i]);
        added++;
      } catch (err) {
        errors.push({ name: files[i].name, message: err?.message || 'Unknown error.' });
      }
      onProgress?.(i + 1, files.length);
    }
    return { added, errors };
  }

  async function importOne(file) {
    if (!/\.epub$/i.test(file.name) && file.type !== 'application/epub+zip') {
      throw new Error('Not an EPUB file.');
    }
    if (file.size === 0) throw new Error('The file is empty.');
    if (file.size > MAX_BYTES) {
      throw new Error(`File is too large (${Math.round(file.size / 1048576)} MB). The limit is 300 MB.`);
    }

    const data = await file.arrayBuffer();
    const sig = new Uint8Array(data, 0, 2);
    if (sig[0] !== 0x50 || sig[1] !== 0x4b) {
      throw new Error("This doesn't look like a valid EPUB (it isn't a ZIP archive).");
    }

    const book = ePub();
    try {
      await withTimeout(book.open(data, 'binary'), 30000, 'Timed out while reading the file.');
      const meta = (await withTimeout(book.loaded.metadata, 15000, 'Timed out reading book metadata.')) || {};
      if (!book.spine?.length) throw new Error('This EPUB has no readable chapters.');

      const title = clean(meta.title) || file.name.replace(/\.epub$/i, '');
      const author = clean(meta.creator);

      const dup = await db.books.filter((b) => b.title === title && b.author === author && b.size === file.size).first();
      if (dup) throw new Error('This book is already in your library.');

      const cover = await extractCover(book).catch(() => null);
      const id = uid();
      await db.transaction('rw', db.books, db.files, async () => {
        await db.files.put({ id, data });
        await db.books.put({
          id,
          title,
          author,
          cover,
          size: file.size,
          addedAt: Date.now(),
          lastOpenedAt: 0,
          progress: 0,
          cfi: null,
          finished: false,
          locations: null,
        });
      });
    } catch (err) {
      throw new Error(friendlyError(err));
    } finally {
      try {
        book.destroy();
      } catch {
        /* ignore */
      }
    }
  }

  const clean = (s) => (typeof s === 'string' ? s.replace(/\s+/g, ' ').trim() : '');

  async function extractCover(book) {
    await withTimeout(book.loaded.cover, 10000, 'cover timeout');
    const url = await book.coverUrl();
    if (!url) return null;
    try {
      const blob = await (await fetch(url)).blob();
      return await downscale(blob).catch(() => blob);
    } finally {
      if (url.startsWith('blob:')) URL.revokeObjectURL(url);
    }
  }

  /** Shrink large cover images so the library grid stays fast. */
  async function downscale(blob) {
    const bitmap = await createImageBitmap(blob);
    const scale = Math.min(1, COVER_MAX_PX / Math.max(bitmap.width, bitmap.height));
    if (scale === 1) return blob;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    return new Promise((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/jpeg', 0.88),
    );
  }

  Books.importEpubFiles = importEpubFiles;
})();
