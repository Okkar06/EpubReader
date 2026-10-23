(() => {
  const {
    html,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    useLiveQuery,
    db,
    useSettings,
    buildReaderCss,
    FONT_SIZE,
    highlightStyle,
    injectCss,
    MARGINS,
    PAGE_THEMES,
    clamp,
    friendlyError,
    uid,
    withTimeout,
    Toolbar,
    BottomBar,
    Sidebar,
    SearchPanel,
    SelectionPopup,
    NoteDialog,
    Icon,
  } = Books;

  const EpubCFI = ePub.CFI;

  // epub.js spread settings: [mode, minSpreadWidth]. "auto" switches to two pages on wide windows.
  const SPREAD = { auto: ['auto', 900], single: ['none', 900], double: ['always', 1] };
  const CHARS_PER_PAGE = 1600;
  const CHROME_HIDE_MS = 2500;
  const cfiTool = new EpubCFI();

  const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  /** Flatten nested navigation into a list with depth + resolved spine index. */
  function flattenToc(book, items, depth = 0, out = []) {
    for (const item of items) {
      const href = item.href || '';
      const path = href.split('#')[0];
      const file = path.split('/').pop();
      let section = book.spine.get(href);
      if (!section && path) {
        // Some nav documents use hrefs relative to the nav file rather than the package.
        section = book.spine.spineItems.find((s) => s.href === path || s.href.endsWith(`/${file}`)) || null;
      }
      out.push({ label: (item.label || '').trim() || 'Untitled', href, depth, spineIndex: section ? section.index : -1 });
      if (item.subitems?.length) flattenToc(book, item.subitems, depth + 1, out);
    }
    return out;
  }

  /** Index into the flat TOC of the first entry for the closest spine position at or before `spineIndex`. */
  function tocIndexFor(toc, spineIndex) {
    let found = -1;
    toc.forEach((t, i) => {
      if (t.spineIndex >= 0 && t.spineIndex <= spineIndex) {
        if (found === -1 || t.spineIndex > toc[found].spineIndex) found = i;
      }
    });
    return found;
  }

  function cfiInRange(cfi, start, end) {
    try {
      return cfiTool.compare(cfi, start) >= 0 && cfiTool.compare(cfi, end) <= 0;
    } catch {
      return false;
    }
  }

  /** Viewport rect of a CFI range inside an epub.js Contents iframe. */
  function rectFromContents(contents, cfiRange) {
    try {
      const range = contents.range(cfiRange);
      const r = range.getBoundingClientRect();
      const f = contents.window.frameElement?.getBoundingClientRect() ?? { left: 0, top: 0 };
      return { left: f.left + r.left, right: f.left + r.right, top: f.top + r.top, bottom: f.top + r.bottom };
    } catch {
      return null;
    }
  }

  function Reader({ bookId, onExit }) {
    const { settings, update, resolvedTheme } = useSettings();

    // DOM + epub.js instances
    const stageRef = useRef(null);
    const viewerRef = useRef(null);
    const bookRef = useRef(null);
    const rendRef = useRef(null);

    // Mutable state read by long-lived epub.js listeners
    const locRef = useRef(null);
    const tocRef = useRef([]);
    const rtlRef = useRef(false);
    const popupRef = useRef(null);
    const searchMarkRef = useRef(null);
    const hlClickAt = useRef(0);
    const wheelRef = useRef({ acc: 0, last: 0, lockUntil: 0 });
    const touchRef = useRef(null);
    const hideTimer = useRef(0);
    const handlers = useRef({});

    const [record, setRecord] = useState(null);
    const [status, setStatus] = useState('loading'); // loading | ready | error
    const [error, setError] = useState('');
    const [toc, setToc] = useState([]);
    const [loc, setLoc] = useState(null);
    const [locationsReady, setLocationsReady] = useState(false);
    const [sidebarTab, setSidebarTab] = useState(null); // null = closed
    const [searchOpen, setSearchOpen] = useState(false);
    const [appearanceOpen, setAppearanceOpen] = useState(false);
    const [chromeVisible, setChromeVisible] = useState(true);
    const [hoverChrome, setHoverChrome] = useState(false);
    const [popup, setPopup] = useState(null);
    const [noteFor, setNoteFor] = useState(null);

    popupRef.current = popup;

    const bookmarks = useLiveQuery(() => db.bookmarks.where('bookId').equals(bookId).sortBy('createdAt'), [bookId]) ?? [];
    const highlights = useLiveQuery(() => db.highlights.where('bookId').equals(bookId).sortBy('createdAt'), [bookId]) ?? [];

    const css = useMemo(() => buildReaderCss(settings, resolvedTheme), [settings, resolvedTheme]);
    const cssRef = useRef(css);
    cssRef.current = css;
    const settingsRef = useRef(settings);
    settingsRef.current = settings;

    // ---------- Chrome auto-hide ----------
    const poke = useCallback(() => {
      setChromeVisible(true);
      clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setChromeVisible(false), CHROME_HIDE_MS);
    }, []);
    useEffect(() => () => clearTimeout(hideTimer.current), []);

    const pinned = !!sidebarTab || searchOpen || appearanceOpen || hoverChrome || !!noteFor || status !== 'ready';
    const showChrome = chromeVisible || pinned;

    // ---------- Location helpers ----------
    const chapterFor = useCallback((spineIndex) => {
      const i = tocIndexFor(tocRef.current, spineIndex);
      return i >= 0 ? tocRef.current[i].label : '';
    }, []);

    function describe(location) {
      const book = bookRef.current;
      const { start, end } = location;
      const hasLocs = book.locations.length() > 0;
      return {
        cfi: start.cfi,
        endCfi: end.cfi,
        index: start.index,
        percentage: hasLocs ? book.locations.percentageFromCfi(start.cfi) : null,
        page: hasLocs ? book.locations.locationFromCfi(start.cfi) + 1 : null,
        total: hasLocs ? book.locations.length() : null,
        chapter: chapterFor(start.index),
        chapterPage: start.displayed?.page,
        chapterPages: start.displayed?.total,
        atStart: !!location.atStart,
        atEnd: !!location.atEnd,
      };
    }

    const progressPatch = (l) => {
      const patch = { cfi: l.cfi, lastOpenedAt: Date.now() };
      if (l.percentage != null) patch.progress = l.percentage;
      return patch;
    };

    function addHighlightMark(h) {
      rendRef.current?.annotations.highlight(
        h.cfiRange,
        { id: h.id },
        () => handlers.current.openHighlight(h.id),
        'rd-hl',
        highlightStyle(h.color),
      );
    }

    // Re-render the current section (needed after typography changes alter pagination).
    const reflow = useCallback(() => {
      const r = rendRef.current;
      if (!r) return;
      const cfi = locRef.current?.cfi;
      try {
        r.manager?.clear();
      } catch {
        /* ignore */
      }
      r.display(cfi).catch(() => r.display());
    }, []);

    // ---------- Book lifecycle ----------
    useEffect(() => {
      let cancelled = false;
      let book = null;
      const viewer = viewerRef.current;
      viewer.innerHTML = '';

      (async () => {
        try {
          const [rec, file] = await Promise.all([db.books.get(bookId), db.files.get(bookId)]);
          if (!rec || !file) throw new Error('This book is no longer in your library.');
          if (cancelled) return;
          setRecord(rec);

          book = ePub();
          bookRef.current = book;
          await withTimeout(book.open(file.data, 'binary'), 30000, 'Timed out while opening the book.');
          if (cancelled) return;
          rtlRef.current = book.packaging?.metadata?.direction === 'rtl';

          // A broken nav document shouldn't stop reading — fall back to no TOC.
          const nav = await withTimeout(book.loaded.navigation, 10000, 'nav timeout').catch(() => null);
          const flat = flattenToc(book, nav?.toc || []);
          tocRef.current = flat;
          setToc(flat);

          const [spread, minSpreadWidth] = SPREAD[settingsRef.current.spread] || SPREAD.auto;
          const rendition = book.renderTo(viewer, {
            width: '100%',
            height: '100%',
            flow: 'paginated',
            spread,
            minSpreadWidth,
            allowScriptedContent: false,
          });
          rendRef.current = rendition;

          // Inject theme CSS + gesture listeners into every section iframe as it loads.
          rendition.hooks.content.register((contents) => {
            injectCss(contents, cssRef.current);
            contents.document.addEventListener('wheel', (e) => handlers.current.onWheel(e), { passive: true });
          });
          rendition.on('relocated', (l) => handlers.current.onRelocated(l));
          rendition.on('selected', (cfi, contents) => handlers.current.onSelected(cfi, contents));
          rendition.on('click', (e) => handlers.current.onFrameClick(e));
          rendition.on('keydown', (e) => handlers.current.onKey(e));
          rendition.on('mousemove', () => handlers.current.poke());
          rendition.on('touchstart', (e) => handlers.current.onTouchStart(e));
          rendition.on('touchend', (e) => handlers.current.onTouchEnd(e));

          // Restore saved highlights (epub.js draws them as sections render).
          const saved = await db.highlights.where('bookId').equals(bookId).toArray();
          saved.forEach(addHighlightMark);

          try {
            await rendition.display(rec.cfi || undefined);
          } catch {
            await rendition.display();
          }
          if (cancelled) return;
          setStatus('ready');
          poke();
          db.books.update(bookId, { lastOpenedAt: Date.now() });

          // Page numbers: load cached locations, or generate once and cache.
          // Failure here only disables page numbers — the book stays readable.
          try {
            if (rec.locations) {
              book.locations.load(rec.locations);
            } else {
              await book.locations.generate(CHARS_PER_PAGE);
              if (cancelled) return;
              db.books.update(bookId, { locations: book.locations.save() });
            }
            if (cancelled) return;
            setLocationsReady(true);
            const current = rendition.currentLocation();
            if (current?.start) handlers.current.onRelocated(current);
          } catch (err) {
            console.warn('Could not compute page locations', err);
          }
        } catch (err) {
          if (cancelled) return;
          console.error(err);
          setError(friendlyError(err));
          setStatus('error');
        }
      })();

      return () => {
        cancelled = true;
        if (locRef.current) db.books.update(bookId, progressPatch(locRef.current));
        try {
          book?.destroy();
        } catch {
          /* ignore */
        }
        bookRef.current = null;
        rendRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bookId]);

    // Persist progress shortly after each page turn.
    useEffect(() => {
      if (!loc) return undefined;
      const t = setTimeout(() => db.books.update(bookId, progressPatch(loc)), 500);
      return () => clearTimeout(t);
    }, [loc, bookId]);

    // ---------- Appearance ----------
    // Colours update instantly in live iframes.
    useEffect(() => {
      if (status !== 'ready') return;
      rendRef.current?.getContents().forEach((c) => injectCss(c, css));
    }, [css, status]);

    // Typography changes re-paginate (debounced so slider drags stay smooth).
    const typoKey = `${settings.fontSize}|${settings.font}|${settings.lineHeight}|${settings.align}`;
    const appliedTypo = useRef(typoKey);
    useEffect(() => {
      if (status !== 'ready' || appliedTypo.current === typoKey) return undefined;
      const t = setTimeout(() => {
        appliedTypo.current = typoKey;
        reflow();
      }, 200);
      return () => clearTimeout(t);
    }, [typoKey, status, reflow]);

    // Single / two-page layout.
    const appliedSpread = useRef(settings.spread);
    useEffect(() => {
      const r = rendRef.current;
      if (status !== 'ready' || !r || appliedSpread.current === settings.spread) return;
      appliedSpread.current = settings.spread;
      const [mode, min] = SPREAD[settings.spread] || SPREAD.auto;
      r.spread(mode, min);
      reflow();
    }, [settings.spread, status, reflow]);

    // Keep epub.js sized to its container (margins, window resizes).
    useEffect(() => {
      if (status !== 'ready') return undefined;
      let raf = 0;
      const ro = new ResizeObserver(() => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          try {
            rendRef.current?.resize();
          } catch {
            /* ignore */
          }
        });
      });
      ro.observe(viewerRef.current);
      return () => {
        ro.disconnect();
        cancelAnimationFrame(raf);
      };
    }, [status]);

    // ---------- Navigation ----------
    const turn = useCallback(async (dir) => {
      const r = rendRef.current;
      const l = locRef.current;
      if (!r) return;
      if ((dir === 'next' && l?.atEnd) || (dir === 'prev' && l?.atStart)) return;
      setPopup(null);
      await (dir === 'next' ? r.next() : r.prev());
      if (!reducedMotion()) {
        // Visual direction flips for right-to-left books.
        const sign = (dir === 'next') !== rtlRef.current ? 1 : -1;
        viewerRef.current?.animate(
          [
            { opacity: 0.35, transform: `translateX(${sign * 18}px)` },
            { opacity: 1, transform: 'none' },
          ],
          { duration: 280, easing: 'cubic-bezier(.2,.8,.2,1)' },
        );
      }
    }, []);

    const goLeft = useCallback(() => turn(rtlRef.current ? 'next' : 'prev'), [turn]);
    const goRight = useCallback(() => turn(rtlRef.current ? 'prev' : 'next'), [turn]);

    // Resolves to true on success so callers can fall back.
    const goTo = useCallback(async (target) => {
      const r = rendRef.current;
      if (!r || target == null) return false;
      setPopup(null);
      try {
        await r.display(target);
        return true;
      } catch (err) {
        console.warn('Navigation failed', err);
        return false;
      }
    }, []);

    async function navigate(dest) {
      setSidebarTab(null);
      if (dest.type !== 'toc') {
        goTo(dest.cfi);
        return;
      }
      const { item } = dest;
      const ok = item.href && (await goTo(item.href));
      if (!ok && item.spineIndex >= 0) goTo(item.spineIndex);
    }

    function seek(pct) {
      const book = bookRef.current;
      if (!book?.locations.length()) return;
      goTo(book.locations.cfiFromPercentage(clamp(pct, 0, 1)));
    }

    // Click/tap on the outer 20% of the page turns it.
    function tapAt(clientX) {
      if (popupRef.current) {
        setPopup(null);
        return;
      }
      const rect = stageRef.current?.getBoundingClientRect();
      if (!rect) return;
      const rel = (clientX - rect.left) / rect.width;
      if (rel < 0.2) goLeft();
      else if (rel > 0.8) goRight();
      else poke();
    }

    // ---------- Bookmarks ----------
    const currentBookmark = loc ? bookmarks.find((b) => cfiInRange(b.cfi, loc.cfi, loc.endCfi)) : null;

    function excerptAt(cfi) {
      try {
        const range = rendRef.current.getRange(cfi);
        const node = range.startContainer;
        const text = node.nodeType === 3 ? node.textContent.slice(range.startOffset) : node.textContent;
        return (text || '').replace(/\s+/g, ' ').trim().slice(0, 140);
      } catch {
        return '';
      }
    }

    function toggleBookmark() {
      const l = locRef.current;
      if (!l) return;
      if (currentBookmark) {
        db.bookmarks.delete(currentBookmark.id);
      } else {
        db.bookmarks.add({
          id: uid(),
          bookId,
          cfi: l.cfi,
          chapter: l.chapter,
          percentage: l.percentage,
          excerpt: excerptAt(l.cfi),
          createdAt: Date.now(),
        });
      }
    }

    // ---------- Highlights ----------
    function clearIframeSelection() {
      try {
        popupRef.current?.contents?.window.getSelection().removeAllRanges();
      } catch {
        /* ignore */
      }
    }

    async function createHighlight(color, withNote = false) {
      const p = popupRef.current;
      if (!p) return;
      const existing = highlights.find((h) => h.cfiRange === p.cfiRange);
      if (existing) {
        await recolor(existing, color);
        return;
      }
      const h = {
        id: uid(),
        bookId,
        cfiRange: p.cfiRange,
        text: p.text.slice(0, 4000),
        color,
        note: '',
        chapter: locRef.current?.chapter || '',
        createdAt: Date.now(),
      };
      await db.highlights.add(h);
      addHighlightMark(h);
      clearIframeSelection();
      setPopup(null);
      if (withNote) setNoteFor(h);
    }

    async function recolor(h, color) {
      try {
        rendRef.current?.annotations.remove(h.cfiRange, 'highlight');
      } catch {
        /* ignore */
      }
      addHighlightMark({ ...h, color });
      await db.highlights.update(h.id, { color });
      clearIframeSelection();
      setPopup(null);
    }

    async function deleteHighlight(h) {
      try {
        rendRef.current?.annotations.remove(h.cfiRange, 'highlight');
      } catch {
        /* ignore */
      }
      await db.highlights.delete(h.id);
      setPopup(null);
    }

    async function openHighlight(id) {
      hlClickAt.current = Date.now();
      const h = await db.highlights.get(id);
      if (!h) return;
      const spinePos = new EpubCFI(h.cfiRange).spinePos;
      const contents = rendRef.current?.getContents().find((c) => c.sectionIndex === spinePos);
      const rect = contents && rectFromContents(contents, h.cfiRange);
      if (rect) setPopup({ mode: 'existing', highlight: h, cfiRange: h.cfiRange, text: h.text, rect });
    }

    // ---------- Search ----------
    function jumpToSearchHit(cfi) {
      const r = rendRef.current;
      if (!r) return;
      if (searchMarkRef.current) r.annotations.remove(searchMarkRef.current, 'underline');
      searchMarkRef.current = cfi;
      r.annotations.underline(cfi, {}, null, 'rd-search', {
        stroke: '#ff9f0a',
        'stroke-width': '2',
        'stroke-opacity': '0.95',
      });
      goTo(cfi);
    }

    const closeSearch = useCallback(() => {
      setSearchOpen(false);
      if (searchMarkRef.current) {
        rendRef.current?.annotations.remove(searchMarkRef.current, 'underline');
        searchMarkRef.current = null;
      }
    }, []);

    // ---------- Panels ----------
    const toggleSidebar = (tab) => {
      setSearchOpen(false);
      setSidebarTab((cur) => (cur === tab ? null : tab));
    };
    const openSearch = () => {
      setSidebarTab(null);
      setSearchOpen(true);
    };

    // Esc closes the top-most layer first.
    function closeTopmost() {
      if (popupRef.current) {
        clearIframeSelection();
        setPopup(null);
      } else if (noteFor) setNoteFor(null);
      else if (appearanceOpen) setAppearanceOpen(false);
      else if (searchOpen) closeSearch();
      else if (sidebarTab) setSidebarTab(null);
    }

    // ---------- Input handlers (refreshed every render, called by long-lived listeners) ----------
    handlers.current = {
      poke,
      openHighlight,
      onRelocated(location) {
        if (!bookRef.current || !location?.start) return;
        const d = describe(location);
        locRef.current = d;
        setLoc(d);
      },
      onSelected(cfiRange, contents) {
        const text = contents.window.getSelection()?.toString().trim();
        const rect = rectFromContents(contents, cfiRange);
        if (!text || !rect) return;
        setPopup({ mode: 'new', cfiRange, text, rect, contents });
      },
      onFrameClick(e) {
        // Defer so a highlight's own click handler can claim the event first.
        setTimeout(() => {
          if (Date.now() - hlClickAt.current < 300) return;
          const sel = e.view?.getSelection?.();
          if (sel && !sel.isCollapsed) return;
          if (e.target?.closest?.('a')) return;
          setAppearanceOpen(false);
          const frame = e.view?.frameElement?.getBoundingClientRect();
          tapAt((frame?.left ?? 0) + e.clientX);
        }, 0);
      },
      onWheel(e) {
        // Horizontal trackpad swipe → page turn; momentum is absorbed by a short lock.
        if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
        const w = wheelRef.current;
        const now = Date.now();
        if (now < w.lockUntil) {
          w.lockUntil = now + 180;
          return;
        }
        if (now - w.last > 250) w.acc = 0;
        w.last = now;
        w.acc += e.deltaX;
        if (Math.abs(w.acc) > 60) {
          turn(w.acc > 0 ? 'next' : 'prev');
          w.acc = 0;
          w.lockUntil = now + 500;
        }
      },
      onTouchStart(e) {
        const t = e.changedTouches?.[0];
        if (t) touchRef.current = { x: t.screenX, y: t.screenY, time: Date.now() };
      },
      onTouchEnd(e) {
        const start = touchRef.current;
        const t = e.changedTouches?.[0];
        touchRef.current = null;
        if (!start || !t) return;
        const dx = t.screenX - start.x;
        const dy = t.screenY - start.y;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5 && Date.now() - start.time < 700) {
          if (dx < 0) goRight();
          else goLeft();
        }
      },
      onKey(e) {
        const target = e.target;
        const typing = /^(input|textarea|select)$/i.test(target?.tagName || '') || target?.isContentEditable;
        const mod = e.metaKey || e.ctrlKey;
        const key = e.key;

        if (mod && key.toLowerCase() === 'f') {
          e.preventDefault();
          openSearch();
          return;
        }
        if (key === 'Escape') {
          closeTopmost();
          return;
        }
        if (typing || mod || e.altKey || noteFor) return;

        switch (key) {
          case 'ArrowLeft':
            e.preventDefault();
            goLeft();
            break;
          case 'ArrowRight':
            e.preventDefault();
            goRight();
            break;
          case 't':
          case 'T':
            toggleSidebar('toc');
            break;
          case 'f':
          case 'F':
            e.preventDefault();
            openSearch();
            break;
          case 'b':
          case 'B':
            toggleBookmark();
            break;
          case 'd':
          case 'D':
            update({ theme: PAGE_THEMES[resolvedTheme].dark ? 'light' : 'dark' });
            break;
          case '+':
          case '=':
            update((s) => ({ fontSize: clamp(s.fontSize + FONT_SIZE.step, FONT_SIZE.min, FONT_SIZE.max) }));
            break;
          case '-':
          case '_':
            update((s) => ({ fontSize: clamp(s.fontSize - FONT_SIZE.step, FONT_SIZE.min, FONT_SIZE.max) }));
            break;
          default:
        }
      },
    };

    useEffect(() => {
      const onKey = (e) => handlers.current.onKey(e);
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, []);

    // ---------- Render ----------
    const activeTocIndex = loc ? tocIndexFor(toc, loc.index) : -1;
    const margin = MARGINS[settings.margin] ?? MARGINS.normal;

    return html`
      <div className="fixed inset-0 overflow-hidden bg-canvas text-ink" onMouseMove=${poke}>
        <${Toolbar}
          visible=${showChrome}
          title=${record?.title || ''}
          bookmarked=${!!currentBookmark}
          sidebarTab=${sidebarTab}
          searchOpen=${searchOpen}
          appearanceOpen=${appearanceOpen}
          onBack=${onExit}
          onToc=${() => toggleSidebar('toc')}
          onSearch=${() => (searchOpen ? closeSearch() : openSearch())}
          onHighlights=${() => toggleSidebar('highlights')}
          onBookmark=${toggleBookmark}
          onToggleAppearance=${() => setAppearanceOpen((o) => !o)}
          onCloseAppearance=${() => setAppearanceOpen(false)}
          onHover=${setHoverChrome}
        />

        <!-- Reading area. Fixed top/bottom insets so hiding the chrome never re-paginates. -->
        <main
          ref=${stageRef}
          className="absolute inset-x-0 bottom-14 top-14"
          style=${{ paddingLeft: margin, paddingRight: margin }}
          onClick=${(e) => {
            if (e.target.closest('button')) return;
            setAppearanceOpen(false);
            tapAt(e.clientX);
          }}
          onWheel=${(e) => handlers.current.onWheel(e)}
        >
          <div
            ref=${viewerRef}
            className=${`mx-auto h-full w-full max-w-[1400px] transition-opacity duration-300 ${
              status === 'ready' ? 'opacity-100' : 'opacity-0'
            }`}
            aria-label=${record ? `${record.title} — book content` : 'Book content'}
            role="region"
          />
        </main>

        ${status === 'loading' &&
        html`
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-sm text-muted" role="status">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            Opening book…
          </div>
        `}

        ${status === 'error' &&
        html`
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-canvas p-6" role="alert">
            <div className="max-w-sm text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/15 text-red-500">
                <${Icon} name="alert" size=${24} />
              </div>
              <h2 className="text-base font-semibold">This book couldn’t be opened</h2>
              <p className="mt-1.5 text-sm text-muted">${error}</p>
              <button className="btn-primary mt-5" onClick=${onExit} autoFocus>Back to Library</button>
            </div>
          </div>
        `}

        <${BottomBar}
          visible=${showChrome && status === 'ready'}
          loc=${loc}
          locationsReady=${locationsReady}
          onSeek=${seek}
          onHover=${setHoverChrome}
        />

        <${Sidebar}
          tab=${sidebarTab}
          onTab=${setSidebarTab}
          onClose=${() => setSidebarTab(null)}
          title=${record?.title || ''}
          toc=${toc}
          activeTocIndex=${activeTocIndex}
          bookmarks=${bookmarks}
          highlights=${highlights}
          onNavigate=${navigate}
          onDeleteBookmark=${(b) => db.bookmarks.delete(b.id)}
          onDeleteHighlight=${deleteHighlight}
          onEditNote=${(h) => setNoteFor(h)}
        />

        <${SearchPanel}
          open=${searchOpen}
          onClose=${closeSearch}
          getBook=${() => bookRef.current}
          chapterFor=${chapterFor}
          onJump=${jumpToSearchHit}
        />

        <${SelectionPopup}
          popup=${popup}
          onColor=${(color) => (popup?.mode === 'existing' ? recolor(popup.highlight, color) : createHighlight(color))}
          onNote=${() => {
            if (popup?.mode === 'existing') {
              setNoteFor(popup.highlight);
              setPopup(null);
            } else {
              createHighlight('yellow', true);
            }
          }}
          onCopy=${() => {
            navigator.clipboard?.writeText(popup.text).catch(() => {});
            clearIframeSelection();
            setPopup(null);
          }}
          onLookup=${() => {
            const q = popup.text.trim().split(/\s+/).length <= 3 ? `define ${popup.text}` : popup.text;
            window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`, '_blank', 'noopener,noreferrer');
            setPopup(null);
          }}
          onDelete=${() => popup?.highlight && deleteHighlight(popup.highlight)}
        />

        ${noteFor &&
        html`
          <${NoteDialog}
            highlight=${noteFor}
            onClose=${() => setNoteFor(null)}
            onSave=${async (note) => {
              await db.highlights.update(noteFor.id, { note: note.trim() });
              setNoteFor(null);
            }}
          />
        `}
      </div>
    `;
  }

  Books.Reader = Reader;
})();
