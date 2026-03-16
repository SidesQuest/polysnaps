import { base } from "$app/paths";
import {
  getShapeCost,
  SHAPE_DEFS,
  buildGeometryTree,
  getOpenSlots,
  getUnlockedShapes,
  wouldOverlap,
  getAttachedShapeVertices,
  getPolygonCenter,
  getCoreVertices,
  getFreeEdges,
} from "./shapes.js";
import { getComboMultiplier, getActiveCombos, getAllCombos } from "./combos.js";
import { generateBuffZones, getZoneBonus } from "./buffzones.js";
import {
  getRevealedCells,
  generatePuzzleSlots,
  checkPuzzleSlot,
  isPointRevealed,
} from "./fog.js";
import {
  playPlace,
  playUpgrade,
  playPrestige,
  playCombo,
  playBurst,
  playAchievement,
} from "./audio.js";
import {
  getSkillEffect,
  canUnlockSkill,
  getSkillCost,
  getSkillDef,
  SKILL_DEFS,
} from "./skills.js";
import { checkAchievements, getAchievementMultiplier } from "./achievements.js";
import {
  getChallengeModifier,
  getChallengeRewards,
  checkChallengeComplete,
} from "./challenges.js";
import { getRespecCost } from "./iap.js";

let nextId = 1;
let prevComboCount = 0;

export const RESOURCE_DEFS = {
  energy: {
    name: "Energy",
    color: "#44aaff",
    icon: "⚡",
    iconPath: `${base}/assets/icons/cyberpunk-skills/1 Icons/1/Skillicon1_20.png`,
    minPrestige: 0,
  },
  flux: {
    name: "Flux",
    color: "#ff44aa",
    icon: "🌀",
    iconPath: `${base}/assets/icons/cyberpunk-skills/1 Icons/10/Skillicon10_20.png`,
    minPrestige: 1,
    minLayer: 2,
  },
  prisms: {
    name: "Prisms",
    color: "#aa44ff",
    icon: "💎",
    iconPath: `${base}/assets/icons/cyberpunk-skills/1 Icons/10/Skillicon10_05.png`,
    minPrestige: 2,
    minLayer: 3,
  },
};

export function getEffectivePrestigeForResources() {
  return (
    gameState.prestige.level + getSkillEffect(gameState.skills, "ascension")
  );
}

export function getUnlockedResources() {
  const eff = getEffectivePrestigeForResources();
  return Object.entries(RESOURCE_DEFS)
    .filter(([, def]) => eff >= def.minPrestige)
    .map(([key, def]) => ({ key, ...def }));
}

export const gameState = $state({
  resources: {
    energy: 0,
    flux: 0,
    prisms: 0,
  },
  coreShape: {
    sides: 3,
    type: "triangle",
  },
  nodes: [
    { id: "core", parentId: null, shape: "triangle", edgeIndex: -1, level: 1 },
  ],
  prestige: {
    level: 0,
    currency: 0,
    totalPrestigeEnergy: 0,
    totalCoresEarned: 0,
    respecCount: 0,
  },
  tierLevels: {},
  generatorCounts: {},
  skills: {},
  tapCount: 0,
  generatorBonus: 0,
  skillPoints: 0,
  solvedPuzzles: [],
  pentagonStorage: {},
  discoveredCombos: [],
  achievements: [],
  completedChallenges: [],
  activeChallenge: null,
  removeAds: false,
  stats: {
    totalEnergyEarned: 0,
    totalShapesPlaced: 0,
    timePlayed: 0,
    pentagonBursts: 0,
    runTime: 0,
  },
});

export function getPlacedCount() {
  return gameState.nodes.length - 1;
}

export function getNodeDepth(nodeId) {
  let depth = 0;
  let current = gameState.nodes.find((n) => n.id === nodeId);
  while (current && current.parentId) {
    depth++;
    current = gameState.nodes.find((n) => n.id === current.parentId);
  }
  return depth;
}

export function getMaxDepth() {
  let max = 0;
  for (const node of gameState.nodes) {
    if (node.id === "core") continue;
    max = Math.max(max, getNodeDepth(node.id));
  }
  return max;
}

export function getNodeChildren(nodeId) {
  return gameState.nodes.filter((n) => n.parentId === nodeId);
}

export function getNodeCoreSide(nodeId) {
  let current = gameState.nodes.find((n) => n.id === nodeId);
  while (current && current.parentId !== "core" && current.parentId !== null) {
    current = gameState.nodes.find((n) => n.id === current.parentId);
  }
  return current ? current.edgeIndex : 0;
}

export function getTierLevel(tier) {
  return gameState.tierLevels[tier] || 1;
}

export function getEdgeResource(edgeIndex) {
  const eff = getEffectivePrestigeForResources();
  const unlocked = Object.entries(RESOURCE_DEFS)
    .filter(([, def]) => eff >= def.minPrestige)
    .map(([key]) => key);
  if (unlocked.length === 0) return "energy";
  return unlocked[edgeIndex % unlocked.length];
}

