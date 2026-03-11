const BASE_REVEAL_RADIUS = 80;
const CORE_REVEAL_RADIUS = 120;
const FOG_CELL_SIZE = 20;
const PUZZLE_SHAPES = ["triangle", "square", "pentagon", "hexagon"];

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function getRevealedCells(nodes, geometry, fogRevealBonus = 0) {
  const revealed = new Set();
  const radius = BASE_REVEAL_RADIUS * (1 + fogRevealBonus);

  addCircleCells(revealed, 0, 0, CORE_REVEAL_RADIUS * (1 + fogRevealBonus));

  const geoMap = new Map();
  for (const g of geometry) {
    if (!g.isCore) geoMap.set(g.node.id, g);
  }

  for (const node of nodes) {
    if (node.id === "core") continue;
    const geo = geoMap.get(node.id);
    if (!geo) continue;
    addCircleCells(revealed, geo.center.x, geo.center.y, radius);
  }

  return revealed;
}

function addCircleCells(set, cx, cy, radius) {
  const minCol = Math.floor((cx - radius) / FOG_CELL_SIZE);
  const maxCol = Math.ceil((cx + radius) / FOG_CELL_SIZE);
  const minRow = Math.floor((cy - radius) / FOG_CELL_SIZE);
  const maxRow = Math.ceil((cy + radius) / FOG_CELL_SIZE);

  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      const cellX = c * FOG_CELL_SIZE + FOG_CELL_SIZE / 2;
      const cellY = r * FOG_CELL_SIZE + FOG_CELL_SIZE / 2;
      const dx = cellX - cx;
      const dy = cellY - cy;
      if (dx * dx + dy * dy <= radius * radius) {
        set.add(`${c},${r}`);
      }
    }
  }
}

export function isPointRevealed(x, y, revealedCells) {
  const c = Math.floor(x / FOG_CELL_SIZE);
  const r = Math.floor(y / FOG_CELL_SIZE);
  return revealedCells.has(`${c},${r}`);
}

export function getFogBoundary(revealedCells) {
  const boundary = [];
  for (const key of revealedCells) {
    const [c, r] = key.split(",").map(Number);
    const neighbors = [
      `${c - 1},${r}`,
      `${c + 1},${r}`,
      `${c},${r - 1}`,
      `${c},${r + 1}`,
    ];
    for (const n of neighbors) {
      if (!revealedCells.has(n)) {
        boundary.push({
          x: c * FOG_CELL_SIZE + FOG_CELL_SIZE / 2,
          y: r * FOG_CELL_SIZE + FOG_CELL_SIZE / 2,
        });
        break;
      }
    }
  }
  return boundary;
}

export function generatePuzzleSlots(prestigeLevel, coreSides) {
  const seed = (prestigeLevel + 1) * 4201 + coreSides * 97;
  const rng = seededRandom(seed);
  const count = 3 + prestigeLevel * 2;
  const slots = [];

  for (let i = 0; i < count; i++) {
    const angle = rng() * Math.PI * 2;
    const distance = 150 + rng() * 300;
    const shapeIdx = Math.floor(
      rng() * Math.min(1 + prestigeLevel, PUZZLE_SHAPES.length),
    );
    const isRare = rng() < 0.15;

    slots.push({
      id: `puzzle-${prestigeLevel}-${i}`,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      requiredShape: PUZZLE_SHAPES[shapeIdx],
      reward: isRare ? 3 : 1,
      isRare,
      solved: false,
    });
  }

  return slots;
}

export function checkPuzzleSlot(slot, nodes, geometry) {
  if (slot.solved) return false;

  const geoMap = new Map();
  for (const g of geometry) {
    if (!g.isCore) geoMap.set(g.node.id, g);
  }

  for (const node of nodes) {
    if (node.id === "core") continue;
    const geo = geoMap.get(node.id);
    if (!geo) continue;

    const dx = geo.center.x - slot.x;
    const dy = geo.center.y - slot.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 25 && node.shape === slot.requiredShape) {
      return true;
    }
  }
  return false;
}

export { FOG_CELL_SIZE };
