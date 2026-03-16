export const SHAPE_DEFS = {
  triangle: {
    name: "Triangle",
    sides: 3,
    baseCost: 10,
    costMultiplier: 1.12,
    baseProduction: 2,
    role: "generator",
    description: "Generator. Produces resources passively.",
    minPrestige: 0,
    freeEdges: 2,
    costResources: { energy: 1.0 },
  },
  square: {
    name: "Square",
    sides: 4,
    baseCost: 50,
    costMultiplier: 1.15,
    baseProduction: 0.5,
    role: "multiplier",
    multiplierValue: 1.5,
    description: "Multiplier. Boosts adjacent shape output by 1.5x.",
    minPrestige: 1,
    freeEdges: 3,
    costResources: { energy: 1.0, flux: 0.5 },
  },
  pentagon: {
    name: "Pentagon",
    sides: 5,
    baseCost: 200,
    costMultiplier: 1.18,
    baseProduction: 1.0,
    role: "storage",
    storageCapacity: 100,
    burstMultiplier: 1.5,
    description: "Storage. Accumulates resources, tap to release burst.",
    minPrestige: 2,
    freeEdges: 4,
    costResources: { energy: 1.0, flux: 0.5, prisms: 0.3 },
  },
  hexagon: {
    name: "Hexagon",
    sides: 6,
    baseCost: 800,
    costMultiplier: 1.2,
    baseProduction: 0.5,
    role: "synergy",
    synergyBoost: 0.15,
    description: "Synergy. Boosts production of ALL resource types.",
    minPrestige: 3,
    freeEdges: 5,
    costResources: { energy: 1.0, flux: 0.8, prisms: 0.5 },
  },
};

export function getUnlockedShapes(prestigeLevel) {
  return Object.entries(SHAPE_DEFS)
    .filter(([, def]) => prestigeLevel >= def.minPrestige)
    .map(([key, def]) => ({ key, ...def }));
}

export function getShapeCost(totalPlaced, shapeType = "triangle") {
  const def = SHAPE_DEFS[shapeType] || SHAPE_DEFS.triangle;
  return Math.floor(def.baseCost * Math.pow(def.costMultiplier, totalPlaced));
}

export function getCoreVertices(sides, radius) {
  const vertices = [];
  for (let i = 0; i < sides; i++) {
    const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
    vertices.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    });
  }
  return vertices;
}

export function getRegularPolygonVertices(
  sides,
  centerX,
  centerY,
  edgeV1,
  edgeV2,
  parentCenterX,
  parentCenterY,
) {
  const mx = (edgeV1.x + edgeV2.x) / 2;
  const my = (edgeV1.y + edgeV2.y) / 2;

  const ex = edgeV2.x - edgeV1.x;
  const ey = edgeV2.y - edgeV1.y;
  const edgeLen = Math.sqrt(ex * ex + ey * ey);

  let nx = -ey / edgeLen;
  let ny = ex / edgeLen;

  const toMidX = mx - parentCenterX;
  const toMidY = my - parentCenterY;
  if (nx * toMidX + ny * toMidY < 0) {
    nx = -nx;
    ny = -ny;
  }

  if (sides === 3) {
    const height = (edgeLen * Math.sqrt(3)) / 2;
    const tip = { x: mx + nx * height, y: my + ny * height };
    return [edgeV1, edgeV2, tip];
  }

  const apothem = edgeLen / (2 * Math.tan(Math.PI / sides));
  const polyCenter = { x: mx + nx * apothem, y: my + ny * apothem };
  const circumR = edgeLen / (2 * Math.sin(Math.PI / sides));

  const a1 = Math.atan2(edgeV1.y - polyCenter.y, edgeV1.x - polyCenter.x);
  const a2 = Math.atan2(edgeV2.y - polyCenter.y, edgeV2.x - polyCenter.x);

  let angleDelta = a2 - a1;
  if (angleDelta > Math.PI) angleDelta -= 2 * Math.PI;
  if (angleDelta < -Math.PI) angleDelta += 2 * Math.PI;

  const step = angleDelta > 0 ? (2 * Math.PI) / sides : -(2 * Math.PI) / sides;

  const vertices = [];
  for (let i = 0; i < sides; i++) {
    const angle = a1 + i * step;
    vertices.push({
      x: polyCenter.x + circumR * Math.cos(angle),
      y: polyCenter.y + circumR * Math.sin(angle),
    });
  }
  return vertices;
}