export function getNodeResource(nodeId) {
  const edgeIdx = getNodeCoreSide(nodeId);
  return getEdgeResource(edgeIdx);
}

export function getGeneratorCount(nodeId) {
  return gameState.generatorCounts[nodeId] || 1;
}

export function getNodeProduction(nodeId) {
  const node = gameState.nodes.find((n) => n.id === nodeId);
  if (!node || node.id === "core") return 0;

  const depth = getNodeDepth(nodeId);
  if (depth > 1) return 0;

  const def = SHAPE_DEFS[node.shape];
  if (!def) return 0;

  const tierLvl = getTierLevel(depth);
  const genCount = getGeneratorCount(nodeId);
  let prod = def.baseProduction * tierLvl * genCount;

  if (def.role === "multiplier") {
    const parent = gameState.nodes.find((n) => n.id === node.parentId);
    if (parent && parent.id !== "core") {
      const parentProd = SHAPE_DEFS[parent.shape]?.baseProduction || 1;
      prod = parentProd * tierLvl * genCount * (def.multiplierValue || 1.5);
    }
  }

  return prod;
}

export function getMultiplierBonus(nodeId) {
  let bonus = 1;
  const children = getNodeChildren(nodeId);
  for (const child of children) {
    const childDef = SHAPE_DEFS[child.shape];
    if (childDef && childDef.role === "multiplier") {
      bonus *= childDef.multiplierValue || 1.5;
    }
  }
  return bonus;
}

// ── Hexagon synergy ──────────────────────────────────

function getHexagonSynergyBonus() {
  let bonus = 1;
  for (const node of gameState.nodes) {
    if (node.id === "core") continue;
    if (getNodeDepth(node.id) !== 1) continue;
    const def = SHAPE_DEFS[node.shape];
    if (def && def.role === "synergy") {
      bonus *= 1 + (def.synergyBoost || 0.15);
    }
  }
  return bonus;
}

// ── Pentagon storage ─────────────────────────────────

export function getPentagonCapacity(nodeId) {
  const node = gameState.nodes.find((n) => n.id === nodeId);
  if (!node) return 0;
  const def = SHAPE_DEFS[node.shape];
  if (!def || def.role !== "storage") return 0;
  const tierLvl = getTierLevel(getNodeDepth(nodeId));
  const challengeRewards = getChallengeRewards(gameState.completedChallenges);
  const capacityBonus = 1 + (challengeRewards.storage_capacity || 0);
  return (def.storageCapacity || 100) * tierLvl * capacityBonus;
}

export function getPentagonStorage(nodeId) {
  return gameState.pentagonStorage[nodeId] || 0;
}

export function releasePentagonBurst(nodeId) {
  const stored = getPentagonStorage(nodeId);
  if (stored <= 0) return 0;

  const node = gameState.nodes.find((n) => n.id === nodeId);
  if (!node) return 0;
  const def = SHAPE_DEFS[node.shape];
  if (!def || def.role !== "storage") return 0;

  const burstAmount = stored * (def.burstMultiplier || 1.5);
  const res = getNodeResource(nodeId);
  addResource(res, burstAmount);
  gameState.pentagonStorage[nodeId] = 0;
  gameState.stats.pentagonBursts = (gameState.stats.pentagonBursts || 0) + 1;
  playBurst();
  return burstAmount;
}

export function tickPentagonStorage(delta) {
  for (const node of gameState.nodes) {
    if (node.id === "core") continue;
    if (getNodeDepth(node.id) !== 1) continue;
    const def = SHAPE_DEFS[node.shape];
    if (!def || def.role !== "storage") continue;

    const prod = getNodeProduction(node.id);
    const capacity = getPentagonCapacity(node.id);
    const current = gameState.pentagonStorage[node.id] || 0;

    if (current < capacity) {
      gameState.pentagonStorage[node.id] = Math.min(
        capacity,
        current + prod * delta,
      );
    }
  }

  const autoRelease = getSkillEffect(gameState.skills, "auto_release");
  if (autoRelease > 0) {
    for (const node of gameState.nodes) {
      if (node.id === "core") continue;
      const def = SHAPE_DEFS[node.shape];
      if (!def || def.role !== "storage") continue;
      const capacity = getPentagonCapacity(node.id);
      const current = gameState.pentagonStorage[node.id] || 0;
      if (current >= capacity * 0.95) {
        releasePentagonBurst(node.id);
      }
    }
  }
}

// ── Cross-boosting (stockpile-based) ─────────────────

function getCrossBoost(resource) {
  const BOOST_MULT = 0.1;
  if (resource === "energy") {
    return 1 + Math.log10(Math.max(1, gameState.resources.flux)) * BOOST_MULT;
  }
  if (resource === "flux") {
    return 1 + Math.log10(Math.max(1, gameState.resources.prisms)) * BOOST_MULT;
  }
  if (resource === "prisms") {
    return 1 + Math.log10(Math.max(1, gameState.resources.energy)) * BOOST_MULT;
  }
  return 1;
}

