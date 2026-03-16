const ACHIEVEMENT_DEFS = [
  {
    id: "first-shape",
    name: "First Steps",
    desc: "Place your first shape",
    check: (s) => s.stats.totalShapesPlaced >= 1,
  },
  {
    id: "ten-shapes",
    name: "Network Builder",
    desc: "Place 10 shapes",
    check: (s) => s.stats.totalShapesPlaced >= 10,
  },
  {
    id: "fifty-shapes",
    name: "Expansionist",
    desc: "Place 50 shapes",
    check: (s) => s.stats.totalShapesPlaced >= 50,
  },
  {
    id: "hundred-shapes",
    name: "Shape Addict",
    desc: "Place 100 shapes",
    check: (s) => s.stats.totalShapesPlaced >= 100,
  },
  {
    id: "first-tier-up",
    name: "First Upgrade",
    desc: "Upgrade a tier",
    check: (s) => Object.values(s.tierLevels).some((v) => v >= 2),
  },
  {
    id: "tier-5",
    name: "Tier Master",
    desc: "Reach tier level 5",
    check: (s) => Object.values(s.tierLevels).some((v) => v >= 5),
  },
  {
    id: "tier-10",
    name: "Tier God",
    desc: "Reach tier level 10",
    check: (s) => Object.values(s.tierLevels).some((v) => v >= 10),
  },
  {
    id: "first-combo",
    name: "Combo Finder",
    desc: "Discover a combo",
    check: (s) => (s.discoveredCombos || []).length >= 1,
  },
  {
    id: "five-combos",
    name: "Combo Master",
    desc: "Discover 5 combos",
    check: (s) => (s.discoveredCombos || []).length >= 5,
  },
  {
    id: "all-combos",
    name: "Combo Legend",
    desc: "Discover all combos",
    check: (s) => (s.discoveredCombos || []).length >= 9,
  },
  {
    id: "first-prestige",
    name: "Prestige Initiate",
    desc: "Prestige once",
    check: (s) => s.prestige.level >= 1,
  },
  {
    id: "five-prestige",
    name: "Prestige Veteran",
    desc: "Prestige 5 times",
    check: (s) => s.prestige.level >= 5,
  },
  {
    id: "ten-prestige",
    name: "Prestige Master",
    desc: "Prestige 10 times",
    check: (s) => s.prestige.level >= 10,
  },
  {
    id: "ten-cores",
    name: "Core Collector",
    desc: "Earn 10 Cores total",
    check: (s) => s.prestige.totalCoresEarned >= 10,
  },
  {
    id: "fifty-cores",
    name: "Core Hoarder",
    desc: "Have 50 unspent Cores",
    check: (s) => s.prestige.currency >= 50,
  },
  {
    id: "first-skill",
    name: "Skill Unlocked",
    desc: "Unlock a skill",
    check: (s) => Object.values(s.skills).some((v) => v > 0),
  },
  {
    id: "ten-skills",
    name: "Skill Master",
    desc: "Unlock 10 skills",
    check: (s) => Object.values(s.skills).filter((v) => v > 0).length >= 10,
  },
  {
    id: "twentyfive-skills",
    name: "Skill Legend",
    desc: "Unlock 25 skills",
    check: (s) => Object.values(s.skills).filter((v) => v > 0).length >= 25,
  },
  {
    id: "energy-1m",
    name: "Energy Milestone",
    desc: "Earn 1M total energy",
    check: (s) =>
      s.prestige.totalPrestigeEnergy + s.stats.totalEnergyEarned >= 1e6,
  },
  {
    id: "energy-1b",
    name: "Energy Empire",
    desc: "Earn 1B total energy",
    check: (s) =>
      s.prestige.totalPrestigeEnergy + s.stats.totalEnergyEarned >= 1e9,
  },
  {
    id: "flux-1k",
    name: "Flux Flow",
    desc: "Earn 1K flux",
    check: (s) => s.resources.flux >= 1000,
  },
  {
    id: "prisms-1k",
    name: "Prism Power",
    desc: "Earn 1K prisms",
    check: (s) => s.resources.prisms >= 1000,
  },
  {
    id: "speed-prestige",
    name: "Speed Runner",
    desc: "Prestige within 10 min",
    check: (s) =>
      s.stats.runTime !== undefined &&
      s.stats.runTime <= 600 &&
      s.stats.prestigedThisCheck,
  },
  {
    id: "play-1h",
    name: "Patient Player",
    desc: "Play for 1 hour",
    check: (s) => s.stats.timePlayed >= 3600,
  },
  {
    id: "play-10h",
    name: "Dedicated",
    desc: "Play for 10 hours",
    check: (s) => s.stats.timePlayed >= 36000,
  },
  {
    id: "shape-diversity",
    name: "Shape Diversity",
    desc: "Place one of each shape type",
    check: (s) => {
      const types = new Set(
        s.nodes.filter((n) => n.id !== "core").map((n) => n.shape),
      );
      return types.size >= Math.min(4, 1 + s.prestige.level);
    },
  },
  {
    id: "deep-4",
    name: "Deep Explorer",
    desc: "Build 4 layers deep",
    check: (s, helpers) => helpers.maxDepth >= 4,
  },
  {
    id: "deep-6",
    name: "Abyss Diver",
    desc: "Build 6 layers deep",
    check: (s, helpers) => helpers.maxDepth >= 6,
  },
  {
    id: "pentagon-burst",
    name: "Pentagon Burst",
    desc: "Release a full pentagon",
    check: (s) => s.stats.pentagonBursts >= 1,
  },
  {
    id: "hex-trio",
    name: "Hexagon Harmony",
    desc: "Have 3 hexagons placed",
    check: (s) => s.nodes.filter((n) => n.shape === "hexagon").length >= 3,
  },
];

export function getAllAchievements() {
  return ACHIEVEMENT_DEFS;
}

export function checkAchievements(gameState, helpers = {}) {
  const unlocked = gameState.achievements || [];
  const newlyUnlocked = [];

  for (const ach of ACHIEVEMENT_DEFS) {
    if (unlocked.includes(ach.id)) continue;
    try {
      if (ach.check(gameState, helpers)) {
        newlyUnlocked.push(ach.id);
      }
    } catch {
      // skip if check errors (missing state)
    }
  }

  return newlyUnlocked;
}

export function getAchievementMultiplier(achievements) {
  return 1 + (achievements || []).length * 0.01;
}
