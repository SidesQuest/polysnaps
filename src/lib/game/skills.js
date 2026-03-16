import { base } from "$app/paths";

const I = (set, num) =>
  `${base}/assets/icons/cyberpunk-skills/1 Icons/${set}/Skillicon${set}_${String(num).padStart(2, "0")}.png`;
const F = (num) =>
  `${base}/assets/icons/cyberpunk-skills/2 Frames/Frame_${String(num).padStart(2, "0")}.png`;

export const BRANCH_DEFS = [
  { id: 0, name: "Production", icon: "⚡", color: "#44aaff", minPrestige: 0 },
  { id: 1, name: "Tap", icon: "👆", color: "#ffcc44", minPrestige: 0 },
  { id: 2, name: "Efficiency", icon: "💰", color: "#55ff99", minPrestige: 0 },
  { id: 3, name: "Flux", icon: "🌀", color: "#ff44aa", minPrestige: 1 },
  { id: 4, name: "Prism", icon: "💎", color: "#aa44ff", minPrestige: 2 },
  { id: 5, name: "Mastery", icon: "🔮", color: "#44ffff", minPrestige: 3 },
];

export const SKILL_DEFS = [
  // ── CENTER ──────────────────────────────────────────
  {
    id: "core-attune",
    name: "Core Attunement",
    description: "+10% all production",
    iconPath: I(7, 1),
    iconFrame: F(6),
    branch: -1,
    ring: 0,
    slot: 0,
    costType: "energy",
    costBase: 25,
    maxLevel: 3,
    effect: { type: "production_mult", value: 0.1 },
    requires: null,
  },

  // ── BRANCH 0: PRODUCTION ───────────────────────────
  {
    id: "gen-speed",
    name: "Generator Speed",
    description: "+10% generator growth rate",
    iconPath: I(1, 5),
    iconFrame: F(1),
    branch: 0,
    ring: 1,
    slot: -0.35,
    costType: "energy",
    costBase: 50,
    maxLevel: 5,
    effect: { type: "gen_speed", value: 0.1 },
    requires: "core-attune",
  },
  {
    id: "base-prod",
    name: "Power Surge",
    description: "+20% base energy production",
    iconPath: I(1, 20),
    iconFrame: F(1),
    branch: 0,
    ring: 1,
    slot: 0.35,
    costType: "energy",
    costBase: 50,
    maxLevel: 5,
    effect: { type: "production_mult", resource: "energy", value: 0.2 },
    requires: "core-attune",
  },
  {
    id: "gen-overdrive",
    name: "Overdrive",
    description: "+15% generator growth rate",
    iconPath: I(1, 8),
    iconFrame: F(1),
    branch: 0,
    ring: 2,
    slot: -0.35,
    costType: "energy",
    costBase: 200,
    maxLevel: 3,
    effect: { type: "gen_speed", value: 0.15 },
    requires: "gen-speed",
  },
  {
    id: "t2-feed",
    name: "Supply Chain",
    description: "+25% T2 feed rate",
    iconPath: I(1, 15),
    iconFrame: F(1),
    branch: 0,
    ring: 2,
    slot: 0.35,
    costType: "energy",
    costBase: 200,
    maxLevel: 5,
    effect: { type: "feed_rate", value: 0.25 },
    requires: "base-prod",
  },
  {
    id: "gen-compound",
    name: "Compound Growth",
    description: "Generators grow 10% faster over time",
    iconPath: I(1, 30),
    iconFrame: F(1),
    branch: 0,
    ring: 3,
    slot: -0.35,
    costType: "prestige",
    costBase: 2,
    maxLevel: 3,
    effect: { type: "gen_compound", value: 0.1 },
    requires: "gen-overdrive",
  },
  {
    id: "deep-cascade",
    name: "Deep Cascade",
    description: "+30% feed rate for T3+ nodes",
    iconPath: I(1, 25),
    iconFrame: F(1),
    branch: 0,
    ring: 3,
    slot: 0.35,
    costType: "prestige",
    costBase: 2,
    maxLevel: 3,
    effect: { type: "deep_feed", value: 0.3 },
    requires: "t2-feed",
  },
  {
    id: "factory-master",
    name: "Factory Master",
    description: "All production +50%",
    iconPath: I(1, 1),
    iconFrame: F(1),
    branch: 0,
    ring: 4,
    slot: 0,
    costType: "prestige",
    costBase: 4,
    maxLevel: 1,
    effect: { type: "production_mult", value: 0.5 },
    requires: "gen-compound",
  },

  // ── BRANCH 1: TAP ─────────────────────────────────
  {
    id: "click-power",
    name: "Power Tap",
    description: "+2 energy per tap",
    iconPath: I(2, 1),
    iconFrame: F(2),
    branch: 1,
    ring: 1,
    slot: -0.35,
    costType: "energy",
    costBase: 40,
    maxLevel: 10,
    effect: { type: "click_bonus", value: 2 },
    requires: "core-attune",
  },
  {
    id: "click-prod",
    name: "Siphon Tap",
    description: "Each tap gives +1% of current production",
    iconPath: I(2, 5),
    iconFrame: F(2),
    branch: 1,
    ring: 1,
    slot: 0.35,
    costType: "energy",
    costBase: 60,
    maxLevel: 5,
    effect: { type: "click_prod_pct", value: 0.01 },
    requires: "core-attune",
  },
  {
    id: "click-burst",
    name: "Power Burst",
    description: "Every 10th tap hits for 10x",
    iconPath: I(2, 10),
    iconFrame: F(2),
    branch: 1,
    ring: 2,
    slot: -0.35,
    costType: "prestige",
    costBase: 1,
    maxLevel: 1,
    effect: { type: "click_burst", value: 10 },
    requires: "click-power",
  },
  {
    id: "click-multi",
    name: "Multi-Resource Tap",
    description: "Taps generate all unlocked resources",
    iconPath: I(2, 15),
    iconFrame: F(2),
    branch: 1,
    ring: 2,
    slot: 0.35,
    costType: "energy",
    costBase: 300,
    maxLevel: 3,
    effect: { type: "click_all_res", value: 0.5 },
    requires: "click-prod",
  },
  {
    id: "auto-click",
    name: "Auto Tap",
    description: "Auto-tap once per second",
    iconPath: I(2, 20),
    iconFrame: F(2),
    branch: 1,
    ring: 3,
    slot: -0.35,
    costType: "prestige",
    costBase: 3,
    maxLevel: 1,
    effect: { type: "auto_click", value: 1 },
    requires: "click-burst",
    unlocks: "auto_click",
  },
  {
    id: "click-wave",
    name: "Shockwave",
    description: "Taps boost nearby generators +5%",
    iconPath: I(2, 25),
    iconFrame: F(2),
    branch: 1,
    ring: 3,
    slot: 0.35,
    costType: "energy",
    costBase: 500,
    maxLevel: 3,
    effect: { type: "click_wave", value: 0.05 },
    requires: "click-multi",
  },
  {
    id: "mega-tap",
    name: "Mega Tap",
    description: "Tap power = 1% of total generators",
    iconPath: I(2, 30),
    iconFrame: F(2),
    branch: 1,
    ring: 4,
    slot: 0,
    costType: "prestige",
    costBase: 4,
    maxLevel: 3,
    effect: { type: "mega_tap_pct", value: 0.01 },
    requires: "auto-click",
  },

  // ── BRANCH 2: EFFICIENCY ──────────────────────────
  {
    id: "cost-reduce",
    name: "Efficient Design",
    description: "-10% shape placement cost",
    iconPath: I(5, 1),
    iconFrame: F(5),
    branch: 2,
    ring: 1,
    slot: -0.35,
    costType: "energy",
    costBase: 50,
    maxLevel: 5,
    effect: { type: "cost_reduction", value: 0.1 },
    requires: "core-attune",
  },
  {
    id: "tier-discount",
    name: "Forge Mastery",
    description: "-10% tier upgrade cost",
    iconPath: I(5, 5),
    iconFrame: F(5),
    branch: 2,
    ring: 1,
    slot: 0.35,
    costType: "energy",
    costBase: 50,
    maxLevel: 5,
    effect: { type: "tier_cost_reduction", value: 0.1 },
    requires: "core-attune",
  },
  {
    id: "bulk-place",
    name: "Bulk Placement",
    description: "Place shapes on all empty core slots at once",
    iconPath: I(5, 10),
    iconFrame: F(5),
    branch: 2,
    ring: 2,
    slot: -0.35,
    costType: "prestige",
    costBase: 2,
    maxLevel: 1,
    effect: { type: "bulk_place", value: 1 },
    requires: "cost-reduce",
    unlocks: "bulk_place",
  },
  {
    id: "combo-boost",
    name: "Pattern Mastery",
    description: "+10% combo multiplier bonus",
    iconPath: I(5, 15),
    iconFrame: F(5),
    branch: 2,
    ring: 2,
    slot: 0.35,
    costType: "energy",
    costBase: 250,
    maxLevel: 3,
    effect: { type: "combo_boost", value: 0.1 },
    requires: "tier-discount",
  },
  {
    id: "auto-place",
    name: "Auto Builder",
    description: "Auto-place cheapest shape every 30s",
    iconPath: I(5, 20),
    iconFrame: F(5),
    branch: 2,
    ring: 3,
    slot: -0.35,
    costType: "prestige",
    costBase: 3,
    maxLevel: 1,
    effect: { type: "auto_place", value: 1 },
    requires: "bulk-place",
    unlocks: "auto_place",
  },
  {
    id: "combo-master",
    name: "Combo Virtuoso",
    description: "+1 active combo slot",
    iconPath: I(5, 25),
    iconFrame: F(5),
    branch: 2,
    ring: 3,
    slot: 0.35,
    costType: "prestige",
    costBase: 3,
    maxLevel: 1,
    effect: { type: "combo_slots", value: 1 },
    requires: "combo-boost",
  },
  {
    id: "architect",
    name: "Grand Architect",
    description: "Tier 1 shapes are free to place",
    iconPath: I(5, 30),
    iconFrame: F(5),
    branch: 2,
    ring: 4,
    slot: 0,
    costType: "prestige",
    costBase: 5,
    maxLevel: 1,
    effect: { type: "free_t1", value: 1 },
    requires: "auto-place",
    unlocks: "free_t1",
  },

  // ── BRANCH 3: FLUX (P1+) ─────────────────────────
  {
    id: "flux-surge",
    name: "Flux Surge",
    description: "+25% flux production",
    iconPath: I(3, 1),
    iconFrame: F(4),
    branch: 3,
    ring: 1,
    slot: -0.35,
    costType: "flux",
    costBase: 30,
    maxLevel: 5,
    effect: { type: "production_mult", resource: "flux", value: 0.25 },
    requires: "core-attune",
  },
  {
    id: "flux-tap",
    name: "Flux Siphon",
    description: "Taps also generate flux",
    iconPath: I(3, 5),
    iconFrame: F(4),
    branch: 3,
    ring: 1,
    slot: 0.35,
    costType: "flux",
    costBase: 40,
    maxLevel: 3,
    effect: { type: "flux_tap", value: 0.3 },
    requires: "core-attune",
  },
  {
    id: "flux-cascade",
    name: "Flux Cascade",
    description: "+20% feed rate on flux-producing sides",
    iconPath: I(3, 10),
    iconFrame: F(4),
    branch: 3,
    ring: 2,
    slot: -0.35,
    costType: "flux",
    costBase: 150,
    maxLevel: 3,
    effect: { type: "flux_feed", value: 0.2 },
    requires: "flux-surge",
  },
  {
    id: "flux-convert",
    name: "Transmutation",
    description: "Convert energy to flux at 10:1 ratio",
    iconPath: I(3, 15),
    iconFrame: F(4),
    branch: 3,
    ring: 2,
    slot: 0.35,
    costType: "flux",
    costBase: 100,
    maxLevel: 3,
    effect: { type: "flux_convert", value: 0.1 },
    requires: "flux-tap",
  },
  {
    id: "flux-resonance",
    name: "Resonance Field",
    description: "Flux boosts all production by 0.1% per unit",
    iconPath: I(3, 20),
    iconFrame: F(4),
    branch: 3,
    ring: 3,
    slot: -0.35,
    costType: "prestige",
    costBase: 3,
    maxLevel: 3,
    effect: { type: "flux_resonance", value: 0.001 },
    requires: "flux-cascade",
  },
  {
    id: "flux-overflow",
    name: "Overflow Valve",
    description: "Excess flux converts to energy at 1:5",
    iconPath: I(3, 25),
    iconFrame: F(4),
    branch: 3,
    ring: 3,
    slot: 0.35,
    costType: "prestige",
    costBase: 2,
    maxLevel: 1,
    effect: { type: "flux_overflow", value: 5 },
    requires: "flux-convert",
    unlocks: "flux_overflow",
  },
  {
    id: "flux-master",
    name: "Flux Singularity",
    description: "All flux production x2",
    iconPath: I(3, 30),
    iconFrame: F(4),
    branch: 3,
    ring: 4,
    slot: 0,
    costType: "prestige",
    costBase: 5,
    maxLevel: 1,
    effect: { type: "production_mult", resource: "flux", value: 1.0 },
    requires: "flux-resonance",
  },

  // ── BRANCH 4: PRISM (P2+) ────────────────────────
  {
    id: "prism-surge",
    name: "Prism Amplifier",
    description: "+25% prism production",
    iconPath: I(10, 1),
    iconFrame: F(3),
    branch: 4,
    ring: 1,
    slot: -0.35,
    costType: "prisms",
    costBase: 15,
    maxLevel: 5,
    effect: { type: "production_mult", resource: "prisms", value: 0.25 },
    requires: "core-attune",
  },
  {
    id: "prism-lens",
    name: "Prismatic Lens",
    description: "Buff zones are 30% stronger",
    iconPath: I(10, 5),
    iconFrame: F(3),
    branch: 4,
    ring: 1,
    slot: 0.35,
    costType: "prisms",
    costBase: 20,
    maxLevel: 3,
    effect: { type: "zone_power", value: 0.3 },
    requires: "core-attune",
  },
  {
    id: "prism-refract",
    name: "Refraction",
    description: "Prism nodes boost adjacent branch production +10%",
    iconPath: I(10, 10),
    iconFrame: F(3),
    branch: 4,
    ring: 2,
    slot: -0.35,
    costType: "prisms",
    costBase: 60,
    maxLevel: 3,
    effect: { type: "prism_refract", value: 0.1 },
    requires: "prism-surge",
  },
  {
    id: "prism-sight",
    name: "Crystal Vision",
    description: "Buff zone range +20%",
    iconPath: I(10, 15),
    iconFrame: F(3),
    branch: 4,
    ring: 2,
    slot: 0.35,
    costType: "prisms",
    costBase: 50,
    maxLevel: 3,
    effect: { type: "zone_range", value: 0.2 },
    requires: "prism-lens",
  },
  {
    id: "prism-amplify",
    name: "Prestige Resonance",
    description: "+10% all resources per prestige level",
    iconPath: I(10, 20),
    iconFrame: F(3),
    branch: 4,
    ring: 3,
    slot: -0.35,
    costType: "prestige",
    costBase: 3,
    maxLevel: 3,
    effect: { type: "prestige_prod_mult", value: 0.1 },
    requires: "prism-refract",
  },
  {
    id: "prism-focus",
    name: "Infinite Focus",
    description: "Remove generator count soft cap",
    iconPath: I(10, 25),
    iconFrame: F(3),
    branch: 4,
    ring: 3,
    slot: 0.35,
    costType: "prestige",
    costBase: 3,
    maxLevel: 1,
    effect: { type: "gen_uncap", value: 1 },
    requires: "prism-sight",
    unlocks: "gen_uncap",
  },
  {
    id: "prism-master",
    name: "Prism Nexus",
    description: "All prism production x2",
    iconPath: I(10, 30),
    iconFrame: F(3),
    branch: 4,
    ring: 4,
    slot: 0,
    costType: "prestige",
    costBase: 5,
    maxLevel: 1,
    effect: { type: "production_mult", resource: "prisms", value: 1.0 },
    requires: "prism-amplify",
  },

  // ── BRANCH 5: MASTERY (P3+) ──────────────────────
  {
    id: "prestige-speed",
    name: "Accelerated Prestige",
    description: "-10% prestige threshold",
    iconPath: I(9, 1),
    iconFrame: F(7),
    branch: 5,
    ring: 1,
    slot: -0.35,
    costType: "prestige",
    costBase: 1,
    maxLevel: 5,
    effect: { type: "prestige_threshold", value: 0.1 },
    requires: "core-attune",
  },
  {
    id: "prestige-reward",
    name: "Prestige Bounty",
    description: "+1 Core on prestige",
    iconPath: I(9, 5),
    iconFrame: F(7),
    branch: 5,
    ring: 1,
    slot: 0.35,
    costType: "prestige",
    costBase: 2,
    maxLevel: 3,
    effect: { type: "prestige_reward", value: 1 },
    requires: "core-attune",
  },
  {
    id: "prestige-keeper",
    name: "Generator Memory",
    description: "Keep 10% of generators on prestige",
    iconPath: I(9, 10),
    iconFrame: F(7),
    branch: 5,
    ring: 2,
    slot: -0.35,
    costType: "prestige",
    costBase: 3,
    maxLevel: 3,
    effect: { type: "prestige_keep_gen", value: 0.1 },
    requires: "prestige-speed",
  },
  {
    id: "prestige-memory",
    name: "Tier Memory",
    description: "Keep tier levels on prestige",
    iconPath: I(9, 15),
    iconFrame: F(7),
    branch: 5,
    ring: 2,
    slot: 0.35,
    costType: "prestige",
    costBase: 4,
    maxLevel: 1,
    effect: { type: "prestige_keep_tiers", value: 1 },
    requires: "prestige-reward",
    unlocks: "prestige_keep_tiers",
  },
  {
    id: "offline-prod",
    name: "Dream Factory",
    description: "+25% offline production",
    iconPath: I(9, 20),
    iconFrame: F(7),
    branch: 5,
    ring: 3,
    slot: -0.35,
    costType: "prestige",
    costBase: 3,
    maxLevel: 5,
    effect: { type: "offline_mult", value: 0.25 },
    requires: "prestige-keeper",
  },
  {
    id: "offline-gen",
    name: "Dream Generators",
    description: "Generators grow while offline",
    iconPath: I(9, 25),
    iconFrame: F(7),
    branch: 5,
    ring: 3,
    slot: 0.35,
    costType: "prestige",
    costBase: 4,
    maxLevel: 3,
    effect: { type: "offline_gen", value: 0.5 },
    requires: "prestige-memory",
  },
  {
    id: "offline-cap",
    name: "Extended Dreams",
    description: "+100% offline time cap (8h -> 16h -> 24h)",
    iconPath: I(9, 28),
    iconFrame: F(7),
    branch: 5,
    ring: 3,
    slot: 0,
    costType: "prestige",
    costBase: 3,
    maxLevel: 2,
    effect: { type: "offline_cap", value: 1.0 },
    requires: "offline-prod",
  },
  {
    id: "ascension",
    name: "Ascension",
    description: "Unlock the next resource tier early",
    iconPath: I(9, 30),
    iconFrame: F(7),
    branch: 5,
    ring: 4,
    slot: 0,
    costType: "prestige",
    costBase: 8,
    maxLevel: 1,
    effect: { type: "ascension", value: 1 },
    requires: "offline-prod",
    unlocks: "ascension",
  },
  {
    id: "auto-release",
    name: "Auto Release",
    description: "Pentagons auto-release at 95% capacity",
    iconPath: I(9, 22),
    iconFrame: F(7),
    branch: 5,
    ring: 4,
    slot: 0.35,
    costType: "prestige",
    costBase: 5,
    maxLevel: 1,
    effect: { type: "auto_release", value: 1 },
    requires: "offline-gen",
    unlocks: "auto_release",
  },

  // ── REPEATABLE SINK SKILLS ─────────────────────────
  {
    id: "rep-power-cell",
    name: "Power Cell",
    description: "+2% all production (repeatable)",
    iconPath: I(1, 3),
    iconFrame: F(1),
    branch: 0,
    ring: 4,
    slot: 0.35,
    costType: "prestige",
    costBase: 1,
    maxLevel: 50,
    repeatable: true,
    effect: { type: "production_mult", value: 0.02 },
    requires: "factory-master",
  },
  {
    id: "rep-precision-tap",
    name: "Precision Tap",
    description: "+1 click value (repeatable)",
    iconPath: I(2, 3),
    iconFrame: F(2),
    branch: 1,
    ring: 4,
    slot: 0.35,
    costType: "prestige",
    costBase: 1,
    maxLevel: 20,
    repeatable: true,
    effect: { type: "click_bonus", value: 1 },
    requires: "mega-tap",
  },
  {
    id: "rep-streamlined",
    name: "Streamlined",
    description: "-1% shape cost (repeatable)",
    iconPath: I(5, 3),
    iconFrame: F(5),
    branch: 2,
    ring: 4,
    slot: 0.35,
    costType: "prestige",
    costBase: 1,
    maxLevel: 25,
    repeatable: true,
    effect: { type: "cost_reduction", value: 0.01 },
    requires: "architect",
  },
  {
    id: "rep-flux-cap",
    name: "Flux Capacitor",
    description: "+3% flux production (repeatable)",
    iconPath: I(3, 3),
    iconFrame: F(4),
    branch: 3,
    ring: 4,
    slot: 0.35,
    costType: "prestige",
    costBase: 1,
    maxLevel: 30,
    repeatable: true,
    effect: { type: "production_mult", resource: "flux", value: 0.03 },
    requires: "flux-master",
  },
  {
    id: "rep-crystal-growth",
    name: "Crystal Growth",
    description: "+3% prism production (repeatable)",
    iconPath: I(10, 3),
    iconFrame: F(3),
    branch: 4,
    ring: 4,
    slot: 0.35,
    costType: "prestige",
    costBase: 1,
    maxLevel: 30,
    repeatable: true,
    effect: { type: "production_mult", resource: "prisms", value: 0.03 },
    requires: "prism-master",
  },
  {
    id: "rep-core-resonance",
    name: "Core Resonance",
    description: "+2% prestige reward (repeatable)",
    iconPath: I(9, 3),
    iconFrame: F(7),
    branch: 5,
    ring: 4,
    slot: -0.35,
    costType: "prestige",
    costBase: 2,
    maxLevel: 20,
    repeatable: true,
    effect: { type: "prestige_reward", value: 0.2 },
    requires: "ascension",
  },
  {
    id: "rep-idle-amp",
    name: "Idle Amplifier",
    description: "+2% offline rate (repeatable)",
    iconPath: I(9, 8),
    iconFrame: F(7),
    branch: 5,
    ring: 5,
    slot: 0,
    costType: "prestige",
    costBase: 1,
    maxLevel: 25,
    repeatable: true,
    effect: { type: "offline_mult", value: 0.02 },
    requires: "rep-core-resonance",
  },
];

