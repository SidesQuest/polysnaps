export const SHAPE_DEFS = {
  triangle: {
    name: "Triangle",
    sides: 3,
    baseCost: 10,
    costMultiplier: 1.12,
    baseProduction: 1,
    role: "generator",
    description: "Basic generator. Produces resources.",
    minPrestige: 0,
    freeEdges: 2,
  },
  square: {
    name: "Square",
    sides: 4,
    baseCost: 50,
    costMultiplier: 1.15,
    baseProduction: 0.5,
    role: "multiplier",
    multiplierValue: 1.5,
    description: "Multiplier. Boosts connected shape throughput by 1.5x.",
    minPrestige: 1,
    freeEdges: 3,
  },
  pentagon: {
    name: "Pentagon",
    sides: 5,
    baseCost: 200,
    costMultiplier: 1.18,
    baseProduction: 0.25,
    role: "storage",
    storageCapacity: 500,
    description: "Storage. Accumulates resources for burst release.",
    minPrestige: 2,
    freeEdges: 4,
  },
  hexagon: {
    name: "Hexagon",
    sides: 6,
    baseCost: 800,
    costMultiplier: 1.2,
    baseProduction: 0.1,
    role: "converter",
    conversionRate: 0.2,
    description: "Converter. Transforms one resource type into another.",
    minPrestige: 3,
    freeEdges: 5,
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

  const sideLen = edgeLen;
  const apothem = sideLen / (2 * Math.tan(Math.PI / sides));
  const polyCenter = { x: mx + nx * apothem, y: my + ny * apothem };

  const edgeAngle = Math.atan2(ey, ex);
  const vertices = [];
  for (let i = 0; i < sides; i++) {
    const circumR = sideLen / (2 * Math.sin(Math.PI / sides));
    const angle = edgeAngle + Math.PI / sides + (i * 2 * Math.PI) / sides;
    vertices.push({
      x: polyCenter.x + Math.cos(angle) * circumR,
      y: polyCenter.y + Math.sin(angle) * circumR,
    });
  }

  let bestIdx = 0;
  let bestDist = Infinity;
  for (let i = 0; i < vertices.length; i++) {
    const d = Math.hypot(vertices[i].x - edgeV1.x, vertices[i].y - edgeV1.y);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  }

  const rotated = [];
  for (let i = 0; i < sides; i++) {
    rotated.push(vertices[(bestIdx + i) % sides]);
  }
  return rotated;
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

function getNodeDepth(nodes, nodeId) {
  let depth = 0;
  let current = nodes.find((n) => n.id === nodeId);
  while (current && current.parentId) {
    depth++;
    current = nodes.find((n) => n.id === current.parentId);
  }
  return depth;
}