// ── Fog, puzzles, zones ──────────────────────────────

export function getFogState() {
  const geo = buildGeometryTree(gameState.nodes, gameState.coreShape.sides, 50);
  return getRevealedCells(gameState.nodes, geo);
}

export function getPuzzleSlots() {
  return generatePuzzleSlots(
    gameState.prestige.level,
    gameState.coreShape.sides,
  );
}

export function solvePuzzleSlot(slotId) {
  if (gameState.solvedPuzzles.includes(slotId)) return false;
  const puzzles = getPuzzleSlots();
  const slot = puzzles.find((p) => p.id === slotId);
  if (!slot) return false;

  const geo = buildGeometryTree(gameState.nodes, gameState.coreShape.sides, 50);
  if (checkPuzzleSlot(slot, gameState.nodes, geo)) {
    gameState.solvedPuzzles.push(slotId);
    gameState.skillPoints += slot.reward;
    return true;
  }
  return false;
}

export function tickPuzzleChecks() {
  const puzzles = getPuzzleSlots();
  const geo = buildGeometryTree(gameState.nodes, gameState.coreShape.sides, 50);
  const revealed = getRevealedCells(gameState.nodes, geo);

  for (const slot of puzzles) {
    if (gameState.solvedPuzzles.includes(slot.id)) continue;
    if (!isPointRevealed(slot.x, slot.y, revealed)) continue;
    if (checkPuzzleSlot(slot, gameState.nodes, geo)) {
      gameState.solvedPuzzles.push(slot.id);
      gameState.skillPoints += slot.reward;
    }
  }
}

export function getBuffZones() {
  return generateBuffZones(
    gameState.prestige.level,
    gameState.coreShape.sides,
    {
      _zoneRange: getSkillEffect(gameState.skills, "zone_range"),
      _zonePower: getSkillEffect(gameState.skills, "zone_power"),
    },
  );
}

export function getCurrentCombos() {
  return getActiveCombos(gameState.nodes, gameState.coreShape.sides);
}

// ── Production calculation ───────────────────────────

export function getProductionByResource() {
  const comboBoost = getSkillEffect(gameState.skills, "combo_boost");
  const comboSlots = getSkillEffect(gameState.skills, "combo_slots");
  const activeCombos = getActiveCombos(
    gameState.nodes,
    gameState.coreShape.sides,
  );
  let comboMult = getComboMultiplier(
    gameState.nodes,
    gameState.coreShape.sides,
  );
  comboMult *= 1 + comboBoost;
  comboMult += comboSlots * activeCombos.length * 0.05;

  const fluxFeedMult = 1 + getSkillEffect(gameState.skills, "flux_feed");
  const refractBonus = getSkillEffect(gameState.skills, "prism_refract");
  const prestigeProdMult = getSkillEffect(
    gameState.skills,
    "prestige_prod_mult",
  );
  const prestigeBonus = 1 + prestigeProdMult * gameState.prestige.level;
  const fluxResonance = getSkillEffect(gameState.skills, "flux_resonance");
  const resonanceBonus = 1 + fluxResonance * gameState.resources.flux;
  const fluxOverflow = getSkillEffect(gameState.skills, "flux_overflow");

  const zones = getBuffZones();
  const geo = buildGeometryTree(gameState.nodes, gameState.coreShape.sides, 50);
  const geoMap = new Map(geo.map((g) => [g.node.id, g]));

  const result = { energy: 0, flux: 0, prisms: 0 };

  for (const node of gameState.nodes) {
    if (node.id === "core") continue;
    const depth = getNodeDepth(node.id);
    if (depth !== 1) continue;

    const def = SHAPE_DEFS[node.shape];
    if (def && def.role === "storage") continue;

    let prod = getNodeProduction(node.id);

    const nodeGeo = geoMap.get(node.id);
    if (nodeGeo) {
      prod *= getZoneBonus(nodeGeo.center, zones);
    }

    const res = getNodeResource(node.id);
    if (res === "flux") prod *= fluxFeedMult;
    if (res === "prisms" && refractBonus > 0) prod *= 1 + refractBonus;

    if (result[res] !== undefined) {
      result[res] += prod;
    } else {
      result.energy += prod;
    }
  }

  const hexSynergy = getHexagonSynergyBonus();
  const achievementMult = getAchievementMultiplier(gameState.achievements);
  const coresPassive = 1 + gameState.prestige.currency * 0.01;
  const challengeRewards = getChallengeRewards(gameState.completedChallenges);

  const globalMult =
    comboMult *
    prestigeBonus *
    resonanceBonus *
    hexSynergy *
    achievementMult *
    coresPassive;
  const challengeProdMult = 1 + (challengeRewards.production_mult || 0);

  result.energy *=
    globalMult *
    challengeProdMult *
    getCrossBoost("energy") *
    (1 + getSkillEffect(gameState.skills, "production_mult", "energy"));
  result.flux *=
    globalMult *
    challengeProdMult *
    getCrossBoost("flux") *
    (1 + getSkillEffect(gameState.skills, "production_mult", "flux"));
  result.prisms *=
    globalMult *
    challengeProdMult *
    getCrossBoost("prisms") *
    (1 + getSkillEffect(gameState.skills, "production_mult", "prisms"));

  if (fluxOverflow > 0 && result.flux > 0) {
    result.energy += result.flux * fluxOverflow * 0.01;
  }

  return result;
}

