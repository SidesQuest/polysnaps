export const CHALLENGE_DEFS = [
  {
    id: "tri-only",
    name: "Triangle Only",
    desc: "Prestige using only triangles",
    minPrestige: 3,
    modifier: { allowedShapes: ["triangle"] },
    reward: {
      type: "production_mult",
      resource: "energy",
      value: 0.05,
      label: "+5% triangle production",
    },
  },
  {
    id: "speed-run",
    name: "Speed Run",
    desc: "Prestige within 5 minutes",
    minPrestige: 3,
    modifier: { timeLimit: 300 },
    reward: {
      type: "prestige_threshold",
      value: 0.1,
      label: "-10% prestige threshold",
    },
  },
  {
    id: "no-skills",
    name: "No Skills",
    desc: "Prestige without using skills",
    minPrestige: 3,
    modifier: { skillsDisabled: true },
    reward: {
      type: "production_mult",
      value: 0.1,
      label: "+10% base production",
    },
  },
  {
    id: "minimalist",
    name: "Minimalist",
    desc: "Prestige with fewer than 10 shapes",
    minPrestige: 4,
    modifier: { maxShapes: 10 },
    reward: { type: "click_bonus", value: 0.2, label: "+20% click value" },
  },
  {
    id: "ring-rush",
    name: "Full Ring Rush",
    desc: "Complete Full Ring combo within 2 min",
    minPrestige: 4,
    modifier: { comboTarget: "full-ring", timeLimit: 120 },
    reward: { type: "zone_power", value: 0.1, label: "+10% buff zone power" },
  },
  {
    id: "square-world",
    name: "Square World",
    desc: "Prestige using only squares and triangles",
    minPrestige: 5,
    modifier: { allowedShapes: ["triangle", "square"] },
    reward: {
      type: "multiplier_boost",
      value: 0.1,
      label: "+10% multiplier value",
    },
  },
  {
    id: "deep-dive",
    name: "Deep Dive",
    desc: "Build a chain 7 layers deep",
    minPrestige: 5,
    modifier: { targetDepth: 7 },
    reward: { type: "deep_feed", value: 0.3, label: "+30% deep feed rate" },
  },
  {
    id: "resource-master",
    name: "Resource Master",
    desc: "Earn 100K of each resource in one run",
    minPrestige: 5,
    modifier: {
      resourceTargets: { energy: 100000, flux: 100000, prisms: 100000 },
    },
    reward: {
      type: "production_mult",
      value: 0.05,
      label: "+5% all production",
    },
  },
  {
    id: "pentagon-pro",
    name: "Pentagon Pro",
    desc: "Release 10 pentagon bursts in one run",
    minPrestige: 6,
    modifier: { burstTarget: 10 },
    reward: {
      type: "storage_capacity",
      value: 0.5,
      label: "+50% storage capacity",
    },
  },
  {
    id: "geometry-master",
    name: "Geometry Master",
    desc: "Complete all other challenges",
    minPrestige: 7,
    modifier: { requireAll: true },
    reward: {
      type: "achievement_mult",
      value: 1.0,
      label: "Double achievement bonus",
    },
  },
];

export function getAvailableChallenges(prestigeLevel, completed = []) {
  return CHALLENGE_DEFS.filter(
    (c) => prestigeLevel >= c.minPrestige && !completed.includes(c.id),
  );
}

export function getChallengeModifier(challengeId) {
  const def = CHALLENGE_DEFS.find((c) => c.id === challengeId);
  return def ? def.modifier : null;
}

export function getChallengeRewards(completed = []) {
  const rewards = {};
  for (const id of completed) {
    const def = CHALLENGE_DEFS.find((c) => c.id === id);
    if (!def) continue;
    const r = def.reward;
    const key = r.resource ? `${r.type}_${r.resource}` : r.type;
    rewards[key] = (rewards[key] || 0) + r.value;
  }
  return rewards;
}

export function checkChallengeComplete(challengeId, gameState, runStats) {
  const def = CHALLENGE_DEFS.find((c) => c.id === challengeId);
  if (!def) return false;
  const mod = def.modifier;

  if (mod.requireAll) {
    const otherIds = CHALLENGE_DEFS.filter((c) => c.id !== challengeId).map(
      (c) => c.id,
    );
    return otherIds.every((id) =>
      (gameState.completedChallenges || []).includes(id),
    );
  }

  if (mod.targetDepth) {
    return (runStats.maxDepth || 0) >= mod.targetDepth;
  }

  if (mod.burstTarget) {
    return (runStats.pentagonBursts || 0) >= mod.burstTarget;
  }

  if (mod.comboTarget) {
    return (
      runStats.comboAchieved === mod.comboTarget &&
      (runStats.runTime || Infinity) <= (mod.timeLimit || Infinity)
    );
  }

  if (mod.resourceTargets) {
    return Object.entries(mod.resourceTargets).every(
      ([res, target]) => (runStats.resourcesEarned?.[res] || 0) >= target,
    );
  }

  return false;
}