export function getAttachedTriangleVertices(
  edgeV1,
  edgeV2,
  parentCenterX,
  parentCenterY,
) {
  return getRegularPolygonVertices(
    3,
    0,
    0,
    edgeV1,
    edgeV2,
    parentCenterX,
    parentCenterY,
  );
}

export function getAttachedShapeVertices(
  sides,
  edgeV1,
  edgeV2,
  parentCenterX,
  parentCenterY,
) {
  return getRegularPolygonVertices(
    sides,
    0,
    0,
    edgeV1,
    edgeV2,
    parentCenterX,
    parentCenterY,
  );
}

export function getPolygonCenter(verts) {
  let sx = 0,
    sy = 0;
  for (const v of verts) {
    sx += v.x;
    sy += v.y;
  }
  return { x: sx / verts.length, y: sy / verts.length };
}

export function getTriangleCenter(verts) {
  return getPolygonCenter(verts);
}

export function getFreeEdges(shapeVerts, shapeSides) {
  const sides = shapeSides || 3;
  const edges = [];
  for (let i = 1; i < sides; i++) {
    edges.push({
      v1: shapeVerts[i],
      v2: shapeVerts[(i + 1) % sides],
      edgeLocalIndex: i - 1,
    });
  }
  return edges;
}

export function verticesToString(vertices) {
  return vertices.map((v) => `${v.x},${v.y}`).join(" ");
}

export function getPolygonPointsString(sides, radius) {
  return verticesToString(getCoreVertices(sides, radius));
}

export function buildGeometryTree(nodes, coreSides, coreRadius) {
  const coreVerts = getCoreVertices(coreSides, coreRadius);
  const result = [];
  const nodeMap = new Map();

  const coreNode = nodes.find((n) => n.id === "core");
  if (!coreNode) return result;

  const coreCenter = { x: 0, y: 0 };
  nodeMap.set("core", { vertices: coreVerts, center: coreCenter });

  result.push({
    node: coreNode,
    vertices: coreVerts,
    center: coreCenter,
    isCore: true,
  });

  const coreChildren = nodes.filter((n) => n.parentId === "core");
  for (const child of coreChildren) {
    const v1 = coreVerts[child.edgeIndex];
    const v2 = coreVerts[(child.edgeIndex + 1) % coreSides];
    const shapeDef = SHAPE_DEFS[child.shape] || SHAPE_DEFS.triangle;
    const childVerts = getAttachedShapeVertices(shapeDef.sides, v1, v2, 0, 0);
    const childCenter = getPolygonCenter(childVerts);

    nodeMap.set(child.id, {
      vertices: childVerts,
      center: childCenter,
      sides: shapeDef.sides,
    });
    result.push({
      node: child,
      vertices: childVerts,
      center: childCenter,
      isCore: false,
      parentCenter: coreCenter,
    });
  }

  let processLayer = coreChildren;
  let safety = 0;
  while (processLayer.length > 0 && safety < 20) {
    safety++;
    const nextLayer = [];
    for (const parent of processLayer) {
      const parentGeo = nodeMap.get(parent.id);
      if (!parentGeo) continue;

      const parentDef = SHAPE_DEFS[parent.shape] || SHAPE_DEFS.triangle;
      const freeEdges = getFreeEdges(parentGeo.vertices, parentDef.sides);
      const children = nodes.filter((n) => n.parentId === parent.id);

      for (const child of children) {
        const edge = freeEdges[child.edgeIndex];
        if (!edge) continue;

        const childDef = SHAPE_DEFS[child.shape] || SHAPE_DEFS.triangle;
        const childVerts = getAttachedShapeVertices(
          childDef.sides,
          edge.v1,
          edge.v2,
          parentGeo.center.x,
          parentGeo.center.y,
        );
        const childCenter = getPolygonCenter(childVerts);

        nodeMap.set(child.id, {
          vertices: childVerts,
          center: childCenter,
          sides: childDef.sides,
        });
        result.push({
          node: child,
          vertices: childVerts,
          center: childCenter,
          isCore: false,
          parentCenter: parentGeo.center,
        });
        nextLayer.push(child);
      }
    }
    processLayer = nextLayer;
  }

  return result;
}