export function getTotalProduction() {
  return getProductionByResource().energy;
}

// ── Shape costs (multi-resource) ─────────────────────

export function getShapeResourceCosts(shapeType = "triangle") {
  if (
    shapeType === "triangle" &&
    getSkillEffect(gameState.skills, "free_t1") > 0
  )
    return { energy: 0, flux: 0, prisms: 0 };

  const def = SHAPE_DEFS[shapeType] || SHAPE_DEFS.triangle;
  const baseCost = getShapeCost(getPlacedCount(), shapeType);
  const reduction = getSkillEffect(gameState.skills, "cost_reduction");
  const energyCost = Math.max(1, Math.floor(baseCost * (1 - reduction)));

  const costs = { energy: 0, flux: 0, prisms: 0 };
  const ratios = def.costResources || { energy: 1.0 };

  for (const [res, ratio] of Object.entries(ratios)) {
    if (
      getEffectivePrestigeForResources() <
      (RESOURCE_DEFS[res]?.minPrestige || 0)
    )
      continue;
    costs[res] = Math.max(
      res === "energy" ? 1 : 0,
      Math.floor(energyCost * ratio),
    );
  }

  return costs;
}

export function getNextShapeCost(shapeType = "triangle") {
  return getShapeResourceCosts(shapeType).energy;
}

export function canAffordShape(shapeType = "triangle") {
  const costs = getShapeResourceCosts(shapeType);
  return Object.entries(costs).every(
    ([res, cost]) => gameState.resources[res] >= cost,
  );
}

export function getAvailableShapes() {
  const eff = getEffectivePrestigeForResources();
  let shapes = getUnlockedShapes(eff);

  const mod = gameState.activeChallenge
    ? getChallengeModifier(gameState.activeChallenge)
    : null;
  if (mod && mod.allowedShapes) {
    shapes = shapes.filter((s) => mod.allowedShapes.includes(s.key));
  }

  return shapes;
}

export function getShapePlacementCost(shapeType = "triangle") {
  return getShapeResourceCosts(shapeType).energy;
}

// ── Shape placement ──────────────────────────────────

export function placeShape(parentId, edgeIndex, shapeType = "triangle") {
  const costs = getShapeResourceCosts(shapeType);
  for (const [res, cost] of Object.entries(costs)) {
    if (gameState.resources[res] < cost) return false;
  }

  const mod = gameState.activeChallenge
    ? getChallengeModifier(gameState.activeChallenge)
    : null;
  if (mod && mod.maxShapes && getPlacedCount() >= mod.maxShapes) return false;

  const alreadyExists = gameState.nodes.some(
    (n) => n.parentId === parentId && n.edgeIndex === edgeIndex,
  );
  if (alreadyExists) return false;

  const coreR = 50;
  const shapeDef = SHAPE_DEFS[shapeType] || SHAPE_DEFS.triangle;
  const geo = buildGeometryTree(
    gameState.nodes,
    gameState.coreShape.sides,
    coreR,
  );
  const parentGeo = geo.find((g) => g.node.id === parentId);
  if (!parentGeo) return false;

  let edgeV1, edgeV2;
  if (parentId === "core") {
    const coreVerts = getCoreVertices(gameState.coreShape.sides, coreR);
    edgeV1 = coreVerts[edgeIndex];
    edgeV2 = coreVerts[(edgeIndex + 1) % gameState.coreShape.sides];
  } else {
    const parentDef =
      SHAPE_DEFS[gameState.nodes.find((n) => n.id === parentId)?.shape] ||
      SHAPE_DEFS.triangle;
    const freeEdges = getFreeEdges(parentGeo.vertices, parentDef.sides);
    const edge = freeEdges[edgeIndex];
    if (!edge) return false;
    edgeV1 = edge.v1;
    edgeV2 = edge.v2;
  }

  const newVerts = getAttachedShapeVertices(
    shapeDef.sides,
    edgeV1,
    edgeV2,
    parentGeo.center.x,
    parentGeo.center.y,
  );

  if (
    wouldOverlap(
      newVerts,
      gameState.nodes,
      gameState.coreShape.sides,
      coreR,
      parentId,
    )
  ) {
    return false;
  }

  for (const [res, cost] of Object.entries(costs)) {
    gameState.resources[res] -= cost;
  }

  const newId = `n-${nextId++}`;
  gameState.nodes.push({
    id: newId,
    parentId,
    shape: shapeType,
    edgeIndex,
    level: 1,
  });
  gameState.generatorCounts[newId] = 1 + (gameState.generatorBonus || 0);
  gameState.stats.totalShapesPlaced++;

  playPlace();

  const prevCombos = prevComboCount;
  const newCombos = getActiveCombos(gameState.nodes, gameState.coreShape.sides);
  if (newCombos.length > prevCombos) {
    playCombo();
    for (const combo of newCombos) {
      if (!gameState.discoveredCombos.includes(combo.id)) {
        gameState.discoveredCombos.push(combo.id);
      }
    }
  }
  prevComboCount = newCombos.length;

  return true;
}

