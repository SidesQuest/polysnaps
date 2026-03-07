# 🔷 POLYSNAPS — Game Design Document
# *Snap. Flow. Grow.*

> **Status:** Early concept — core mechanics defined, details evolving
> **Last updated:** March 6, 2026
> **Authors:** Luca & Steen

---

```
  ██████╗  ██████╗ ██╗  ██╗   ██╗███████╗███╗   ██╗ █████╗ ██████╗
  ██╔══██╗██╔═══██╗██║  ╚██╗ ██╔╝██╔════╝████╗  ██║██╔══██╗██╔══██╗
  ██████╔╝██║   ██║██║   ╚████╔╝ ███████╗██╔██╗ ██║███████║██████╔╝
  ██╔═══╝ ██║   ██║██║    ╚██╔╝  ╚════██║██║╚██╗██║██╔══██║██╔═══╝
  ██║     ╚██████╔╝███████╗██║   ███████║██║ ╚████║██║  ██║██║
  ╚═╝      ╚═════╝ ╚══════╝╚═╝   ╚══════╝╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝

               S N A P .  F L O W .  G R O W .
```

---

## 1. Game Identity

| | |
|---|---|
| **Genre** | Incremental / Idle / Factory-builder hybrid |
| **Style** | 2D retro pixel art |
| **Platforms** | Web, Steam (PC), Android, iOS |
| **Name** | **Polysnaps** |
| **Tagline** | *Snap. Flow. Grow.* |
| **Inspirations** | Shapez, Cookie Clicker, Antimatter Dimensions, Realm Grinder |

---

## 2. Core Concept

You build an ever-expanding network of geometric shapes. Resources flow inward from the edges toward a **center shape** — your core. The more shapes you place, the more they generate. The more you prestige, the more sides your core has, the more branches you can build, the more resources flow in.

It's an idle game meets geometric factory builder.

---

## 3. Core Mechanics

### 3.1 The Core Shape

- The game starts with a **triangle** in the center — your core
- The core **collects all resources** that flow inward from connected shapes
- Each **side** of the core is a connection point for a resource branch
- Triangle = 3 sides = 3 branches of production

### 3.2 Placing Shapes

- You place shapes by **snapping them to edges** of existing shapes
- Shapes connect edge-to-edge, free-form (no grid — build in any direction)
- The map is **infinite** — no boundaries, expand however you want
- Every placed shape generates resources that flow **inward toward the core**

### 3.3 Resource Flow

```
Layer 3        Layer 2        Layer 1        CORE
(outermost)    (middle)       (inner)        (center)

   △ ──────►    △ ──────►      △ ──────►      ▲
 generates    generates      generates     collects
 for L2       for L1         for core      everything
```

- Resources always flow **inward** — from outer shapes toward the center
- Each layer of shapes generates resources for the layer closer to the core
- The outermost shapes generate for the shapes they're attached to
- Those shapes generate for the shapes THEY'RE attached to
- All the way down to the core
- This creates a **tree structure** of production chains

### 3.4 Shape Types

You start with only **triangles** (simple generators). As you progress, new shape types unlock:

| Shape | Sides | Role | Unlocked |
|-------|-------|------|----------|
| **Triangle** | 3 | Basic generator | Start |
| **Square** | 4 | TBD (more connections?) | Prestige / upgrade |
| **Pentagon** | 5 | TBD | Later prestige |
| **Hexagon** | 6 | TBD | Later prestige |
| ... | ... | ... | ... |

