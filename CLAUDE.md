# Terra Quest

Jogo de geografia com 195 paises, 27 estados BR, 51 estados US e 9 modos de jogo.

## Stack

- **Frontend:** Vanilla JS (ES modules), CSS3, HTML5
- **Build:** Vite 6
- **Maps:** D3.js v7 + TopoJSON (CDN)
- **Deploy:** Docker + Nginx + Let's Encrypt

## Commands

```bash
npm run dev      # Dev server (port 3000)
npm run build    # Production build -> dist/
npm run preview  # Preview production build
```

## Project Structure

```
src/
  index.html              # HTML shell + meta tags
  css/styles.css          # All styles (themes, animations, responsive)
  js/
    app.js                # Entry point
    state.js              # Shared mutable state + DOM refs
    data/                 # Game data (countries, aliases, states)
    utils/                # Pure helpers (normalize, dom, storage, shuffle)
    map/                  # D3 map initialization (world, states)
    modes/                # Game mode logic (type, click, flags, capitals, languages, states)
    ui/                   # UI logic (theme, celebration, navigation, score)
public/
  globo.png               # Globe logo
  manifest.json           # PWA manifest
  sw.js                   # Service worker
```

## Conventions

- All JS uses ES module imports (no CommonJS)
- Shared state lives in `state.js` - modules import and mutate properties
- DOM manipulation uses safe methods (textContent, createElement) - no innerHTML
- localStorage wrapped in try-catch via `utils/storage.js`
- User input limited to 100 chars and normalized via `utils/normalize.js`

## NEVER

- Use innerHTML with user-controlled or dynamic content
- Skip error handling on D3.json/fetch calls
- Commit .env files or secrets
- Push --force to main

## ALWAYS

- Use createEl/clearChildren from utils/dom.js for DOM manipulation
- Wrap localStorage in safeGetItem/safeSetItem
- Validate API responses before processing
- Test all 9 game modes after changes