export function addResource(type, amount) {
  if (gameState.resources[type] !== undefined) {
    gameState.resources[type] += amount;
    if (type === "energy") {
      gameState.stats.totalEnergyEarned += amount;
    }
  }
}

// ── Tier upgrades ────────────────────────────────────

export function getTierUpgradeCost(tier) {
  const tierLvl = getTierLevel(tier);
  const shapesOnTier = gameState.nodes.filter(
    (n) => n.id !== "core" && getNodeDepth(n.id) === tier,
  ).length;
  const base = SHAPE_DEFS.triangle.baseCost * 5;
  const tierReduction = getSkillEffect(gameState.skills, "tier_cost_reduction");
  return Math.max(
    1,
    Math.floor(
      base *
        Math.pow(1.35, tierLvl - 1) *
        (1 + shapesOnTier * 0.3) *
        (1 - tierReduction),
    ),
  );
}

export function upgradeTier(tier) {
  const cost = getTierUpgradeCost(tier);
  if (gameState.resources.energy < cost) return false;

  gameState.resources.energy -= cost;
  gameState.tierLevels[tier] = (gameState.tierLevels[tier] || 1) + 1;
  playUpgrade();
  return true;
}

export function getTierInfo() {
  const tiers = new Map();
  for (const node of gameState.nodes) {
    if (node.id === "core") continue;
    const depth = getNodeDepth(node.id);
    if (!tiers.has(depth)) {
      tiers.set(depth, { tier: depth, count: 0, totalProd: 0 });
    }
    const info = tiers.get(depth);
    info.count++;
    info.totalProd += getNodeProduction(node.id);
  }
  return [...tiers.values()].sort((a, b) => a.tier - b.tier);
}

// ── Click / Tap ──────────────────────────────────────

export function getClickValue() {
  const challengeRewards = getChallengeRewards(gameState.completedChallenges);
  const clickBonus = challengeRewards.click_bonus || 0;
  let value =
    0.5 + getSkillEffect(gameState.skills, "click_bonus") * (1 + clickBonus);

  const prodPct = getSkillEffect(gameState.skills, "click_prod_pct");
  if (prodPct > 0) value += getTotalProduction() * prodPct;

  const megaPct = getSkillEffect(gameState.skills, "mega_tap_pct");
  if (megaPct > 0) {
    let totalGens = 0;
    for (const val of Object.values(gameState.generatorCounts)) {
      totalGens += val;
    }
    value += totalGens * megaPct;
  }

  return value;
}

export function performClick() {
  const mod = gameState.activeChallenge
    ? getChallengeModifier(gameState.activeChallenge)
    : null;
  if (mod && mod.skillsDisabled) {
    const clickVal = 0.5;
    addResource("energy", clickVal);
    gameState.tapCount++;
    return { value: clickVal, isBurst: false };
  }

  gameState.tapCount++;
  let clickVal = getClickValue();

  const burstMult = getSkillEffect(gameState.skills, "click_burst");
  const isBurst = burstMult > 0 && gameState.tapCount % 10 === 0;
  if (isBurst) clickVal *= burstMult;

  addResource("energy", clickVal);

  const allResPct = getSkillEffect(gameState.skills, "click_all_res");
  if (allResPct > 0) {
    const eff = getEffectivePrestigeForResources();
    if (eff >= 1) addResource("flux", clickVal * allResPct);
    if (eff >= 2) addResource("prisms", clickVal * allResPct);
  }

  const fluxTap = getSkillEffect(gameState.skills, "flux_tap");
  if (fluxTap > 0 && getEffectivePrestigeForResources() >= 1) {
    addResource("flux", clickVal * fluxTap);
  }

  const wavePct = getSkillEffect(gameState.skills, "click_wave");
  if (wavePct > 0) {
    for (const node of gameState.nodes) {
      if (node.id === "core") continue;
      if (getNodeDepth(node.id) === 1) {
        gameState.generatorCounts[node.id] =
          (gameState.generatorCounts[node.id] || 1) * (1 + wavePct);
      }
    }
  }

  return { value: clickVal, isBurst };
}

// ── Auto systems ─────────────────────────────────────

export function bulkPlaceAll() {
  if (getSkillEffect(gameState.skills, "bulk_place") <= 0) return 0;
  const slots = getOpenSlots(gameState.nodes, gameState.coreShape.sides, 50);
  const coreSlots = slots.filter((s) => s.parentId === "core");
  let placed = 0;
  for (const slot of coreSlots) {
    if (canAffordShape()) {
      if (placeShape(slot.parentId, slot.edgeIndex)) placed++;
    }
  }
  return placed;
}