// ── helpers ──────────────────────────────────────────

export function getSkillDef(skillId) {
  return SKILL_DEFS.find((s) => s.id === skillId);
}

export function getSkillLevel(skills, skillId) {
  return skills[skillId] || 0;
}

export function isBranchVisible(prestigeLevel, branchId) {
  if (branchId === -1) return true;
  const branch = BRANCH_DEFS.find((b) => b.id === branchId);
  return branch ? prestigeLevel >= branch.minPrestige : false;
}

export function canUnlockSkill(skills, skillId, prestigeLevel) {
  const def = getSkillDef(skillId);
  if (!def) return false;
  if (!isBranchVisible(prestigeLevel, def.branch)) return false;
  if (def.requires && !skills[def.requires]) return false;
  const current = skills[skillId] || 0;
  return current < def.maxLevel;
}

export function getSkillCost(skills, skillId) {
  const def = getSkillDef(skillId);
  if (!def) return Infinity;
  const current = skills[skillId] || 0;
  return Math.ceil(def.costBase * (current + 1));
}

export function getSkillEffect(skills, effectType, resource) {
  let total = 0;
  for (const def of SKILL_DEFS) {
    const level = skills[def.id] || 0;
    if (level === 0) continue;
    if (def.effect.type !== effectType) continue;
    if (resource && def.effect.resource && def.effect.resource !== resource)
      continue;
    total += def.effect.value * level;
  }
  return total;
}

