import { SHAPE_DEFS } from "./shapes.js";
import { getSkillEffect } from "./skills.js";

const LAST_ONLINE_KEY = "polysnaps_last_online";

export function recordOnlineTime() {
  localStorage.setItem(LAST_ONLINE_KEY, Date.now().toString());
}

export function getOfflineSeconds() {
  const lastOnline = localStorage.getItem(LAST_ONLINE_KEY);
  if (!lastOnline) return 0;

  const elapsed = (Date.now() - parseInt(lastOnline)) / 1000;
  return Math.max(0, Math.floor(elapsed));
}

function getNodeDepth(nodes, nodeId) {
  let d = 0,
    cur = nodes.find((n) => n.id === nodeId);
  while (cur && cur.parentId) {
    d++;
    cur = nodes.find((n) => n.id === cur.parentId);
  }
  return d;
}

export function calculateOfflineEarnings(gameState, offlineSeconds) {
  const skills = gameState.skills || {};
  const offlineMultiplier = 0.5 + getSkillEffect(skills, "offline_mult");
  const offlineGen = getSkillEffect(skills, "offline_gen");

  const result = { energy: 0, flux: 0, prisms: 0 };

  for (const node of gameState.nodes) {
    if (node.id === "core") continue;
    const def = SHAPE_DEFS[node.shape];
    if (!def) continue;

    const depth = getNodeDepth(gameState.nodes, node.id);
    const tierLvl = (gameState.tierLevels && gameState.tierLevels[depth]) || 1;
    const genCount =
      (gameState.generatorCounts && gameState.generatorCounts[node.id]) || 1;
    const prod = def.baseProduction * tierLvl * (depth === 1 ? genCount : 0);

    result.energy += prod;

    if (gameState.prestige.level >= 1 && depth >= 2) {
      result.flux += prod * 0.3;
    }
    if (gameState.prestige.level >= 2 && depth >= 3) {
      result.prisms += prod * 0.1;
    }
  }

  result.energy = Math.floor(
    result.energy * offlineSeconds * offlineMultiplier,
  );
  result.flux = Math.floor(result.flux * offlineSeconds * offlineMultiplier);
  result.prisms = Math.floor(
    result.prisms * offlineSeconds * offlineMultiplier,
  );

  if (offlineGen > 0 && gameState.generatorCounts) {
    const genGrowth = offlineSeconds * 0.01 * offlineGen;
    for (const key of Object.keys(gameState.generatorCounts)) {
      gameState.generatorCounts[key] += genGrowth;
    }
  }

  return result;
}