export function tickAutoSystems(delta, elapsed) {
  const mod = gameState.activeChallenge
    ? getChallengeModifier(gameState.activeChallenge)
    : null;
  if (mod && mod.skillsDisabled) return;

  const autoClick = getSkillEffect(gameState.skills, "auto_click");
  if (autoClick > 0 && elapsed % 1000 < delta * 1000) {
    performClick();
  }

  const autoPlace = getSkillEffect(gameState.skills, "auto_place");
  if (autoPlace > 0 && elapsed % 30000 < delta * 1000) {
    if (canAffordShape()) {
      const slots = getOpenSlots(
        gameState.nodes,
        gameState.coreShape.sides,
        50,
      );
      if (slots.length > 0) {
        placeShape(slots[0].parentId, slots[0].edgeIndex);
      }
    }
  }
}

export function tickFluxConvert(delta) {
  const convertPct = getSkillEffect(gameState.skills, "flux_convert");
  if (convertPct > 0 && getEffectivePrestigeForResources() >= 1) {
    const energyToConvert =
      gameState.resources.energy * convertPct * 0.01 * delta;
    if (energyToConvert > 0 && gameState.resources.energy >= energyToConvert) {
      gameState.resources.energy -= energyToConvert;
      addResource("flux", energyToConvert * 0.1);
    }
  }
}

// ── Skills ───────────────────────────────────────────

export function canAffordSkill(skillId) {
  const def = getSkillDef(skillId);
  if (!def) return false;
  const cost = getSkillCost(gameState.skills, skillId);
  if (def.costType === "prestige") {
    return gameState.prestige.currency >= cost;
  }
  return (gameState.resources[def.costType] || 0) >= cost;
}

export function unlockSkill(skillId) {
  const mod = gameState.activeChallenge
    ? getChallengeModifier(gameState.activeChallenge)
    : null;
  if (mod && mod.skillsDisabled) return false;

  if (!canUnlockSkill(gameState.skills, skillId, gameState.prestige.level))
    return false;
  if (!canAffordSkill(skillId)) return false;

  const def = getSkillDef(skillId);
  const cost = getSkillCost(gameState.skills, skillId);

  if (def.costType === "prestige") {
    gameState.prestige.currency -= cost;
  } else {
    gameState.resources[def.costType] -= cost;
  }

  gameState.skills[skillId] = (gameState.skills[skillId] || 0) + 1;
  playUpgrade();
  return true;
}

export function respecSkills() {
  const cost = getRespecCost(gameState.prestige.respecCount);
  if (cost > 0 && gameState.prestige.currency < cost) return false;

  let refundedCores = 0;
  for (const def of SKILL_DEFS) {
    const level = gameState.skills[def.id] || 0;
    if (level === 0) continue;
    if (def.costType === "prestige") {
      for (let i = 0; i < level; i++) {
        refundedCores += Math.ceil(def.costBase * (i + 1));
      }
    }
  }

  gameState.prestige.currency -= cost;
  gameState.prestige.currency += refundedCores;
  gameState.skills = {};
  gameState.prestige.respecCount++;
  return true;
}

// ── Prestige ─────────────────────────────────────────

export function getPrestigeThreshold() {
  const reduction = getSkillEffect(gameState.skills, "prestige_threshold");
  const challengeRewards = getChallengeRewards(gameState.completedChallenges);
  const challengeReduction = challengeRewards.prestige_threshold || 0;
  return Math.floor(
    1000 *
      Math.pow(10, gameState.prestige.level) *
      Math.max(0.1, 1 - reduction - challengeReduction),
  );
}

export function canPrestige() {
  return gameState.stats.totalEnergyEarned >= getPrestigeThreshold();
}

export function getPrestigeReward() {
  const threshold = getPrestigeThreshold();
  const ratio = gameState.stats.totalEnergyEarned / Math.max(1, threshold);
  const rewardSkill = getSkillEffect(gameState.skills, "prestige_reward");
  const challengeRewards = getChallengeRewards(gameState.completedChallenges);
  const prestigeRewardMult = 1 + (challengeRewards.prestige_reward_mult || 0);
  return Math.max(
    1,
    Math.floor(
      Math.log10(Math.max(1, ratio)) * 2 * prestigeRewardMult + rewardSkill,
    ),
  );
}

