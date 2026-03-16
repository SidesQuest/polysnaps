# Polysnaps — UI/UX & Gameplay Improvement Plan

**Date:** March 16, 2026  
**Based on:** Full codebase audit, desktop & mobile UI/UX testing, game mechanics analysis

---

## Current State Summary

- **Desktop UI:** 8.5/10 — good contrast, readable text, functional panels
- **Mobile UI:** 9/10 — responsive layout with MAP/BUILD tabs working well
- **Gameplay:** Core loop is solid but progression feels flat after P2
- **Visual Polish:** ~97% of available pixel-art assets are unused (30/1100+)
- **Audio:** Synthesized chiptune SFX only, no music, most sounds very quiet
- **Bugs Found:** 3 unreachable achievements/combos, 1 unused reward type

---

## Priority Tiers

### 🔴 P0 — Critical (High Impact, Do First)

### 🟡 P1 — Important (Noticeable Polish)

### 🟢 P2 — Nice to Have (Extra Delight)

### 🔵 P3 — Future Vision (Bigger Features)

---

## Part 1: Make It More FUN

### 🔴 P0: Juice Up Core Interactions

**1.1 — Satisfying Tap Feedback**
- Add screen shake on every tap (subtle 2px, not just bursts)
- Scale up the floating "+N" text to be larger and more dramatic
- Add a ripple pulse that expands from core on tap (already exists but make it more visible with color)
- Every 10th tap burst should have a screen flash, camera zoom-out snap, and louder sound
- Add haptic feedback via `navigator.vibrate()` on mobile taps

**1.2 — Shape Placement Celebration**
- Play a "snap" sound effect when placing shapes (use `playPlace()` — exists but may not be called)
- Flash the placed shape white briefly then settle to normal color
- Connection line should "draw" from parent to child (animated stroke-dashoffset)
- Show a brief "+X/s" production preview floating text at the new shape

**1.3 — Prestige Ceremony**
- Current: 0.8s gold flash. Way too quick for the most important moment in the game.
- New sequence: slow zoom into core (1s) → core dissolves into particles → screen whites out → new core assembles from particles with new sides → camera zooms back out → resources cascade in from edges
- Show "PRESTIGE COMPLETE" banner with new core shape name and rewards summary
- Duration: 3-4 seconds minimum
- Play the full prestige arpeggio sound (already exists but make it louder and longer)

**1.4 — Combo Discovery Moment**
- Current: small toast notification only
- New: pause resource flow for 0.5s → highlight the shapes forming the combo with golden glow → show combo name/icon in center of screen → resume with visible multiplier boost wave
- First-time combos should feel more special than re-discoveries

**1.5 — Pentagon Burst**
- Current: floating text + shake. Functional but not exciting.
- New: pentagon cracks with light leaking through → explosion of resource particles spraying toward core → screen flash → satisfying "burst" SFX (already exists)
- Storage bar should visually "fill up" with anticipation glow as it approaches capacity
- Auto-release (from skill) should still animate but faster

### 🟡 P1: Progression Dopamine

**1.6 — Milestone Celebrations**
- At 10, 50, 100, 500, 1000 shapes: banner announcement + bonus
- At 1M, 1B, 1T energy: visual theme shift (background color subtly changes)
- First time unlocking each resource type: dramatic intro sequence
- First time unlocking each shape type: showcase animation showing the shape's special ability

**1.7 — Offline Earnings Enhancement**
- "Welcome Back" popup should show resources raining down visually, not just numbers
- Add "time-lapse" animation showing shapes glowing and resources flowing (2-3 second compressed replay)
- Make the doubled earnings feel impactful (2x text scales up dramatically)

**1.8 — Achievement Unlock Ceremony**
- Play full achievement sound (exists, volume up)
- Toast should be larger with the achievement icon bouncing
- Show a "shimmer" effect across the HUD when an achievement unlocks
- Achievement panel should highlight newly unlocked ones with a "NEW" badge

### 🟢 P2: Long-term Engagement

**1.9 — Daily/Timed Goals**
- "Place 20 shapes" / "Earn 1M energy" / "Discover a combo" daily targets
- Small reward (bonus cores, temporary 2x boost)
- Streak counter for consecutive days

**1.10 — Ascension Milestones**
- Every 5 prestige levels: unlock a cosmetic (core glow color, background theme, particle style)
- Visible "journey" timeline showing all prestiges with timestamps
- "Hall of Cores" showing evolved core shape history

---

## Part 2: Make It More PLAYABLE

