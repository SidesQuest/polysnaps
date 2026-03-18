# Polysnaps — Improvement & Feature Roadmap

**Last updated:** March 16, 2026  
**Based on:** Full codebase audit, desktop & mobile UI/UX testing, gameplay analysis, Sprint 1 learnings

---

## Progress Summary

### ✅ Completed

| Item | What shipped |
|------|-------------|
| Mobile responsive layout | MAP/BUILD tab navigation for < 768px viewports |
| Text contrast & readability | Brighter colors, larger fonts (9-11px min) |
| Touch targets | 44px minimum on all buttons |
| Shape placement bugs | Fixed overlap detection false positives, slot outlines match selected shape |
| P0 bug fixes | `max-level-5` combo, `speed-prestige` achievement, `multiplier_boost` reward, `playError()` calls |
| Tap feedback | Screen shake (2px/8px burst), bigger floating numbers with glow, 10th-tap golden flash, haptic |
| Placement celebration | Production preview (+X/s text), haptic on place/fail |
| Pixel art assets | Custom cursor, logo on info page |
| Sound | Volume increased 3x, master volume slider with persistence |
| Mobile touch | Pinch-to-zoom, drag-to-pan, touch-specific controls hint |
| Visual declutter | Depth-limited slots, progressive disclosure (hover-reveal), quieter zones |

### Current State

- **Desktop:** 9/10
- **Mobile:** 9/10
- **Gameplay feel:** 7/10 — juicier taps and placement, but prestige and combos still feel flat
- **Visual identity:** 5/10 — functional but shapes are flat outlines, no textures or background depth
- **Audio:** 5/10 — SFX present but no music, no ambient layer
- **Content depth:** 6/10 — progression works but lacks variety after P3

---

## Priority Tiers

- 🔴 **P0** — High impact, do first
- 🟡 **P1** — Important polish
- 🟢 **P2** — Extra delight
- 🔵 **P3** — Future vision / bigger features

---

## Sprint 2: "Visual Identity" (Next)

Goal: Make the game *look* unique and memorable. Give it a visual signature.

### 🔴 P0

**2A — Prestige Ceremony** *(1.3)*
- Current: 0.8s gold flash — way too quick for the game's most important moment
- New: zoom into core (1s) → core dissolves → screen whites out → new core assembles with +1 side → zoom back out → "PRESTIGE COMPLETE" banner with shape name and rewards
- Duration: 3-4 seconds
- Play full prestige arpeggio (louder, longer)

**2B — Dynamic Core Evolution** *(3.7)*
- Core visually changes per prestige level:
  - P0: simple outline, "TAP" text
  - P1: inner glow, subtle rotation
  - P2: pulsing aura, brighter stroke
  - P3: orbiting particles, color shift
  - P4+: halo effect, trails, increasing complexity
- Core click animation escalates with prestige level

**2C — Shape Fills & Distinction** *(3.3)*
- Shapes are currently flat dark polygons with colored outlines — no visual identity
- Add subtle inner gradients per shape type:
  - Triangle: radial gradient (dark center → colored edge)
  - Square: diagonal line pattern
  - Pentagon: crystalline facet pattern
  - Hexagon: concentric ring pattern
- Different fill darkness by depth (deeper = slightly brighter fill)
- In-zone shapes get a subtle tinted fill matching zone color

### 🟡 P1

**2D — Parallax Background** *(3.2)*
- 5 background layer tilesets exist but aren't used
- Layer 1 (closest): subtle grid that moves 1:1 with pan
- Layer 2-3: nebula/stars that move at 0.5x and 0.3x pan speed
- Different palette per prestige level
- Ambient slow drift when not panning

**2E — Panel Frames from Assets** *(4.2)*
- Replace CSS-only borders with pixel-art frame assets (81 Frame PNGs available)
- 9-slice panel construction (corner + edge + center pieces)
- Match accent colors by tinting

**2F — Hover & Focus Polish** *(4.5)*
- Consistent hover glow on all interactive elements
- Focus rings for keyboard navigation
- Placed shapes highlight on hover with info tooltip
- Core shape pulses gently when idle (inviting tap)

---

## Sprint 3: "Progression & QoL"

Goal: Make progression feel rewarding and reduce friction.

### 🔴 P0

**3A — Combo Discovery Moment** *(1.4)*
- Current: small toast only
- New: brief pause → golden glow on contributing shapes → combo name centered on screen → multiplier boost wave radiates outward
- First discoveries feel special, re-discoveries are subtler