export function getOpenSlots(nodes, coreSides, coreRadius) {
  const geo = buildGeometryTree(nodes, coreSides, coreRadius);
  const slots = [];
  const nodeMap = new Map();
  for (const g of geo) {
    nodeMap.set(g.node.id, g);
  }

  const coreNode = nodes.find((n) => n.id === "core");
  if (!coreNode) return slots;

  const coreVerts = getCoreVertices(coreSides, coreRadius);
  for (let i = 0; i < coreSides; i++) {
    const hasChild = nodes.some(
      (n) => n.parentId === "core" && n.edgeIndex === i,
    );
    if (!hasChild) {
      const v1 = coreVerts[i];
      const v2 = coreVerts[(i + 1) % coreSides];
      const slotVerts = getAttachedTriangleVertices(v1, v2, 0, 0);
      slots.push({
        parentId: "core",
        edgeIndex: i,
        vertices: slotVerts,
        center: getPolygonCenter(slotVerts),
        layer: 1,
      });
    }
  }

  const filledNonCore = nodes.filter((n) => n.id !== "core");
  for (const node of filledNonCore) {
    const nodeGeo = nodeMap.get(node.id);
    if (!nodeGeo) continue;

    const nodeDef = SHAPE_DEFS[node.shape] || SHAPE_DEFS.triangle;
    const freeEdges = getFreeEdges(nodeGeo.vertices, nodeDef.sides);
    for (let i = 0; i < freeEdges.length; i++) {
      const hasChild = nodes.some(
        (n) => n.parentId === node.id && n.edgeIndex === i,
      );
      if (!hasChild) {
        const edge = freeEdges[i];
        const slotVerts = getAttachedTriangleVertices(
          edge.v1,
          edge.v2,
          nodeGeo.center.x,
          nodeGeo.center.y,
        );
        const layer = getNodeDepth(nodes, node.id) + 1;
        slots.push({
          parentId: node.id,
          edgeIndex: i,
          vertices: slotVerts,
          center: getPolygonCenter(slotVerts),
          layer,
        });
      }
    }
  }

  return slots;
}

function pointInPolygon(px, py, verts) {
  let inside = false;
  for (let i = 0, j = verts.length - 1; i < verts.length; j = i++) {
    const xi = verts[i].x,
      yi = verts[i].y;
    const xj = verts[j].x,
      yj = verts[j].y;
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function segmentsIntersect(a1, a2, b1, b2) {
  const d1x = a2.x - a1.x,
    d1y = a2.y - a1.y;
  const d2x = b2.x - b1.x,
    d2y = b2.y - b1.y;
  const cross = d1x * d2y - d1y * d2x;
  if (Math.abs(cross) < 1e-10) return false;
  const t = ((b1.x - a1.x) * d2y - (b1.y - a1.y) * d2x) / cross;
  const u = ((b1.x - a1.x) * d1y - (b1.y - a1.y) * d1x) / cross;
  return t > 0.01 && t < 0.99 && u > 0.01 && u < 0.99;
}

function polygonsEdgeIntersect(vertsA, vertsB) {
  for (let i = 0; i < vertsA.length; i++) {
    const a1 = vertsA[i],
      a2 = vertsA[(i + 1) % vertsA.length];
    for (let j = 0; j < vertsB.length; j++) {
      const b1 = vertsB[j],
        b2 = vertsB[(j + 1) % vertsB.length];
      if (segmentsIntersect(a1, a2, b1, b2)) return true;
    }
  }
  return false;
}

export function wouldOverlap(newVerts, nodes, coreSides, coreRadius, parentId) {
  const geo = buildGeometryTree(nodes, coreSides, coreRadius);
  const newCenter = getPolygonCenter(newVerts);

  for (const g of geo) {
    if (g.node.id === parentId || g.node.id === "core") continue;

    const dx = newCenter.x - g.center.x;
    const dy = newCenter.y - g.center.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 5) return true;

    if (pointInPolygon(newCenter.x, newCenter.y, g.vertices)) return true;
    if (pointInPolygon(g.center.x, g.center.y, newVerts)) return true;

    for (const v of newVerts) {
      if (pointInPolygon(v.x, v.y, g.vertices)) return true;
    }
    for (const v of g.vertices) {
      if (pointInPolygon(v.x, v.y, newVerts)) return true;
    }

    if (polygonsEdgeIntersect(newVerts, g.vertices)) return true;
  }
  return false;
}

function getNodeDepth(nodes, nodeId) {
  let depth = 0;
  let current = nodes.find((n) => n.id === nodeId);
  while (current && current.parentId) {
    depth++;
    current = nodes.find((n) => n.id === current.parentId);
  }
  return depth;
}
