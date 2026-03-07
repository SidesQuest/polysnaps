# 🎮 POLYSNAPS — Project Plan
# *Snap. Flow. Grow.*
## Luca x Steen

> **Date:** March 6, 2026
> **Authors:** Luca Vandenweghe & Maarten "Steen" De Rammelaere
> **Status:** Tech Stack Decided — Ready to Start

---

```
 ██████╗  █████╗ ███╗   ███╗███████╗    ██████╗ ██╗      █████╗ ███╗   ██╗
██╔════╝ ██╔══██╗████╗ ████║██╔════╝    ██╔══██╗██║     ██╔══██╗████╗  ██║
██║  ███╗███████║██╔████╔██║█████╗      ██████╔╝██║     ███████║██╔██╗ ██║
██║   ██║██╔══██║██║╚██╔╝██║██╔══╝      ██╔═══╝ ██║     ██╔══██║██║╚██╗██║
╚██████╔╝██║  ██║██║ ╚═╝ ██║███████╗    ██║     ███████╗██║  ██║██║ ╚████║
 ╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝    ╚═╝     ╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝
```

---

## What We're Making

An **incremental / idle game** with:

- Simple 2D retro pixel art style
- Steam release (PC)
- Mobile release (Android + iOS)
- Web version (play in browser)
- Live events system
- Online features (database, player accounts, leaderboards)

**Game concept:** Geometric idle factory-builder. Place shapes that snap together edge-to-edge, resources flow inward to your core. Prestige to evolve your core shape (more sides = more branches = more production). Explore the fog, discover buff zones, complete shape combos, and build the ultimate geometric network.

**Full concept:** See [GAME_DESIGN.md](./GAME_DESIGN.md)

---

## Dev Philosophy

- **Vibecoding with AI** as much as possible
- Both of us use AI assistants (Cursor) with **shared project rules** so our AIs are aligned
- Keep it fun, keep it scrappy, ship fast
- Build as a web app first → package for Steam & mobile when the game is solid

---

## Tech Stack (Final)

```
┌──────────────────────────────────────────────┐
│              The Game (SPA)                   │
│                                              │
│   SvelteKit              PixiJS              │
│   ┌────────────────┐  ┌────────────────┐     │
│   │  All UI:       │  │  2D rendering: │     │
│   │  upgrades,     │  │  sprites,      │     │
│   │  menus, tabs,  │  │  animations,   │     │
│   │  tooltips,     │  │  particles,    │     │
│   │  numbers,      │  │  pixel art,    │     │
│   │  progress bars │  │  retro visuals │     │
│   └────────────────┘  └────────────────┘     │
│                                              │
│           Supabase JS SDK                    │
│   (auth, database, realtime, edge functions) │
└──────┬──────────────┬──────────────┬─────────┘
       │              │              │
   Browser        Tauri v2       Tauri v2
   (web)        (Steam/PC)    (Android/iOS)
```

