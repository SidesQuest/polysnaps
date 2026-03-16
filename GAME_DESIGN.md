# Polysnaps Game Design Document

> Abstract geometry idle game. Snap shapes, build networks, prestige to evolve.

---

## 1. Core Loop & Feel

- **Theme:** Abstract geometry. No lore, no characters, no narrative. Pure shapes, flows, and growth.
- **Core mechanic:** Idle production. Shapes generate resources passively. Clicking exists as an optional active-play bonus (via skill investment), but a player who never clicks should progress well.
- **Session length:** Designed for short 2-5 minute check-ins (place shapes, collect offline rewards, prestige) AND longer active sessions while the app is open.
- **Active vs offline:** Active play is meaningfully better (combos, strategic placement, skill-boosted clicking), but offline still generates resources at a reduced rate.

---

## 2. Resources & Economy

### Resource Types

| Resource | Icon | Color   | Unlocked at | Role                                                         |
| -------- | ---- | ------- | ----------- | ------------------------------------------------------------ |
| Energy   | ⚡   | #44aaff | Start       | Primary currency, used for shape placement and tier upgrades |
| Flux     | 🌀   | #ff44aa | Prestige 1  | Secondary currency, required for higher-tier shapes          |
| Prisms   | 💎   | #aa44ff | Prestige 2  | Tertiary currency, required for top-tier shapes              |

### Cross-Boosting (Stockpile-Based)

Resources boost each other's production rate based on how much you have stockpiled, using a logarithmic formula:

```
bonus = log10(stockpile) * multiplier
```

- Flux stockpile -> boosts Energy production
- Prisms stockpile -> boosts Flux production
- Energy stockpile -> boosts Prisms production

This creates a circular dependency where all three resources are equally important.

### Multi-Resource Costs

- **Triangles:** Energy only
- **Squares:** Energy + Flux (immediately at unlock, not phased in)
- **Pentagons:** Energy + Flux + Prisms
- **Hexagons:** Energy + Flux + Prisms (higher amounts)

### No Resource Conversion

Resources cannot be converted into each other. Some things cost multiple resource types simultaneously.

### Resource Sinks

All resources should feel equally important and scarce. No single resource should accumulate without purpose.

### Consumables

Possible future addition (not priority): temporary boost items like 2x production for 5 minutes.

---

## 3. Shapes & Placement

### Shape Types

| Shape    | Sides | Role       | Special Mechanic                                                                    |
| -------- | ----- | ---------- | ----------------------------------------------------------------------------------- |
| Triangle | 3     | Generator  | Pure production, single-resource output                                             |
| Square   | 4     | Multiplier | Boosts adjacent shapes' output by 1.5x                                              |
| Pentagon | 5     | Storage    | Accumulates resource, player taps to release burst. Skill upgrade adds auto-release |
| Hexagon  | 6     | Synergy    | Boosts production of ALL adjacent resource types                                    |

### Placement Rules

- Placement is **permanent until prestige**. No moving or removing shapes.
- Future skill: allow removal of X shapes per run.
- Placement **location matters strategically** (buff zones, resource edges, combo patterns).
- Each shape type has exponential cost scaling: `baseCost * costMultiplier ^ totalPlaced`. This naturally limits network growth without needing a hard cap.

### Network Size

No hard cap. Exponential costs self-balance growth. If balancing feels off, tune `costMultiplier` values.

---

## 4. Prestige & Meta-Progression

### Prestige System

- **Single prestige layer** (no prestige-within-prestige). May add second layer in distant future if needed.
- **Trigger:** Total energy earned exceeds threshold.
- **Effect:** Core shape evolves (gains +1 side: triangle -> square -> pentagon -> ...), unlocking new resource types and shape types.
- **Currency:** Prestige awards **Cores** (renamed from generic "prestige currency").
- **Carryover:** Only Cores and skill unlocks carry over. Everything else resets.

### Prestige Reward Formula

Diminishing returns:

```
reward = floor(log10(totalEnergyEarned / threshold) * multiplier)
```

More resources = more Cores, but with diminishing returns at high values.

### Unspent Cores Passive

Unspent Cores provide a small global production multiplier:

```
passive = 1 + unspentCores * 0.01
```

This gives a reason to hoard some Cores rather than spending everything.

### Prestige Threshold

Should NOT get harder each time. The threshold scales, but players get exponentially stronger, making runs progressively faster.

---

## 5. Skill Tree

### Structure

