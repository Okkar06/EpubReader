# Books — a local EPUB reader

An EPUB reader for desktop and iPhone that runs entirely in your browser, inspired by Apple Books on macOS.
There is no backend: books, covers, progress, bookmarks, highlights and settings are stored in IndexedDB on your device.

**Nothing to install.** No Node.js, no npm, no build step. All libraries are already in the `vendor/` folder, so the app also works offline.

## On iPhone / iPad

The app is published with GitHub Pages at **https://okkar06.github.io/EpubReader/**. Every `git push` to `main` redeploys it, usually within a minute or two.

1. Open the link in **Safari**.
2. Tap **Share → Add to Home Screen**.
3. Launch **Books** from the Home Screen. It runs full-screen like an app and works offline.

Books are stored on the device you add them on. Your iPhone and your computer each keep their own library.

## Running it

**Option 1: open the file.** Double-click `index.html` to open it in Edge or Chrome.

**Option 2: local server (recommended for daily use).** Double-click `Start Reader.cmd`. It runs `serve.ps1`, a small static server built on the .NET `HttpListener` that ships with Windows, and opens http://localhost:8080. Press Ctrl+C in its window to stop it.

Use one option consistently. The browser keeps a separate library for `file://` and for `http://localhost:8080`, so books added in one won't appear in the other.

If corporate policy blocks PowerShell scripts, use option 1, or open the folder with VS Code's Live Server extension.

## Features

### Library
- Cover grid with title, author and a thin progress indicator (`New`, `42%`, `Finished`)
- **Continue Reading** row (most recently opened) and **All Books**
- Import one or more `.epub` files with **Add Book**, or drag them anywhere onto the window
- Title, author and cover read from EPUB metadata; covers are downscaled for a fast grid; books without a cover get a generated one
- Search by title or author; sort by Recent, Title or Author
- Right-click or the `…` menu: Open, Mark as Finished / Unread, Remove
- Clear per-file error messages for invalid, damaged, duplicate or oversized (>300 MB) files

### Reader
- Paginated layout with single-page and two-page modes; switches automatically by window width, or set it in the Aa panel
- Turn pages with ← / →, by clicking the left or right page edges, or with horizontal trackpad or touch swipes; a subtle slide animation plays on each turn
- Auto-hiding translucent top toolbar: Library, Contents, Search, Appearance (Aa), Highlights & Notes, Bookmark
- Bottom bar: chapter title, pages left in the chapter, slim progress slider, page number and percentage
- Your last position in each book is saved and restored when you reopen it
- Page numbers are computed once per book in the background and cached

### Appearance ("Aa")
- Themes: Light, Sepia, Gray, Dark (#1c1c1e background with soft #e5e5e7 text) and Auto (follows the system)
- Text size, font (Original, Georgia, Palatino, Charter, System Sans, Serif), line spacing, margins, justified or left alignment, page layout
- Theme colours are forced inside the book's own page, so publisher CSS can't produce dark text on a dark background; images are dimmed slightly in dark themes
- All settings persist across sessions

### Navigation and annotations
- Left sidebar with **Contents**, **Bookmarks** and **Highlights** tabs
- Selecting text shows a popup: highlight in yellow, green, blue, pink or purple; add a note; copy; look up
- Click an existing highlight to change its colour, edit its note or delete it
- Highlights are saved and redrawn when you reopen the book
- Full-text search across the book, with results that appear as it searches and jump-to-result

### Keyboard shortcuts

| Key | Action |
| --- | --- |
| ← / → | Previous / next page |
| T | Table of contents |
| F or Ctrl/Cmd+F | Search in book |
| B | Toggle bookmark on the current page |
| D | Toggle dark mode |
| + / − | Increase / decrease font size |
| Esc | Close the top-most popup or panel |
| / | Focus library search (library view) |
| Ctrl/Cmd+O | Add books (library view) |

## How it works without a build step

- Components use [htm](https://github.com/developit/htm), JSX-like tagged templates that the browser runs directly:
  `` html`<${Icon} name="search" />` `` instead of `<Icon name="search" />`.
- Each file in `src/` is a plain `<script>` that adds its exports to one global `Books` object. Load order is set in `index.html`.
- Tailwind runs in the browser from `vendor/tailwind.js` and is configured in `src/tailwind.config.js`. Shared component styles and theme colours are in `src/styles.css`.

## Project structure

```
index.html                     Loads vendor libraries, then the app scripts in order
manifest.webmanifest, sw.js    Installable app (Add to Home Screen) and offline cache
icons/                         Home Screen icons
Start Reader.cmd, serve.ps1    Optional local server (no installs)
vendor/                        React 18.3.1, ReactDOM, htm 3.1.1, Dexie 4.0.8, JSZip 3.10.1, epub.js 0.3.93, Tailwind 3.4.17
src/
├─ styles.css                  Theme tokens (CSS variables) and shared component styles
├─ tailwind.config.js          Tailwind theme (colours mapped to the CSS variables)
├─ main.js, App.js             Entry point and hash routing (#/ and #/book/<id>)
├─ db/db.js                    Dexie schema: books, files, bookmarks, highlights, settings
├─ lib/
│  ├─ globals.js               Books namespace, htm binding, useLiveQuery, useObjectUrl
│  ├─ settings.js              Settings context (persisted; applies the UI theme)
│  ├─ readerTheme.js           Page themes, fonts, CSS injected into book pages
│  ├─ importBook.js            EPUB validation, metadata and cover extraction
│  ├─ search.js                Full-text search, one section at a time
│  └─ util.js
└─ components/
   ├─ ui/                      Icon, IconButton, Segmented
   ├─ library/                 Library, BookCard, ContinueCard, BookMenu, ConfirmDialog, GeneratedCover
   └─ reader/                  Reader, Toolbar, AppearancePopover, BottomBar, Sidebar,
                               SearchPanel, SelectionPopup, NoteDialog
```

## Notes
- Books that contain scripts are displayed with scripting disabled.
- Data lives in your browser profile; clearing site data removes your library.
- "Look Up" opens a web search in a new tab. That is the only time selected text leaves your device, and only when you click it.
- The browser console shows a warning that the Tailwind CDN script "should not be used in production". It's harmless for a local app.