**3B — Pentagon Burst Visual** *(1.5)*
- Crack animation on pentagon as it fills → light leaks → particle explosion toward core
- Storage bar glows with anticipation near capacity
- Satisfying "burst" SFX on release

**3C — Milestone Celebrations** *(1.6)*
- 10/50/100/500 shapes: banner + bonus energy
- 1M/1B/1T energy: subtle background color shift
- First unlock of each resource/shape type: dramatic intro sequence

### 🟡 P1

**3D — Better Tooltip System** *(2.5)*
- Replace tiny SVG tooltips with HTML overlays
- Full production breakdown: base × tier × generators × zone × combo × prestige
- Mobile: tap-and-hold to see details
- Desktop: tooltip follows cursor

**3E — Keyboard Shortcuts** *(2.8)*
- `1-4` to select shape type
- `Space` to tap core
- `P` to prestige (when available)
- `M` to open menu
- `Esc` to close any overlay
- Show shortcut hints in UI

**3F — Next Goal Indicator** *(2.10)*
- Always show nearest achievable goal in HUD
- Progress bar toward that goal
- "Next: Full Ring combo (fill all edges)" guidance
- "Next unlock: Square shapes at P1"

### 🟢 P2

**3G — Undo Last Placement** *(2.4)*
- 5-second window to undo
- Floating "Undo" button near placed shape
- Full cost refund

**3H — Resource Flow Visualization** *(2.6)*
- Color-code flow particles by resource (blue/pink/purple)
- Pulse connection lines on production changes
- Show flow direction more clearly

---

## Sprint 4: "Depth & Uniqueness"

Goal: Add strategic depth and stand-out features.

### 🔴 P0

**4A — Shape Removal System** *(3.5)*
- Skill-gated: "Remove X shapes per run" via skill tree
- "Remove mode" toggle: clicking shapes refunds partial cost
- Strategic: reshape network for zone coverage or combo completion
- Visual: shape dissolves into particles

**4B — Fog of War Visual** *(3.6)*
- Currently fog is invisible (code-only for puzzle visibility)
- Render dark translucent overlay with animated noise
- Fog recedes dramatically as shapes extend
- Puzzle slots glow faintly through fog
- Cleared area has a "revealed" brightness boost

### 🟡 P1

**4C — Production Dashboard** *(2.9)*
- Expandable panel with per-resource breakdown
- Base × tier × generators × zone × combo × prestige = total
- Mini graph of production over last 5 minutes
- Helps players understand what to optimize

**4D — Transition Animations** *(4.6)*
- Panel open/close: slide + fade
- Mobile tab switch: slide transition
- Resource numbers: roll up/down animation
- HUD flash on resource gain

**4E — Color Theme System** *(4.9)*
- 3 themes: Cyberpunk Dark (current), Neon, Midnight
- Theme selector in settings
- Per-prestige theme unlock as cosmetic reward

### 🟢 P2

**4F — Buff Zone Enhancement** *(3.8)*
- Animated gradient fills per zone type
- Fire particles (Power), water ripples (Flow), leaves (Growth)
- Shapes in zones get subtle tinted glow

---

## Sprint 5: "Polish & Delight"

Goal: Final layer of polish, accessibility, and delight.

### 🔴 P0

**5A — Sound Design** *(4.8 full)*
- Background ambient loop: low drone + rhythmic pulse
- Generative layer: complexity increases with network size
- UI hover sounds (soft tick)
- Full volume controls with separate SFX/music sliders

**5B — Achievement Ceremony** *(1.8)*
- Larger toast with bouncing icon
- HUD shimmer effect
- "NEW" badge on achievement panel
- Sound: full arpeggio (already exists, make more prominent)

**5C — Onboarding Refinements** *(4.12)*
- Tutorial points to actual UI elements (arrows)
- Progressive disclosure: hide challenges/skill tree until unlocked
- Contextual tips: "Try tapping!" / "Place a shape!"
- First-time feature reveals with brief animation

### 🟡 P1

**5D — Offline Earnings Animation** *(1.7)*
- Resources rain down visually in "Welcome Back" popup
- Compressed time-lapse replay (2-3 seconds)
- "2x" scales up dramatically if doubled

**5E — Accessibility** *(4.10)*
- High contrast mode
- Colorblind-friendly option (patterns, not just colors)
- Reduced motion toggle (disable CRT, scanlines, particles)
- Screen reader hints for key state

