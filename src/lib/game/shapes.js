export const SHAPE_DEFS = {
	triangle: {
		name: 'Triangle',
		sides: 3,
		baseCost: 10,
		costMultiplier: 1.12,
		baseProduction: 1,
		description: 'Basic generator. Produces energy.'
	}
};

export function getShapeCost(totalPlaced) {
	return Math.floor(SHAPE_DEFS.triangle.baseCost * Math.pow(SHAPE_DEFS.triangle.costMultiplier, totalPlaced));
}

export function getCoreVertices(sides, radius) {
	const vertices = [];
	for (let i = 0; i < sides; i++) {
		const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
		vertices.push({
			x: Math.cos(angle) * radius,
			y: Math.sin(angle) * radius
		});
	}
	return vertices;
}

export function getAttachedTriangleVertices(edgeV1, edgeV2, parentCenterX, parentCenterY) {
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

	const height = edgeLen * Math.sqrt(3) / 2;
	const tip = { x: mx + nx * height, y: my + ny * height };

	return [edgeV1, edgeV2, tip];
}

export function getTriangleCenter(verts) {
	return {
		x: (verts[0].x + verts[1].x + verts[2].x) / 3,
		y: (verts[0].y + verts[1].y + verts[2].y) / 3
	};
}

export function getFreeEdges(triangleVerts) {
	return [
		{ v1: triangleVerts[1], v2: triangleVerts[2], edgeLocalIndex: 0 },
		{ v1: triangleVerts[2], v2: triangleVerts[0], edgeLocalIndex: 1 }
	];
}

export function verticesToString(vertices) {
	return vertices.map((v) => `${v.x},${v.y}`).join(' ');
}

export function getPolygonPointsString(sides, radius) {
	return verticesToString(getCoreVertices(sides, radius));
}

export function buildGeometryTree(nodes, coreSides, coreRadius) {
	const coreVerts = getCoreVertices(coreSides, coreRadius);
	const result = [];
	const nodeMap = new Map();

	const coreNode = nodes.find((n) => n.id === 'core');
	if (!coreNode) return result;

	const coreCenter = { x: 0, y: 0 };
	nodeMap.set('core', { vertices: coreVerts, center: coreCenter });

	result.push({
		node: coreNode,
		vertices: coreVerts,
		center: coreCenter,
		isCore: true
	});

	const coreChildren = nodes.filter((n) => n.parentId === 'core');
	for (const child of coreChildren) {
		const v1 = coreVerts[child.edgeIndex];
		const v2 = coreVerts[(child.edgeIndex + 1) % coreSides];
		const childVerts = getAttachedTriangleVertices(v1, v2, 0, 0);
		const childCenter = getTriangleCenter(childVerts);

		nodeMap.set(child.id, { vertices: childVerts, center: childCenter });
		result.push({
			node: child,
			vertices: childVerts,
			center: childCenter,
			isCore: false,
			parentCenter: coreCenter
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

			const freeEdges = getFreeEdges(parentGeo.vertices);
			const children = nodes.filter((n) => n.parentId === parent.id);

			for (const child of children) {
				const edge = freeEdges[child.edgeIndex];
				if (!edge) continue;

				const childVerts = getAttachedTriangleVertices(
					edge.v1, edge.v2,
					parentGeo.center.x, parentGeo.center.y
				);
				const childCenter = getTriangleCenter(childVerts);

				nodeMap.set(child.id, { vertices: childVerts, center: childCenter });
				result.push({
					node: child,
					vertices: childVerts,
					center: childCenter,
					isCore: false,
					parentCenter: parentGeo.center
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

	const coreNode = nodes.find((n) => n.id === 'core');
	if (!coreNode) return slots;

	const coreVerts = getCoreVertices(coreSides, coreRadius);
	for (let i = 0; i < coreSides; i++) {
		const hasChild = nodes.some((n) => n.parentId === 'core' && n.edgeIndex === i);
		if (!hasChild) {
			const v1 = coreVerts[i];
			const v2 = coreVerts[(i + 1) % coreSides];
			const slotVerts = getAttachedTriangleVertices(v1, v2, 0, 0);
			slots.push({
				parentId: 'core',
				edgeIndex: i,
				vertices: slotVerts,
				center: getTriangleCenter(slotVerts),
				layer: 1
			});
		}
	}

	const filledNonCore = nodes.filter((n) => n.id !== 'core');
	for (const node of filledNonCore) {
		const nodeGeo = nodeMap.get(node.id);
		if (!nodeGeo) continue;

		const freeEdges = getFreeEdges(nodeGeo.vertices);
		for (let i = 0; i < freeEdges.length; i++) {
			const hasChild = nodes.some((n) => n.parentId === node.id && n.edgeIndex === i);
			if (!hasChild) {
				const edge = freeEdges[i];
				const slotVerts = getAttachedTriangleVertices(
					edge.v1, edge.v2,
					nodeGeo.center.x, nodeGeo.center.y
				);
				const layer = getNodeDepth(nodes, node.id) + 1;
				slots.push({
					parentId: node.id,
					edgeIndex: i,
					vertices: slotVerts,
					center: getTriangleCenter(slotVerts),
					layer
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
