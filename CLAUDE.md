# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Local development (requires Ruby 3.2.2 + Bundler):**
```bash
bundle install      # Install Ruby gems
npm install         # Install JS test dependencies
bundle exec jekyll serve  # Run site at http://localhost:4000
```

**Testing (Jest):**
```bash
npm test                  # Run all tests once
npm run test:watch        # Run tests in watch mode
```

To run a single test file: `npx jest assets/js/game.test.js`

## Architecture

**Jekyll static site** deployed to GitHub Pages via the `github-pages` gem. The main layout is `_layouts/default.html` (Liquid templating); nav links are configured in `_config.yml` under `site.nav`.

**Pages:**
- `index.html` — Blog post list (paginated) + tile game mount point (`<div id="game">`)
- `japanese.html` — Standalone HTML page (`layout: null`), no Jekyll layout; all CSS is self-contained inline. Tabbed interface covering hiragana and katakana at `/japanese/`.
- `_posts/` — Markdown blog posts

**JavaScript (ES modules, loaded directly in HTML):**
- `assets/js/game.js` — `TileGame` class: 3×3 tile puzzle rendered on a `<canvas>` element. Injects its own HTML/CSS into a container div. Manages game state (grid, moves, best score via `localStorage`). Activated via URL hash `#game`.
- `assets/js/games/menu.js` — `GameMenu` class: in-progress game selection menu. Partially implemented; see `assets/js/GAME_MENU_PLAN.md` for the planned state machine and integration steps (the menu is not yet wired into `index.html`).
- `assets/js/games/tile-game/` — Future home for the tile game once the menu refactor is complete.

**Testing setup:** Jest + jsdom (browser environment). Babel (`babel.config.js`) transpiles ES modules for Node. Test files live alongside source as `*.test.js`. `jest.setup.js` bootstraps the test environment.

**Styles:** `_sass/` compiled by Jekyll's SASS pipeline (`styles.scss` is the entrypoint). The JS game components inject their own styles into `<head>` at runtime.

### Module loading

ES modules are loaded directly via `<script type="module">` tags in HTML — there is no Webpack, Vite, or any other bundler. This is intentional: browser-native ES modules are sufficient for this site's scale, and adding a build step would only add friction. Do not introduce a bundler. If you need a third-party library, prefer a CDN `<script>` tag in the layout (consistent with how `canvas-confetti` is loaded today).