| Layer | Tech | Why |
|-------|------|-----|
| **Framework** | SvelteKit + adapter-static (SPA) | Svelte's reactivity is perfect for idle games — `$state` and `$derived` map directly to "values that change and update the UI." 30-40% less code than React. Compiles to vanilla JS (~2KB runtime). Both of us learn it together. |
| **Language** | JavaScript | Our preference. TypeScript optional if we want it later. |
| **2D rendering** | PixiJS | Lightweight WebGL renderer for sprites, animations, particles. Mounted in a canvas element, Svelte handles everything around it. |
| **Backend** | Supabase | PostgreSQL + Auth + Realtime + Edge Functions. Free tier. Steen knows SQL. |
| **Desktop packaging** | Tauri v2 | Wraps our SPA in a native window. ~10-15MB builds (vs Electron's 150MB+). No Rust knowledge needed — just a config file. |
| **Mobile packaging** | Tauri v2 (or Capacitor as fallback) | Same SPA, wrapped as a native mobile app. |
| **Steam integration** | steamworks.js | JS bindings for Steamworks API (achievements, cloud saves, overlay). |
| **Version control** | GitHub | Both have `gh` CLI set up. Issues + Projects for task tracking. |
| **AI/Vibecoding** | Cursor | Shared `.cursor/rules/` in the repo so both our AIs are in sync. |

### Why Svelte over React/Vue/Solid?

Idle games are fundamentally about **reactive state** — hundreds of interconnected values that constantly update the UI. Here's what the same game tick looks like:

**Svelte:**
```svelte
<script>
  let gold = $state(0);
  let generators = $state(1);
  let multiplier = $state(1);
  let goldPerSec = $derived(generators * multiplier);

  setInterval(() => gold += goldPerSec, 1000);
</script>

<p>Gold: {formatNumber(gold)}</p>
<p>Per second: {formatNumber(goldPerSec)}</p>
```

When `gold` changes, Svelte updates ONLY the text node that displays it. No virtual DOM, no diffing, no wasted work. In React you'd need Jotai/Zustand and careful memoization to avoid re-render hell.

### Why Tauri over Electron?

| | Tauri v2 | Electron |
|--|----------|----------|
| **Build size** | ~10-15MB | ~150MB+ |
| **RAM usage** | Lower (system WebView) | Higher (bundled Chromium) |
| **Mobile support** | Yes (Android + iOS) | No |
| **Steam games using it** | Growing | Vampire Survivors, Brotato, etc. |
| **Do we write Rust?** | No — just a JSON config | No |

### Why Supabase?

| Feature | What We Use It For |
|---------|-------------------|
| **PostgreSQL database** | Player data, game state, event configs, leaderboards |
| **Auth** | Player accounts (login with Steam, Google, Apple) |
| **Realtime subscriptions** | Push live events to all players instantly |
| **Edge Functions** | Server-side game logic, anti-cheat, event scheduling |
| **Storage** | Asset hosting if needed |
| **Free tier** | Generous — 500MB DB, 50K monthly active users, 2M edge function invocations |

---

## AI / Vibecoding Setup

This is key — we want our AIs to be in sync so we're not fighting each other's code.

### Shared Context in the Repo

```
.cursor/
└── rules/
    ├── game-rules.mdc         # What the game is, mechanics, conventions
    ├── svelte-rules.mdc       # Svelte patterns, component style, state management
    └── supabase-rules.mdc     # Database patterns, API conventions
```

Both of us use **Cursor**. The `.cursor/rules/` directory lives in the repo, so when either of us opens the project, our AI has the same context about:

- What the game is and how it works
- Code style and naming conventions
- Architecture patterns we follow
- What's been built and what's planned

### The Game Bible: `GAME_DESIGN.md`

A living document in the repo root that describes:

- Core game loop
- Mechanics and systems
- Economy / progression design
- Art direction and style guide
- Event system design
- Monetization plan (if any)

**This is the single source of truth.** When either of us asks our AI "how should X work?", it reads this doc and gives consistent answers.

### Other Docs

| File | Purpose |
|------|---------|
| `ARCHITECTURE.md` | How the codebase is structured, where things live |
| `CONTRIBUTING.md` | Commit conventions, PR flow, branch strategy |
| `README.md` | Project overview, setup instructions |

---

## Project Structure

```
game-name/
├── .cursor/
│   └── rules/                     # Shared AI rules for vibecoding
│       ├── game-rules.mdc
│       ├── svelte-rules.mdc
│       └── supabase-rules.mdc
├── .github/
│   └── workflows/                 # CI/CD — auto-build for all platforms
│       └── build.yml
├── src/                           # SvelteKit app
│   ├── lib/
│   │   ├── components/            # Svelte UI components
│   │   │   ├── ui/                # Generic (Button, Modal, ProgressBar...)
│   │   │   └── game/              # Game-specific (UpgradeCard, ResourceBar...)
│   │   ├── game/                  # Core game engine
│   │   │   ├── engine.js          # Game loop, tick system
│   │   │   ├── resources.js       # Resource definitions & state
│   │   │   ├── generators.js      # Generator/building logic
│   │   │   ├── upgrades.js        # Upgrade system
│   │   │   ├── prestige.js        # Prestige/reset layers
│   │   │   ├── events.js          # Live events integration
│   │   │   ├── save.js            # Save/load (local + cloud)
│   │   │   └── offline.js         # Offline progress calculation
│   │   ├── pixi/                  # PixiJS game canvas
│   │   │   ├── canvas.js          # Pixi app setup
│   │   │   ├── sprites.js         # Sprite management
│   │   │   └── effects.js         # Particles, animations
│   │   ├── supabase/              # Supabase client & helpers
│   │   │   ├── client.js
│   │   │   ├── auth.js
│   │   │   └── sync.js            # Cloud save sync
│   │   └── utils/                 # Helpers (formatting, big numbers, etc.)
│   ├── routes/                    # SvelteKit pages
│   │   ├── +layout.svelte         # Root layout
│   │   └── +page.svelte           # Main game page (SPA — this is the game)
│   └── app.html
├── src-tauri/                     # Tauri config (auto-generated)
│   ├── tauri.conf.json            # App name, window size, permissions
│   ├── icons/                     # App icons
│   └── Cargo.toml                 # Rust deps (don't touch this)
├── static/
│   └── assets/
│       ├── sprites/               # Pixel art spritesheets
│       ├── audio/
│       │   ├── sfx/               # Sound effects
│       │   └── music/             # Background music / chiptunes
│       └── fonts/                 # Pixel fonts
├── supabase/
│   ├── migrations/                # Database schema (SQL)
│   ├── functions/                 # Edge functions
│   │   ├── activate-event/        # Cron: activate/deactivate events
│   │   └── leaderboard/           # Leaderboard updates
│   ├── seed.sql                   # Test data
│   └── config.toml
├── docs/
│   ├── GAME_DESIGN.md             # The game bible
│   └── ARCHITECTURE.md
├── svelte.config.js
├── vite.config.js
├── package.json
├── CONTRIBUTING.md
└── README.md
```

---

## Tools & Software

### Development

| Tool | What For | Cost |
|------|----------|------|
| **SvelteKit** | App framework | Free |
| **Vite** | Build tool (bundled with SvelteKit) | Free |
| **Tauri v2** | Desktop + mobile packaging | Free |
| **PixiJS** | 2D sprite rendering | Free |
| **Cursor** | Code editor + AI | Free tier or Pro |
| **GitHub** | Version control, issues, project board | Free |
| **Supabase** | Backend (DB, auth, events, realtime) | Free tier |
| **Supabase CLI** | Local backend development | Free |
| **Node.js + npm** | Runtime & packages | Free |

### Art & Audio

| Tool | What For | Cost |
|------|----------|------|
| **Aseprite** | Pixel art & animation (industry standard) | ~€20 one-time (or compile from source for free) |
| **Piskel** | Pixel art (free web-based alternative) | Free |
| **BFXR / SFXR** | Retro sound effects generator | Free |
| **LMMS** | Chiptune / retro music (manual) | Free |
| **Suno / Udio** | AI-generated music & sound | Free tier |

### Distribution

| Platform | Tool | Cost |
|----------|------|------|
| **Web** | Vercel / Netlify / any static host | Free |
| **Steam** | Steamworks + steamworks.js | €100 one-time (Steam Direct fee) |
| **Android** | Google Play Console | €25 one-time |
| **iOS** | Apple Developer Program | €99/year |

### Project Management

| Tool | What For |
|------|----------|
| **GitHub Issues** | Task tracking, bugs |
| **GitHub Projects** | Kanban board |
| **Discord server** | Communication (or just keep using whatever we use now) |

---

## Events System Design

Since live events are a core feature, here's how it works:

```
┌─────────────────┐     realtime       ┌──────────────────┐
│    Supabase      │ ◄──subscription──► │   SvelteKit App  │
│                  │                    │                  │
│  events table    │                    │  Event UI        │
│  event_rewards   │     HTTP/REST      │  Notifications   │
│  player_progress │ ◄────────────────► │  Save system     │
└─────────────────┘                    └──────────────────┘
         ▲                                     │
         │ cron trigger                        │
         │                              runs in browser,
┌────────┴────────┐                    Tauri (Steam),
│  Edge Function  │                    or Tauri (mobile)
│  (activate /    │
│   deactivate    │
│   events)       │
└─────────────────┘
```

1. **`events` table** in Supabase with start/end dates, event type, rewards, config (JSON)
2. **Edge function** runs on a cron schedule to activate/deactivate events
3. **SvelteKit client** subscribes to realtime changes on the events table
4. When an event goes live → all players see it instantly in-game
5. Event progress & rewards tracked per player in the DB

---

## How We Split the Work

Suggestion based on strengths — flexible:

| Area | Who | Why |
|------|-----|-----|
| **Game UI & Svelte components** | Luca | Frontend is your thing |
| **Supabase backend & database** | Steen | Backend dev, knows SQL/APIs |
| **PixiJS rendering & sprites** | Luca | Visual / frontend layer |
| **Edge functions & server logic** | Steen | Server-side logic |
| **Game systems & mechanics** | Both | Core game loop, we design together |
| **Art & visual style** | Both (+ AI) | Pixel art, we learn together or AI-generate |
| **Steam integration** | Either | steamworks.js, achievements, cloud saves |
| **Tauri config & builds** | Either | Mostly config, CI/CD handles it |

---

## Getting Started — First Steps

### Week 1: Setup & Learn

- [ ] Create the GitHub repo
- [ ] Scaffold the SvelteKit project: `npm create svelte@latest`
- [ ] Install Tauri: `npm install @tauri-apps/cli`
- [ ] Set up `.cursor/rules/` with initial project rules
- [ ] Create a Supabase project (free tier)
- [ ] Both do a quick Svelte tutorial (~2-3 hours, svelte.dev/tutorial)
- [ ] Get a basic Tauri window showing the Svelte app

### Week 2: Prototype

- [ ] Write `GAME_DESIGN.md` together (nail down the game concept)
- [ ] Build a basic idle prototype in Svelte (click → earn gold → buy generators → auto-earn)
- [ ] Add PixiJS canvas with a simple sprite or animation
- [ ] Connect to Supabase (basic auth + save/load)

### Week 3+: Build

- [ ] Flesh out game mechanics and progression
- [ ] Pixel art style guide & first sprites
- [ ] Events system MVP
- [ ] Offline progress calculation
- [ ] Iterate, vibecode, have fun

---

## Reference Games (for inspiration)

| Game | Platform | Why It's Relevant |
|------|----------|-------------------|
| Cookie Clicker | Web/Steam | OG idle game, simple but deep |
| Antimatter Dimensions | Web/Steam/Mobile | Complex incremental, great progression |
| Idle Slayer | Steam/Mobile | Incremental with action elements |
| Melvor Idle | Steam/Mobile | Idle RPG, events system, RuneScape-inspired |
| Clicker Heroes | Steam/Mobile | Classic incremental with prestige loops |
| Realm Grinder | Steam/Mobile | Deep faction/choice system |
| NGU Idle | Steam | Feature-rich, multiple progression systems |

---

## Open Questions

- [ ] What's the game concept? (theme, setting, what are you clicking/idling?)
- [ ] Monetization? (free + ads on mobile? paid on Steam? cosmetic MTX?)
- [ ] Do we want multiplayer/social features? (guilds, trading, co-op events?)
- [ ] Art style — full pixel art or more minimalist/UI-heavy?
- [ ] Game name?
- [ ] Timeline — hobby project or are we trying to ship by a certain date?

---

## TL;DR

| Decision | Choice |
|----------|--------|
| **Framework** | SvelteKit (adapter-static, SPA) |
| **Language** | JavaScript |
| **2D rendering** | PixiJS |
| **Desktop/Mobile wrapper** | Tauri v2 |
| **Backend** | Supabase (PostgreSQL + Auth + Realtime + Edge Functions) |
| **Version control** | GitHub |
| **AI/Vibecoding** | Cursor with shared `.cursor/rules/` in the repo |
| **Pixel art** | Aseprite |
| **Sound** | BFXR + AI-generated music |
| **Platforms** | Web (browser) → Steam (Tauri) → Android + iOS (Tauri) |
| **Total upfront cost** | €0 to start, ~€225 when ready to publish everywhere |

---

*Let's make something sick.* 🤙