- Currency: **Cores** (from prestige)
- ~15 unique "big" skills (one-time purchase, impactful effects)
- ~8 repeatable skills (buy up to 10-50x each, serve as Core sink)
- QoL / automation skills: auto-place, bulk operations, offline extension
- Clicker skills remain as an optional branch for active-play enthusiasts

### Respec

- First respec is **free**
- Subsequent respecs cost increasing premium currency

### Branching

- No exclusive branches. Player can eventually buy **everything** in the tree.
- Radial layout starting from center, branching outward.
- Repeatable nodes visually distinct from one-time nodes.

---

## 6. Map & Exploration

### Map Properties

- **Same map every run** (not procedurally generated per run).
- **Bounded area** tied to natural network growth limits (exponential costs).
- No biomes or regions with different rules.

### Fog of War

- Map starts fogged. Placing shapes reveals area around them.
- Shapes reveal circular area based on `BASE_REVEAL_RADIUS`.
- Core has larger reveal radius.

### Discoverable Content

- Boost placements for specific shapes (rare tiles in fog).
- Puzzle slots that reward Cores/skill points when solved.
- No NPCs, lore fragments, or narrative elements (abstract theme).

### Challenge Maps

- Alternative fixed layouts with different buff zone / puzzle slot placement.
- Separate from the main map.

---

## 7. Buff Zones & Map Features

- **Static:** Always in the same positions, never move or rotate.
- **Player cannot create or move** buff zones.
- **Three types:** Power (2x), Flow (1.5x), Growth (1.75x).
- **Possible negative zones:** Areas that don't generate resources but provide a boost multiplier (future consideration).
- **Obstacles/hazards:** Possible future addition, not priority.

---

## 8. Combos & Strategy

### Discovery

- Combos are **hidden until triggered**. Player goes in mostly blind.
- UI shows: "Combos: X/? discovered" -- count only, no names or details until discovered.
- Discovery triggers an animation/notification.
- Secret combos exist as achievements.

### Per-Run

- Combos must be **rebuilt each run** (not permanent unlocks).
- This makes each run's shape placement strategic.

### Depth

- Optimal placement matters significantly. This is not a "place anywhere it's fine" game.

---

## 9. Offline & Idle

### Offline Earnings

- **Base cap:** 8 hours of offline accumulation.
- **Skill extension:** Up to 24 hours with skill investment.
- **Rate:** Reduced compared to online (exact % TBD, starting at ~30%).
- **Ad boost:** Watch ad to double offline rewards.
- **No offline events** (no "meteor hit your network while away").

### Active vs Idle

- Active play should always be significantly better than idle.
- Idle production is the baseline; active play provides strategic placement, combo building, pentagon burst timing, skill optimization.

---

## 10. Events & Live Service

### Seasonal Content

- Approximately monthly events, each lasting one week.
- Exclusive rewards based on performance relative to others.

### Leaderboards

- Event leaderboards with tier grouping (players grouped by level/spending to prevent whale dominance).
- Possible friends leaderboard.

### Backend

- Requires Supabase or similar backend for events, leaderboards, user accounts.
- Design data model early, implement when ready.

---

## 11. Monetization

### Model

- **Free to play** with ads and IAP.

### IAP

- Sell boosts for game progression and events.
- Remove-ads IAP.
- Premium currency for skill respec (after first free respec).

### Ad Integration

- Ad-based boosts: watch ad for 2x production for 30 minutes.
- Watch ad to double offline earnings.

---

## 12. Achievements & Challenges

### Achievements

- ~30 achievements across categories (shapes placed, prestige count, combo discovery, time played, etc.).
- Each achievement gives a tiny permanent multiplier (e.g. +1%).
- Achievements are separate from challenges.

### Challenges

- ~10 challenge modes with modifiers (e.g. "only triangles", "no skill tree", "speed run").
- **Gated by prestige level:** First challenge unlocks at P3, harder ones at P5+.
- Each challenge unlocks unique rewards (cosmetic palette, special buff zone, bonus starting resources).
- Challenge maps: alternative fixed layouts.

---

## 13. Audio & Visuals

### Audio

- SFX only (full soundtrack not priority).
- Chiptune-style sound effects for placement, upgrades, prestige, combos.

### Visuals

- Cyberpunk pixel art UI (CraftPix asset pack).
- CRT filter overlay (scanlines, vignette, flicker, RGB fringing).
- Shapes can pulse/glow but should not rotate.
- Prestige triggers a visual flash effect.
- Color theme selection possible in future.

---

## 14. Endgame & Longevity

- **No ending.** Endless scaling.
- Target: many hours of content before player "sees everything."
- No new game+.
- Replayability through challenges, events, and skill tree experimentation.
