# 🔷 Polysnaps

**Snap. Flow. Grow.**

An incremental idle game where you build networks of geometric shapes. Resources flow inward from outer shapes toward your core. Prestige to evolve your core shape — more sides, more connections, more production.

## Tech Stack

- **SvelteKit** (adapter-static, SPA)
- **JavaScript**
- **PixiJS** (2D rendering)
- **Tauri v2** (Steam + Mobile packaging)
- **Supabase** (backend, auth, events, realtime)

## Getting Started

```bash
# install dependencies
npm install

# start dev server
npm run dev

# build for production
npm run build

# preview production build
npm run preview
```

## Project Structure

```
polysnaps/
├── .cursor/rules/          # Shared AI rules for vibecoding
├── src/
│   ├── lib/
│   │   ├── components/     # Svelte components
│   │   ├── game/           # Core game engine & state
│   │   ├── pixi/           # PixiJS rendering (TODO)
│   │   ├── supabase/       # Supabase client (TODO)
│   │   └── utils/          # Helpers (formatting, etc.)
│   ├── routes/             # SvelteKit pages
│   ├── app.css             # Global styles
│   └── app.html            # HTML template
├── static/assets/          # Sprites, audio, fonts
├── supabase/               # Backend (TODO)
├── docs/                   # Game plan & architecture
├── GAME_DESIGN.md          # The game bible
└── README.md
```

## Docs

- [Game Design Document](./GAME_DESIGN.md) — full game concept and mechanics
- [Project Plan](./docs/GAME_PLAN.md) — tech stack, tools, timeline

## Team

Built by [SidesQuest](https://github.com/SidesQuest) — Luca & Steen