**5F — Performance** *(4.11)*
- Viewport culling for SVG with 50+ shapes
- Dynamic flow particle throttling
- Lazy-load hidden panels
- WebGL (PixiJS) as primary for large networks

### 🟢 P2

**5G — Geometric Art Mode** *(3.9)*
- Screenshot button: capture network as shareable image
- Gallery of past networks (one per prestige)
- The game generates unique visual art as you play

**5H — Rhythm of Production** *(3.10)*
- Sync visual pulses to production ticks
- Flow particles pulse in rhythm
- More shapes = more complex visual/audio pattern

---

## Beyond Sprints: Future Features

### 🔵 P3 — Backend & Social

**B1 — Cloud Saves (Supabase)**
- Auth (email, Google, GitHub)
- Cross-device sync
- Automatic backups

**B2 — Leaderboards**
- Fastest prestige time per level
- Most shapes placed in a single run
- Highest energy per second
- Tier-grouped (casual / competitive / hardcore)

**B3 — Events System**
- Monthly timed events with unique modifiers
- Event-exclusive challenges with cosmetic rewards
- Community goals (global shape count)

**B4 — Social Sharing**
- Share network screenshots with stats overlay
- "Challenge a friend" links (share your challenge setup)
- Import/export of network layouts as "blueprints"

### 🔵 P3 — Content Expansion

**C1 — New Shape Types**
- Heptagon (7): "Converter" — transforms one resource into another
- Octagon (8): "Portal" — links to another octagon, sharing generators
- Star: "Wildcard" — counts as any shape for combos

**C2 — Prestige Paths**
- After P5: choose between 2-3 specialization paths
- Path A: Production focus (bigger numbers, faster tiers)
- Path B: Network focus (more shapes, cheaper placement)
- Path C: Active focus (stronger taps, better bursts)
- Respec between paths costs cores

**C3 — Challenge Maps**
- Pre-built fixed layouts with specific goals
- Weekly rotating challenge map
- Community-submitted maps

**C4 — Consumables**
- Temporary boosts: 2x production (5 min), instant tier-up, free shape
- Earned through achievements, challenges, or events
- Not pay-to-win — earnable only

**C5 — Negative Zones & Obstacles**
- "Dead zones" where shapes produce nothing
- "Drain zones" that slowly consume resources
- Strategic: placement around obstacles matters more
- Removable via skills or consumables

### 🔵 P3 — Platform & Distribution

**D1 — Tauri Desktop App**
- Steam release with achievements + cloud saves
- Native performance for large networks
- Offline-first with cloud sync

**D2 — Mobile App (Tauri/Capacitor)**
- App store distribution
- Native haptics, notifications for offline earnings
- Push notifications: "Your pentagons are full!"

**D3 — PWA Improvements**
- Install prompt
- Offline support via service worker
- Background sync for saves

---

## Quick Wins Remaining

| # | Item | Effort | Impact |
|---|------|--------|--------|
| 1 | Add keyboard shortcuts for shape selection (1-4) | 30 min | Medium |
| 2 | Use more icon PNGs in menu/HUD (37 unused) | 30 min | Low |
| 3 | Add decorative corner pieces to panels | 45 min | Low |
| 4 | Flash shape white briefly on placement | 30 min | Medium |
| 5 | Animate connection line drawing on placement | 45 min | Medium |
| 6 | Add subtle idle pulse to core (invites tapping) | 20 min | Medium |
| 7 | Color flow particles by resource type | 30 min | Medium |
| 8 | Show "NEW" badge on recently unlocked achievements | 30 min | Low |
| 9 | Add splash screen with logo on first load | 45 min | Low |
| 10 | Progressive disclosure: hide challenge/skill UI until unlocked | 30 min | Medium |

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
- Most common prestige level reached
- Active vs idle play ratio

---

## Design Principles

1. **Progressive disclosure** — Don't show everything at once. Reveal as the player progresses.
2. **Juice over complexity** — Make existing mechanics feel better before adding new ones.
3. **Subtle by default, bold on interaction** — Slots, zones, and hints should whisper, not shout.
4. **Every tap should feel good** — Visual + audio + haptic feedback on every action.
5. **Geometry IS the art** — The network itself is the visual centerpiece. Don't obscure it.
6. **Mobile-first design** — If it works on a phone, it works everywhere.
7. **Earn, don't buy** — All content should be achievable through gameplay.
