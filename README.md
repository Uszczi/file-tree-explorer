# FileTree Explorer

A small developer tool that visualises a directory structure described as JSON. Paste or upload
the JSON, then browse it as a tree, inspect files and folders, and search the whole tree.

Built with React 19, TypeScript (strict), React Router 6, Vite and Tailwind CSS.

## Getting started

Requires Node.js 18 or newer (checked on 18.20 and 24).

```bash
npm install && npm run dev
```

Then open the URL Vite prints (by default http://localhost:5173). The home page has built-in
examples, including invalid ones, so you can try the app without preparing a file.

| Script                                    | What it does                                          |
| ----------------------------------------- | ----------------------------------------------------- |
| `npm run dev`                             | Development server                                    |
| `npm run build`                           | Type-check (`tsc -b`) and production build            |
| `npm run preview`                         | Serve the production build                            |
| `npm test`                                | Unit tests in watch mode (`npx vitest run` runs once) |
| `npm run test:e2e`                        | End-to-end tests (Playwright, against the prod build) |
| `npm run lint`                            | Lint (oxlint)                                         |
| `npm run format` / `npm run format:check` | Format / check formatting (Prettier)                  |

The E2E tests need a browser once: `npx playwright install chromium`.

If you use [`just`](https://github.com/casey/just), the `justfile` adds a few shortcuts:
`just clean` removes build output, test reports and tool caches, `just clean-all` also removes
`node_modules`, `just check` runs the same checks as CI (lint, formatting, types, unit tests),
and `just zip` packs the committed project, including its Git history, into
`../file-tree-explorer.zip`. `just` is optional.

## Features

| Route             | Description                                                                   |
| ----------------- | ----------------------------------------------------------------------------- |
| `/`               | Paste JSON, upload or drop a `.json` file, or pick an example                 |
| `/tree`           | Tree view with expand/collapse; the right-hand panel shows the root's details |
| `/tree/:nodePath` | Details of a node; `nodePath` is the URL-encoded path, e.g. `src%2Findex.ts`  |

- A file's details show its name, size (B / KB / MB / GB, base 1024, exact bytes on hover) and
  full path.
- A folder's details show its name, the number of direct children, the total size of all files
  in the subtree, and a table of children with links.
- Search finds names across the whole tree with fuzzy matching and shows each result's full
  path. The query lives in the URL (`?q=`), so results survive a reload and back/forward
  navigation. <kbd>Esc</kbd> clears it.
- Breadcrumbs, keyboard navigation in the tree (arrows, Home, End, Enter), and a light or dark
  theme that follows the system setting.

### Input format

```json
{
  "name": "root",
  "type": "folder",
  "children": [{ "name": "index.ts", "type": "file", "size": 1024 }]
}
```

Validation rules: names must be non-blank, must not contain `/` and must not be `.` or `..`;
`size` must be a non-negative integer; a folder without `children` counts as empty; two siblings
with the same name are an error, since paths must be unique (the check is case-sensitive, so
`README.md` and `readme.md` can coexist). Each error names the exact location, e.g.
`children[2].size`, and the app lists at most 50. The validator ignores unknown fields.

## Architecture and decisions

- **Logic separate from UI.** Everything about trees lives in `src/lib/tree` as pure, tested
  functions with no React. Components only render and connect those functions to the UI.
- **Flat index.** After loading, the app walks the tree once and builds a
  `Map<path, IndexedNode>` holding each node's path, parent path, depth and subtree size. A
  details page is an O(1) lookup, and the app computes folder sizes once in O(n) (summed in
  reverse pre-order) instead of on every render.
- **Iterative algorithms.** The input may be nested arbitrarily deep, so validation, indexing,
  building visible rows and serialisation use explicit stacks instead of recursion. Tests cover a
  tree 10 000 levels deep.
- **Hand-written validation instead of Zod.** Zod validates recursively, which would overflow
  the stack on deep inputs. The validator collects all errors (up to 50) with their JSON paths.
- **Paths and URLs.** A node's path is its names joined with `/`, without the root
  (`src/components/Button.tsx`); the root's path is empty. The app encodes the whole path with
  `encodeURIComponent` into a single route segment (`/tree/src%2Fcomponents%2FButton.tsx`).
  React Router decodes it once, so the app never decodes it again. The details page shows the
  path prefixed with the root's name (`root/src/components/Button.tsx`).
- **URL as the source of truth for search.** The search box writes `?q=` after a 250 ms pause
  using `replace`, so it doesn't flood the history. Links to nodes keep the query string, so an
  active search survives navigation. While a search is active, the app hides the tree without
  unmounting it, so expanded folders stay expanded, and shows a result list instead.
- **fzf-style search.** The assignment asks for search by name. I used the
  [`fzf`](https://github.com/ajitid/fzf-for-js) library (a port of fzf's v2 algorithm), so `btn`
  finds `Button.tsx`, results are ranked by relevance, diacritics are ignored and fzf's extended
  syntax works (`'exact`, `^prefix`, `suffix$`, `!not`, `a | b`). Search matches names only, as
  the assignment says, and renders at most 100 results along with the total count.
- **State.** A single React Context holds the index. The app is small enough that it needs no
  state library.
- **Persistence in IndexedDB.** The app saves the loaded tree so a reload on any URL works. I
  chose IndexedDB because `localStorage` has a limit of about 5 MB. The app stores the tree as
  JSON text (serialised iteratively) and validates it again when reading it back. Reading is
  async, so the app shows a short loading state until it knows whether a saved tree exists. If
  saving fails, the tree keeps working in memory and a banner warns that a reload will lose it.
- **Tree view.** The tree view flattens the expanded part of the tree into a list of indented
  rows instead of rendering recursive components. Keyboard navigation then only moves one row up
  or down the list, and virtualisation is easy to add later. The view follows the ARIA tree
  pattern with a roving tabindex.
- **Node 18 support.** Newer versions of Vite, Vitest, Tailwind, oxlint and Playwright require
  Node 20+, so I pinned them to the last versions that run on Node 18 (Vite 6, Vitest 3,
  Tailwind 4.1, oxlint 1.16, Playwright 1.61).
- **Tests.** Unit tests (Vitest) cover the tree logic and storage. E2E tests (Playwright) cover
  the user flows against the production build. CI runs lint, formatting, types and unit tests on
  Node 18 and 24, plus the E2E suite (Chromium, Node 24).

### Project structure

```text
src/
  lib/tree/     pure logic: types, validation, index, paths, search, storage, formatting
  state/        React Context with the loaded tree and its persistence
  pages/        route components (home, tree layout, node details, errors)
  components/   tree view, search panel, breadcrumbs, examples, shared UI classes
e2e/            Playwright tests
scripts/        generator for large test files (Node 22.18+)
```

## What I would do with more time

- Virtualise the tree view and the result list (e.g. `react-window`).
- Parse, validate and index large files in a Web Worker, so the UI stays responsive.
- Use a splat route (`/tree/*`) with each path segment encoded separately, so readable URLs like
  `/tree/src/components/Button.tsx` work and names containing `%2F` are reachable.
- Offer a plain "exact name" search mode next to the fzf syntax, and an option to search full
  paths.
- Component tests with React Testing Library, and sorting the folder contents table.
- Sync the loaded tree between browser tabs, and deploy a live demo (e.g. GitHub Pages).

## Known limitations

- **Very large trees are slow.** Without virtualisation, "Expand all" on about 100 000 nodes
  takes several seconds, and so does searching them.
- **Extreme depth uses a lot of memory.** Every node stores its full path, so memory grows with
  the square of the depth. Measured in Node, a tree 10 000 levels deep uses about 200 MB and one
  30 000 levels deep about 2 GB. Somewhere around 50 000 levels the app runs out of memory.
- **Unencoded URLs don't work.** A path such as `/tree/src/components/Button.tsx` shows "Page
  not found", and a name that literally contains `%2F` cannot be opened.
- **Some queries are read as operators.** Because of the fzf syntax, a query starting with `!`,
  `^` or `'` or ending with `$` is an operator, and a query with an uppercase letter is
  case-sensitive.
- **Links only work where the tree is loaded.** The tree is stored in this browser only, so a
  `/tree/...` link opened elsewhere (or after closing the tree) redirects to the home page and
  does not return to the linked node once a tree is loaded.
- **Saving is asynchronous.** Reloading in the same instant as clicking "Load tree" can lose the
  save.
- Sizes must be whole numbers of bytes, and duplicate names in one folder are rejected. The
  validator accepts sizes above `Number.MAX_SAFE_INTEGER`, but their sums lose precision.
- The app uses React 19 APIs (`<Context value>`, `<title>` in components), so it would need small
  changes to run on React 18.
- `npm audit` reports advisories that can't be fixed while supporting Node 18:
  - React Router 6 has moderate advisories, the only ones in production code. They cover SSR
    error hydration and unencoded backslashes in links, and this app uses neither. The fix is
    React Router 7, which needs Node 20+ (and the assignment asks for v6).
  - Vitest 3 and its `tinypool` dependency have moderate and critical advisories. Both are
    dev-only test tools that never ship to the browser. The patched versions (Vitest 5,
    tinypool 2.1.2+) need Node 20+, and the tinypool 1.x line used by Vitest 3 has no patched
    release.
- oxlint 1.16 (the last version supporting Node 18) has no `react/only-export-components` rule.