> **Design note:** More sides = more edges to connect to = more branching potential. A square placed in the outer ring can connect to 3 outgoing shapes (vs triangle's 2), because 1 edge connects inward and the rest connect outward.

Different shape types could serve different roles:
- **Generators** — produce base resources
- **Multipliers** — multiply throughput of connected shapes
- **Storage** — buffer resources (for burst events?)
- **Converters** — turn one resource type into another
- **Special** — unique effects (TBD)

> Shape type details to be designed as we prototype.

---

## 4. Prestige System

### 4.1 Core Prestige

When you prestige:
- Your network resets
- Your **core shape gains a side** (triangle → square → pentagon → hexagon → ...)
- More sides = more connection points = more production branches = exponentially more resources

```
Prestige 0:  △  (3 sides, 3 branches)
Prestige 1:  ■  (4 sides, 4 branches)
Prestige 2:  ⬠  (5 sides, 5 branches)
Prestige 3:  ⬡  (6 sides, 6 branches)
...
```

### 4.2 Prestige Rewards

Each prestige unlocks:
- More sides on the core (more branches)
- New **materials**
- New **upgrades** that require those materials
- New **shape types** to place
- Deeper progression

### 4.3 Prestige Scaling

> TBD: What's the prestige currency? How is it calculated? Does it scale based on total resources earned, shapes placed, or something else?

---

## 5. The Map

### 5.1 Fog of War

- The map starts mostly hidden in **fog**
- Fog clears around placed shapes (you can see nearby)
- Upgrades expand fog reveal radius
- Certain shapes or abilities reveal more fog
- Encourages exploration — what's out there?

### 5.2 Ground Features

The map isn't blank — the ground has special features hidden in the fog:

**Buff Zones:**
- Areas on the map that buff shapes placed within them
- Examples: "shapes in this zone produce 2x", "resource flow through this zone is faster"
- Could also buff the path/flow of resources passing through

**Puzzle Slots:**
- Specific spots on the ground shaped like a particular shape
- If you place the **correct shape** in the slot → earn **skill points**
- Encourages exploration and strategic placement
- Some slots might be rare/hidden deep in the fog

### 5.3 Map Exploration Loop

```
Place shapes → fog clears → discover ground features → 
place shapes strategically on buff zones → 
find puzzle slots → earn skill points → 
unlock skills that reveal more fog → repeat
```

---

## 6. Shape Combos & Patterns

When multiple shapes are arranged in specific patterns, bonus effects trigger:

- Several triangles forming a **star** shape → special buff
- Shapes forming a **larger square** or **sun** pattern → special buff
- Cool **animations** play when a combo is completed
- Combos could grant one-time bonuses, permanent buffs, or unlock content

> **Design note:** This adds a puzzle/discovery layer — players experiment with layouts to find combos. Could have a "combo codex" that shows discovered vs undiscovered patterns.

---

## 7. Skill Tree

> TBD — Luca will detail this later.

Skills are unlocked with **skill points** earned from:
- Filling puzzle slots on the map
- Prestige rewards
- Event rewards
- Other achievements

---

## 8. Permanent Shape Buffs

Shapes can receive **permanent upgrades** that are both cosmetic and functional:

- **Golden edge trim** — shape has a golden outline + stat boost
- **Event rewards** — win limited-time events → get unique shape buffs
- Makes shapes look cool AND perform better
- Motivates players to participate in events and chase rewards
- Possible rarity system? (common, rare, epic, legendary buffs)

> These persist through prestige — they're truly permanent.

---

## 9. Materials & Upgrades

### 9.1 Materials

- Different **material types** are unlocked as you prestige
- Materials are generated by specific shapes or earned through gameplay
- More prestige = more material types

### 9.2 Upgrades

- Upgrades cost different combinations of materials
- More prestige = more upgrades become available
- Upgrades can affect: production speed, resource flow, fog reveal, shape capacity, new shape types, etc.

> **Design note:** This creates a natural progression curve — each prestige tier opens up a new "tech tree" of upgrades that require the newly unlocked materials.

---

## 10. Events System

Live, limited-time events for all players:

- Seasonal events (holidays, special occasions)
- Challenge events (reach X production in Y time)
- Community events (all players contribute to a shared goal)
- Rewards: permanent shape buffs, cosmetics, exclusive materials, skill points

> Event infrastructure: Supabase realtime + edge functions with cron scheduling.

---

## 11. Offline / Idle Progression

- When the player closes the game, production continues
- On return, offline earnings are calculated and awarded
- Possible: offline multiplier upgrades ("earn 50% of production while offline" → upgradeable to 100%+)
- Cap on offline time? Or unlimited? (TBD)

---

## 12. Visual Style

- **2D retro pixel art** — clean, readable, satisfying
- Shapes should be simple but visually distinct
- Resource flow should be **visible** — particles or lines flowing along edges toward the center
- Combos trigger **cool animations**
- Permanent buffs add **visual flair** (golden trim, glows, particle effects)
- Fog should feel mysterious — incentivize exploration
- UI should be clean and not overwhelming (tabs for different systems)

---

## 13. Open Design Questions

- [ ] Game name
- [ ] What are the specific resource types? (gold, energy, mana? or themed?)
- [ ] Skill tree structure and skills
- [ ] Full list of shape types and their roles
- [ ] Prestige currency and scaling formula
- [ ] How many prestige layers? (or infinite?)
- [ ] Monetization model (free + ads? paid? cosmetic MTX?)
- [ ] Multiplayer/social features? (guilds, leaderboards, trading?)
- [ ] What do shape combos specifically do?
- [ ] Material types and how they're generated
- [ ] Offline earning cap or no cap?
- [ ] Tutorial / onboarding flow
- [ ] Sound design direction (chiptune? ambient? both?)
- [ ] Lore / story / world theme?

---

## 14. What Makes This Game Unique

Most idle games are just "click button, number go up." This game has:

1. **Spatial strategy** — WHERE you place shapes matters (buff zones, combos, fog)
2. **Geometric prestige** — gaining sides is a brilliant visual metaphor for growth
3. **Factory-builder depth** — optimizing your shape network like Shapez
4. **Exploration** — fog of war is unusual for idle games, adds curiosity
5. **Puzzle layer** — finding and filling puzzle slots, discovering combos
6. **Visual satisfaction** — watching resources flow through your geometric network

This isn't just another clicker. It's an **idle factory-explorer with geometric puzzle elements.**

---

*More ideas to be added as Luca and Steen flesh out the concept.*