export function getSkillConnections(prestigeLevel) {
  const connections = [];
  for (const def of SKILL_DEFS) {
    if (!def.requires) continue;
    if (!isBranchVisible(prestigeLevel, def.branch)) continue;
    const parent = getSkillDef(def.requires);
    if (parent && isBranchVisible(prestigeLevel, parent.branch)) {
      connections.push({ from: parent, to: def });
    }
  }
  return connections;
}

export function getVisibleSkills(prestigeLevel) {
  return SKILL_DEFS.filter((def) => isBranchVisible(prestigeLevel, def.branch));
}

export function getVisibility(skills, prestigeLevel) {
  const visibility = {};

  for (const def of SKILL_DEFS) {
    if (!isBranchVisible(prestigeLevel, def.branch)) continue;
    const level = skills[def.id] || 0;
    if (level > 0) {
      visibility[def.id] = "unlocked";
    }
  }

  if (!Object.keys(visibility).length) {
    visibility["core-attune"] = "available";
  }

  for (const def of SKILL_DEFS) {
    if (visibility[def.id]) continue;
    if (!isBranchVisible(prestigeLevel, def.branch)) continue;
    if (def.requires && visibility[def.requires]) {
      visibility[def.id] = "available";
    }
  }

  for (const def of SKILL_DEFS) {
    if (visibility[def.id]) continue;
    if (!isBranchVisible(prestigeLevel, def.branch)) continue;

    let nearVisible = false;
    for (const otherDef of SKILL_DEFS) {
      if (!visibility[otherDef.id]) continue;
      if (otherDef.id === def.requires || def.id === otherDef.requires) {
        nearVisible = true;
        break;
      }
      const otherReqsDef = SKILL_DEFS.find((s) => s.requires === def.id);
      if (otherReqsDef && visibility[otherReqsDef.id]) {
        nearVisible = true;
        break;
      }
    }
    if (nearVisible) {
      visibility[def.id] = "foggy";
    }
  }

  return visibility;
}

const RING_SPACING = 140;

export function getSkillPosition(def, prestigeLevel) {
  if (def.ring === 0) return { x: 0, y: 0 };

  const visibleBranches = BRANCH_DEFS.filter(
    (b) => prestigeLevel >= b.minPrestige,
  );
  const branchIdx = visibleBranches.findIndex((b) => b.id === def.branch);
  if (branchIdx < 0) return null;

  const sectorAngle = (2 * Math.PI) / visibleBranches.length;
  const baseAngle = sectorAngle * branchIdx - Math.PI / 2;
  const angle = baseAngle + def.slot * sectorAngle * 0.5;
  const radius = def.ring * RING_SPACING;

  return {
    x: radius * Math.cos(angle),
    y: radius * Math.sin(angle),
  };
}
