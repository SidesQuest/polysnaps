# Polysnaps

Incremental idle game built with SvelteKit (static adapter), Svelte 5, and PixiJS. Entirely client-side — no backend services required.

## Cursor Cloud specific instructions

### Services

| Service | Command | Port | Notes |
|---------|---------|------|-------|
| Dev server | `npm run dev -- --host 0.0.0.0` | 5173 | The only service needed. Uses Vite with HMR. |

### Build & Run

- `npm run dev` — start dev server (add `--host 0.0.0.0` for network access in cloud VMs)
- `npm run build` — production build (outputs to `build/`)
- `npm run preview` — preview production build
- See `README.md` for the full list of scripts.

### Lint & Test

- No linter or test framework is configured in this project. Svelte compiler warnings (a11y, unused imports) appear during build but do not block it.
- No `eslint`, `prettier`, or test runner (`vitest`, `jest`, etc.) is present.

### Caveats

- Both `package-lock.json` and `pnpm-lock.yaml` exist. The README specifies `npm install`, so use **npm** as the package manager.
- Tauri v2 CLI is a devDependency, but `src-tauri/` has not been scaffolded — Tauri commands will fail until it is initialized.
- Supabase integration is planned but not implemented; no env vars or backend services are needed.
- Game state persists via `localStorage`; clearing browser data resets progress.