### 🔴 P0: Fix Known Bugs

**2.1 — Unreachable Content**
- `max-level-5` combo checks `node.level >= 5` but nodes always have `level: 1` → fix to check `tierLevels[depth] >= 5`
- `speed-prestige` achievement checks `stats.prestigedThisCheck` which is never set → set flag in `resetForPrestige()`
- `square-world` challenge reward `multiplier_boost` is never consumed → add to production pipeline
- `playError()` SFX exists but is never called → call on failed placement attempts

**2.2 — Mobile Touch Improvements**
- Replace "scroll to zoom · shift+drag to pan" hint with "pinch to zoom · drag to pan" on touch devices
- Add pinch-to-zoom gesture support for the SVG canvas
- Increase tap target sizes for shape slots on the canvas (currently geometric shapes — hard to tap precisely)
- Add touch-hold tooltip (since hover doesn't exist on mobile)
- Add haptic feedback for taps and placements

### 🟡 P1: Quality of Life

**2.3 — Shape Placement Preview**
- When hovering over an empty slot, show a ghost/preview of the selected shape before clicking
- Show production change preview: "+12/s → +15/s" before confirming placement
- Highlight which resource this slot will generate (already partially done with resource hints)

**2.4 — Undo Last Placement**
- Allow undoing the most recent shape placement (within 5 seconds)
- Small "Undo" button appears temporarily after placing
- Refunds full cost

**2.5 — Better Tooltip System**
- SVG tooltips are tiny (4-5.5px font). Replace with HTML tooltips that overlay the canvas
- Show full production breakdown: base × tier × generators × zone × combo × prestige
- On mobile: tap-and-hold any shape to see details
- Tooltip follows cursor on desktop

**2.6 — Resource Flow Visualization**
- Color-code flow particles by resource type (blue=energy, pink=flux, purple=prisms)
- Show flow amount as tiny numbers traveling along connection lines
- Pulse connection lines when production changes (tier upgrade, new shape placed)

**2.7 — Auto-play Controls**
- Auto-click toggle visible in HUD (not buried in skills)
- Auto-place toggle with shape preference selector
- Speed controls: 1x / 2x / 5x production preview

**2.8 — Keyboard Shortcuts**
- `1-4` to select shape type
- `Space` to tap core
- `P` to prestige (when available)
- `M` to open menu
- `Esc` to close any overlay

### 🟢 P2: Information Design

**2.9 — Production Dashboard**
- Expandable panel showing per-resource breakdown:
  - Base production
  - Tier multiplier
  - Generator multiplier
  - Zone bonus
  - Combo multiplier
  - Prestige bonus
  - Total
- Graph showing production over time (last 5 minutes)

**2.10 — Next Goal Indicator**
- Always show the nearest achievable goal: next combo, next achievement, prestige threshold
- Progress bar toward that goal in the HUD
- "Next unlock: Square shapes at P1" messaging for new players

---

## Part 3: Make It More UNIQUE

### 🔴 P0: Visual Identity

**3.1 — Use the Pixel Art Assets**
- **Custom cursors:** 4 cursor PNGs exist → apply as `cursor: url(...)` CSS
- **Logo:** 3 Logo PNGs → use on menu info page, splash screen
- **Decorative elements:** 6 unused Decor PNGs → use as panel/HUD corner pieces
- **Icons:** 37 unused icon PNGs → use for menu items, resource displays, achievements

**3.2 — Parallax Background**
- 5 background layer tilesets exist (`Tilesets/1-5.png`) → create parallax scrolling background
- Background should shift subtly as user pans the shape network
- Different background themes per prestige level (e.g., space → cybercity → neon grid)

**3.3 — Shape Textures & Fills**
- 81 IndustrialTile PNGs available → use as fill patterns for placed shapes
- Different texture per shape type (triangles = circuits, squares = grids, pentagons = crystals, hexagons = energy)
- Shapes should have inner detail, not just flat dark fills with outlines
- Core shape should have a unique, more elaborate texture

**3.4 — Animated Sprite Decorations**
- 12 animated sprite sheets exist (coins, chests, hammers, money stacks)
- Use chest-open animation for achievement unlocks
- Use coin animation for resource milestones
- Use hammer animation for tier upgrades

### 🟡 P1: Distinctive Mechanics

**3.5 — Shape Removal System** (designed but not built)
- Skill-gated: unlock "Remove X shapes per run" via skill tree
- Clicking a placed shape while in "remove mode" refunds partial cost
- Strategic element: reshape your network for better zone coverage or combo completion
- Visual: shape dissolves into particles

**3.6 — Fog of War Visual**
- Currently fog is only used for puzzle slot visibility (hidden calculation)
- Make fog visually rendered: dark translucent overlay with animated noise texture
- Fog recedes as shapes are placed, revealing the map dramatically
- Hidden surprises in fog: puzzle slots glow faintly through fog
- Revealed area has a subtle "cleared" visual distinction

**3.7 — Dynamic Core Evolution**
- Core should visually evolve with prestige:
  - P0: Simple triangle outline
  - P1: Square with inner rotation animation
  - P2: Pentagon with pulsing glow
  - P3: Hexagon with orbiting particles
  - P4+: Increasingly elaborate effects (trails, halo, color shifts)
- Core click animation should escalate with prestige level

**3.8 — Buff Zone Visual Enhancement**
- Current: dashed hexagon outlines. Functional but boring.
- New: animated gradient fills, floating particles within zone, pulsing boundary
- Zone type indicated by visual effect (fire particles for Power, water ripples for Flow, leaf/vine for Growth)
- Shapes inside zones should have a subtle glow matching zone color

### 🟢 P2: Stand-out Features

**3.9 — Geometric Art Mode**
- Screenshot button: captures the shape network as a shareable image
- "Gallery" of past network screenshots (one per prestige)
- Procedural background pattern generated from your network layout
- The game generates unique visual art as you play — make this a feature, not a side effect

**3.10 — Rhythm of Production**
- Sync visual pulses to production ticks
- Flow particles pulse in rhythm
- Optional: ambient generative music that builds with your network size
- More shapes = more complex visual/audio rhythm

---

## Part 4: Make It More POLISHED (UI)

### 🔴 P0: Visual Consistency

**4.1 — Pixel-Art Button Components**
- Replace CSS gradient buttons with pixel-art button assets (32 Button PNGs available)
- Create pressed/hover/disabled states from assets
- Consistent button sizing with pixel-perfect rendering
- Use `image-rendering: pixelated` scaling

**4.2 — Panel Frames**
- Replace CSS-border panels with pixel-art frame assets (81 Frame PNGs + 2 panel-frame PNGs)
- Match CyberPanel accent colors to frame tint
- Inner padding should respect frame border thickness
- Frame corner pieces for larger panels

**4.3 — Resource Bar Upgrade**
- Replace CSS gradient bars with pixel-art bar assets (8 EnergyBar + 8 HealthBar PNGs)
- Animated fill with shimmer effect on resource gain
- Segmented bar display for milestones
- Glow effect when bar is near full

**4.4 — Typography Improvements**
- Resource values in HUD: consider pixel-art number sprites for extra polish (15 Number PNGs available)
- Or keep font but add text stroke/outline for better contrast on any background
- Consistent font sizing: establish 4 size tiers (label, body, heading, display)
- Size tier tokens: `--text-xs: 9px; --text-sm: 10px; --text-md: 11px; --text-lg: 14px; --text-xl: 18px`

### 🟡 P1: Micro-interactions

**4.5 — Hover/Focus States**
- Every interactive element should have a visible hover state
- Focus ring for keyboard navigation (accessibility)
- Cursor changes: pointer for buttons, grab for canvas, crosshair for slot placement
- Custom pixel-art cursor from assets

**4.6 — Transition Animations**
- Panel open/close: slide + fade instead of instant
- Tab switching: slide transition between MAP/BUILD on mobile
- Menu tab transitions: crossfade content
- Number changes: animate (roll up/down) instead of instant swap
- Resource gain: brief flash/glow on the HUD number when it increases

**4.7 — Loading & Empty States**
- Splash screen with logo + "loading..." when game boots
- Empty state illustrations for panels with no content (e.g., "No combos yet" with a shape illustration)
- Skeleton loading states for panels

**4.8 — Sound Design Improvements**
- Increase SFX volume (currently 0.04–0.08, too quiet)
- Add subtle UI hover sounds (soft tick)
- Add background ambient loop: low drone + subtle rhythmic pulse
- Generative music layer that adds complexity as network grows
- Volume slider in settings (not just on/off)

### 🟢 P2: Fit and Finish

**4.9 — Color Theme System**
- Current: single dark cyberpunk theme
- Add 2-3 alternatives: Classic Dark, Neon, Minimal Light
- Theme selector in settings
- Each theme adjusts: background, panel colors, accent colors, text colors
- Per-prestige theme unlock as cosmetic reward

**4.10 — Accessibility**
- High contrast mode toggle
- Colorblind-friendly option (pattern-based distinction, not just color)
- Screen reader hints for key game state
- Reduced motion option (disable CRT flicker, scanlines, particles)
- Minimum font size option

**4.11 — Performance Polish**
- SVG rendering can lag with 50+ shapes → implement viewport culling
- Throttle flow particle count (already MAX_FLOW_PATHS=15, but could be dynamic)
- Lazy-load panels that aren't visible
- Consider WebGL (PixiJS) as primary renderer for large networks

**4.12 — Onboarding Refinements**
- Tutorial should highlight actual UI elements (point to specific buttons)
- Progressive disclosure: hide advanced features until unlocked (challenges, skill tree)
- Contextual tips: "Try placing a shape on the golden slot!" when energy is sufficient
- First-time feature reveals: brief animation when a new panel/feature unlocks

---

## Part 5: Bug Fixes & Technical Debt

### 🔴 P0: Fix Now

| Issue | File | Fix |
|-------|------|-----|
| `max-level-5` combo unreachable | `combos.js` | Check `getTierLevel(depth) >= 5` instead of `node.level >= 5` |
| `speed-prestige` achievement unreachable | `state.svelte.js` | Set `stats.prestigedThisCheck = true` in `resetForPrestige()` |
| `multiplier_boost` challenge reward unused | `state.svelte.js` | Add to production pipeline in `getProductionByResource()` |
| `playError()` never called | Multiple | Call on failed placement, insufficient resources, etc. |
| `playPlace()` possibly not called | `ShapeNetwork.svelte` | Verify and add call in `handleSlotClick()` success path |

### 🟡 P1: Improve Soon

| Issue | Description |
|-------|-------------|
| Offline earnings too simple | Apply combo/zone/achievement multipliers at reduced rate |
| PixiJS renderer incomplete | Missing buff zones, puzzles, storage bars vs SVG renderer |
| No error handling | Failed save/load/import could crash silently |
| No analytics | No way to understand player behavior and balance |

---

## Implementation Roadmap (Suggested Order)

### Sprint 1: "Juice & Fix" (1-2 weeks)
- Fix all P0 bugs (5 items)
- Tap feedback improvements (1.1)
- Shape placement celebration (1.2)
- Use pixel-art assets: cursors, logo, icons (3.1)
- Sound volume increase (4.8)
- Mobile touch improvements (2.2)

### Sprint 2: "Visual Identity" (2-3 weeks)
- Prestige ceremony (1.3)
- Parallax background (3.2)
- Shape textures (3.3)
- Dynamic core evolution (3.7)
- Panel frames from assets (4.2)
- Hover/focus states (4.5)

### Sprint 3: "Progression & QoL" (2-3 weeks)
- Combo discovery moment (1.4)
- Pentagon burst visual (1.5)
- Milestone celebrations (1.6)
- Tooltip system upgrade (2.5)
- Keyboard shortcuts (2.8)
- Next goal indicator (2.10)

### Sprint 4: "Depth & Uniqueness" (2-3 weeks)
- Shape removal system (3.5)
- Fog of war visual (3.6)
- Buff zone enhancement (3.8)
- Production dashboard (2.9)
- Transition animations (4.6)
- Color theme system (4.9)

### Sprint 5: "Polish & Delight" (2-3 weeks)
- Animated sprite decorations (3.4)
- Offline earnings animation (1.7)
- Achievement ceremony (1.8)
- Geometric art mode (3.9)
- Sound design (4.8 full)
- Accessibility features (4.10)
- Onboarding refinements (4.12)

---

## Quick Wins (Can Do in < 1 Hour Each)

1. ✅ Apply custom cursor CSS from existing assets
2. ✅ Use logo PNG in menu info page
3. ✅ Increase SFX volume from 0.04 to 0.15
4. ✅ Fix `speed-prestige` achievement flag
5. ✅ Fix `max-level-5` combo tier check
6. ✅ Call `playPlace()` on shape placement
7. ✅ Call `playError()` on failed actions
8. ✅ Add mobile-specific controls hint text
9. ✅ Add keyboard shortcuts for shape selection
10. ✅ Use 3 more icon PNGs in menu/HUD

---

## Metrics to Track (Future)

- Average session length
- Shapes placed per session
- Prestige rate (time between prestiges)
- Retention (day 1, 7, 30)
- Most/least used shape types
- Skill tree popular paths
- Challenge completion rates
- Drop-off points in progression