export function resetForPrestige() {
  if (!canPrestige()) return;

  if (gameState.activeChallenge) {
    const mod = getChallengeModifier(gameState.activeChallenge);
    if (mod) {
      let passes = true;
      if (mod.timeLimit && (gameState.stats.runTime || 0) > mod.timeLimit)
        passes = false;
      if (mod.maxShapes && getPlacedCount() >= mod.maxShapes) passes = false;
      if (passes) completeChallenge(gameState.activeChallenge);
      else gameState.activeChallenge = null;
    }
  }

  const prestigeReward = getPrestigeReward();

  const keepGenPct = getSkillEffect(gameState.skills, "prestige_keep_gen");
  const keepTiers = getSkillEffect(gameState.skills, "prestige_keep_tiers") > 0;
  const savedTierLevels = keepTiers ? { ...gameState.tierLevels } : {};

  let genBonus = 0;
  if (keepGenPct > 0) {
    let totalGen = 0;
    for (const val of Object.values(gameState.generatorCounts)) {
      totalGen += val;
    }
    genBonus = (totalGen * keepGenPct) / Math.max(1, gameState.coreShape.sides);
  }

  gameState.prestige.level++;
  gameState.prestige.currency += prestigeReward;
  gameState.prestige.totalCoresEarned =
    (gameState.prestige.totalCoresEarned || 0) + prestigeReward;
  gameState.prestige.totalPrestigeEnergy += gameState.stats.totalEnergyEarned;
  gameState.coreShape.sides++;
  gameState.resources.energy = 0;
  gameState.resources.flux = 0;
  gameState.resources.prisms = 0;
  gameState.stats.totalEnergyEarned = 0;
  gameState.stats.runTime = 0;
  gameState.stats.pentagonBursts = 0;

  const shapeNames = [
    "triangle",
    "square",
    "pentagon",
    "hexagon",
    "heptagon",
    "octagon",
  ];
  gameState.coreShape.type =
    shapeNames[gameState.coreShape.sides - 3] ||
    `${gameState.coreShape.sides}-gon`;

  nextId = 1;
  prevComboCount = 0;
  gameState.tierLevels = keepTiers ? savedTierLevels : {};
  gameState.generatorCounts = {};
  gameState.generatorBonus = genBonus;
  gameState.tapCount = 0;
  gameState.pentagonStorage = {};
  gameState.nodes = [
    {
      id: "core",
      parentId: null,
      shape: gameState.coreShape.type,
      edgeIndex: -1,
      level: 1,
    },
  ];
  playPrestige();
}

// ── Generators ───────────────────────────────────────

const GEN_SOFT_CAP = 1000;

export function tickGenerators(delta) {
  const genSpeedMult = 1 + getSkillEffect(gameState.skills, "gen_speed");
  const feedRateMult = 1 + getSkillEffect(gameState.skills, "feed_rate");
  const deepFeedMult = 1 + getSkillEffect(gameState.skills, "deep_feed");
  const genCompound = getSkillEffect(gameState.skills, "gen_compound");
  const hasUncap = getSkillEffect(gameState.skills, "gen_uncap") > 0;

  const challengeRewards = getChallengeRewards(gameState.completedChallenges);
  const deepFeedChallenge = 1 + (challengeRewards.deep_feed || 0);

  const depthMap = new Map();
  for (const node of gameState.nodes) {
    if (node.id === "core") continue;
    depthMap.set(node.id, getNodeDepth(node.id));
  }

  const deepNodes = [...depthMap.entries()]
    .filter(([, d]) => d >= 2)
    .sort((a, b) => b[1] - a[1]);

  for (const [nodeId, depth] of deepNodes) {
    const node = gameState.nodes.find((n) => n.id === nodeId);
    if (!node) continue;
    const tierLvl = getTierLevel(depth);
    let rate = 0.1 * tierLvl * delta * genSpeedMult;

    if (depth === 2) rate *= feedRateMult;
    if (depth >= 3) rate *= deepFeedMult * deepFeedChallenge;

    if (genCompound > 0) {
      const parentGen = gameState.generatorCounts[node.parentId] || 1;
      rate *= 1 + genCompound * Math.log2(Math.max(1, parentGen));
    }

    const parentId = node.parentId;
    if (parentId && parentId !== "core") {
      let newCount = (gameState.generatorCounts[parentId] || 1) + rate;
      if (!hasUncap && newCount > GEN_SOFT_CAP) {
        newCount = GEN_SOFT_CAP + (newCount - GEN_SOFT_CAP) * 0.1;
      }
      gameState.generatorCounts[parentId] = newCount;
    }
  }
}

// ── Achievements tick ────────────────────────────────

export function tickAchievements() {
  const helpers = { maxDepth: getMaxDepth() };
  const newOnes = checkAchievements(gameState, helpers);
  for (const id of newOnes) {
    if (!gameState.achievements.includes(id)) {
      gameState.achievements.push(id);
    }
  }
  return newOnes;
}

