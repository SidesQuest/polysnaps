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
import { playPlace, playUpgrade, playPrestige, playCombo } from "./audio.js";
import {
  getSkillEffect,
  canUnlockSkill,
  getSkillCost,
  getSkillDef,
} from "./skills.js";

let nextId = 1;
let prevComboCount = 0;

export const RESOURCE_DEFS = {
  energy: {
    name: "Energy",
    color: "#44aaff",
    icon: "⚡",
    iconPath: "/assets/icons/cyberpunk-skills/1 Icons/1/Skillicon1_20.png",
    minPrestige: 0,
  },
  flux: {
    name: "Flux",
    color: "#ff44aa",
    icon: "🌀",
    iconPath: "/assets/icons/cyberpunk-skills/1 Icons/10/Skillicon10_20.png",
    minPrestige: 1,
    minLayer: 2,
  },
  prisms: {
    name: "Prisms",
    color: "#aa44ff",
    icon: "💎",
    iconPath: "/assets/icons/cyberpunk-skills/1 Icons/10/Skillicon10_05.png",
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
  },
  tierLevels: {},
  generatorCounts: {},
  skills: {},
  tapCount: 0,
  generatorBonus: 0,
  skillPoints: 0,
  solvedPuzzles: [],
  stats: {
    totalEnergyEarned: 0,
    totalShapesPlaced: 0,
    timePlayed: 0,
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

  const globalMult = comboMult * prestigeBonus * resonanceBonus;
  result.energy *=
    globalMult *
    (1 + getSkillEffect(gameState.skills, "production_mult", "energy"));
  result.flux *=
    globalMult *
    (1 + getSkillEffect(gameState.skills, "production_mult", "flux"));
  result.prisms *=
    globalMult *
    (1 + getSkillEffect(gameState.skills, "production_mult", "prisms"));

  if (fluxOverflow > 0 && result.flux > 0) {
    result.energy += result.flux * fluxOverflow * 0.01;
  }

  return result;
}

export function getTotalProduction() {
  return getProductionByResource().energy;
}

export function getNextShapeCost(shapeType = "triangle") {
  return getShapePlacementCost(shapeType);
}

export function canAffordShape() {
  return gameState.resources.energy >= getNextShapeCost();
}

export function getAvailableShapes() {
  return getUnlockedShapes(getEffectivePrestigeForResources());
}

export function getShapePlacementCost(shapeType = "triangle") {
  if (
    shapeType === "triangle" &&
    getSkillEffect(gameState.skills, "free_t1") > 0
  )
    return 0;
  const base = getShapeCost(getPlacedCount(), shapeType);
  const reduction = getSkillEffect(gameState.skills, "cost_reduction");
  return Math.max(1, Math.floor(base * (1 - reduction)));
}

export function placeShape(parentId, edgeIndex, shapeType = "triangle") {
  const cost = getShapePlacementCost(shapeType);
  if (gameState.resources.energy < cost) return false;

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

  gameState.resources.energy -= cost;
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
  const newCombos = getActiveCombos(
    gameState.nodes,
    gameState.coreShape.sides,
  ).length;
  if (newCombos > prevCombos) playCombo();
  prevComboCount = newCombos;

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

export function getClickValue() {
  let value = 1 + getSkillEffect(gameState.skills, "click_bonus");

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

export function getPrestigeThreshold() {
  const reduction = getSkillEffect(gameState.skills, "prestige_threshold");
  return Math.floor(
    1000 *
      Math.pow(10, gameState.prestige.level) *
      Math.max(0.1, 1 - reduction),
  );
}

export function canPrestige() {
  return gameState.stats.totalEnergyEarned >= getPrestigeThreshold();
}

export function resetForPrestige() {
  if (!canPrestige()) return;

  const rewardSkill = getSkillEffect(gameState.skills, "prestige_reward");
  const prestigeReward =
    Math.floor(1 + gameState.prestige.level * 0.5) + Math.floor(rewardSkill);

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
  gameState.prestige.totalPrestigeEnergy += gameState.stats.totalEnergyEarned;
  gameState.coreShape.sides++;
  gameState.resources.energy = 0;
  gameState.resources.flux = 0;
  gameState.resources.prisms = 0;
  gameState.stats.totalEnergyEarned = 0;

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

const GEN_SOFT_CAP = 1000;

export function tickGenerators(delta) {
  const genSpeedMult = 1 + getSkillEffect(gameState.skills, "gen_speed");
  const feedRateMult = 1 + getSkillEffect(gameState.skills, "feed_rate");
  const deepFeedMult = 1 + getSkillEffect(gameState.skills, "deep_feed");
  const genCompound = getSkillEffect(gameState.skills, "gen_compound");
  const hasUncap = getSkillEffect(gameState.skills, "gen_uncap") > 0;

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
    if (depth >= 3) rate *= deepFeedMult;

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
  Object.assign(gameState.stats, saved.stats || {});
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
  if (saved.nodes && saved.nodes.length > 0) {
    gameState.nodes = saved.nodes;
    const maxId = saved.nodes
      .filter((n) => n.id.startsWith("n-"))
      .reduce((max, n) => Math.max(max, parseInt(n.id.split("-")[1]) || 0), 0);
    nextId = maxId + 1;
  }
}