export function tickChallengeCheck() {
  if (!gameState.activeChallenge) return null;

  const mod = getChallengeModifier(gameState.activeChallenge);
  if (!mod) return null;

  if (mod.timeLimit && !mod.comboTarget) {
    if ((gameState.stats.runTime || 0) > mod.timeLimit) {
      abandonChallenge();
      return null;
    }
  }

  const runStats = {
    maxDepth: getMaxDepth(),
    pentagonBursts: gameState.stats.pentagonBursts || 0,
    runTime: gameState.stats.runTime || 0,
    comboAchieved:
      mod.comboTarget &&
      (gameState.discoveredCombos || []).includes(mod.comboTarget)
        ? mod.comboTarget
        : null,
    resourcesEarned: {
      energy: gameState.stats.totalEnergyEarned,
      flux: gameState.resources.flux,
      prisms: gameState.resources.prisms,
    },
  };

  if (checkChallengeComplete(gameState.activeChallenge, gameState, runStats)) {
    const id = gameState.activeChallenge;
    completeChallenge(id);
    return id;
  }
  return null;
}

export function convertSkillPoints(amount = 1) {
  const toConvert = Math.min(amount, gameState.skillPoints);
  if (toConvert <= 0) return 0;
  gameState.skillPoints -= toConvert;
  gameState.prestige.currency += toConvert;
  return toConvert;
}

// ── Challenge management ─────────────────────────────

export function startChallenge(challengeId) {
  if (gameState.activeChallenge) return false;
  gameState.activeChallenge = challengeId;
  resetForPrestige.__skipCheck = true;

  gameState.resources.energy = 0;
  gameState.resources.flux = 0;
  gameState.resources.prisms = 0;
  gameState.stats.totalEnergyEarned = 0;
  gameState.stats.runTime = 0;
  gameState.stats.pentagonBursts = 0;
  gameState.tierLevels = {};
  gameState.generatorCounts = {};
  gameState.pentagonStorage = {};
  gameState.tapCount = 0;

  nextId = 1;
  prevComboCount = 0;
  gameState.nodes = [
    {
      id: "core",
      parentId: null,
      shape: gameState.coreShape.type,
      edgeIndex: -1,
      level: 1,
    },
  ];

  return true;
}

export function abandonChallenge() {
  gameState.activeChallenge = null;
}

export function completeChallenge(challengeId) {
  if (!gameState.completedChallenges.includes(challengeId)) {
    gameState.completedChallenges.push(challengeId);
  }
  gameState.activeChallenge = null;
}

// ── Save/load ────────────────────────────────────────

function getNodeDepthFromList(nodes, nodeId) {
  let depth = 0;
  let current = nodes.find((n) => n.id === nodeId);
  while (current && current.parentId) {
    depth++;
    current = nodes.find((n) => n.id === current.parentId);
  }
  return depth;
}

export function loadStateFrom(saved) {
  if (!saved) return;
  Object.assign(gameState.resources, saved.resources || {});
  Object.assign(gameState.coreShape, saved.coreShape || {});
  Object.assign(gameState.prestige, saved.prestige || {});
  if (!gameState.prestige.totalCoresEarned)
    gameState.prestige.totalCoresEarned = 0;
  if (!gameState.prestige.respecCount) gameState.prestige.respecCount = 0;
  Object.assign(gameState.stats, saved.stats || {});
  if (!gameState.stats.pentagonBursts) gameState.stats.pentagonBursts = 0;
  if (!gameState.stats.runTime) gameState.stats.runTime = 0;
  if (saved.tierLevels && Object.keys(saved.tierLevels).length > 0) {
    Object.assign(gameState.tierLevels, saved.tierLevels);
  } else if (saved.nodes && saved.nodes.length > 1) {
    const migrated = {};
    for (const node of saved.nodes) {
      if (node.id === "core") continue;
      const depth = getNodeDepthFromList(saved.nodes, node.id);
      const lvl = node.level || 1;
      migrated[depth] = Math.max(migrated[depth] || 1, lvl);
    }
    Object.assign(gameState.tierLevels, migrated);
  }
  if (saved.generatorCounts) {
    Object.assign(gameState.generatorCounts, saved.generatorCounts);
  }
  if (saved.skills) {
    Object.assign(gameState.skills, saved.skills);
  }
  if (saved.tapCount) gameState.tapCount = saved.tapCount;
  if (saved.generatorBonus) gameState.generatorBonus = saved.generatorBonus;
  if (saved.skillPoints) gameState.skillPoints = saved.skillPoints;
  if (saved.solvedPuzzles) gameState.solvedPuzzles = saved.solvedPuzzles;
  if (saved.pentagonStorage)
    Object.assign(gameState.pentagonStorage, saved.pentagonStorage);
  if (saved.discoveredCombos)
    gameState.discoveredCombos = saved.discoveredCombos;
  if (saved.achievements) gameState.achievements = saved.achievements;
  if (saved.completedChallenges)
    gameState.completedChallenges = saved.completedChallenges;
  if (saved.activeChallenge) gameState.activeChallenge = saved.activeChallenge;
  if (saved.removeAds) gameState.removeAds = saved.removeAds;
  if (saved.nodes && saved.nodes.length > 0) {
    gameState.nodes = saved.nodes;
    const maxId = saved.nodes
      .filter((n) => n.id.startsWith("n-"))
      .reduce((max, n) => Math.max(max, parseInt(n.id.split("-")[1]) || 0), 0);
    nextId = maxId + 1;
  }
}
