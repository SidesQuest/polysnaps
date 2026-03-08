import { getShapeCost, SHAPE_DEFS } from './shapes.js';

let nextId = 1;

export const gameState = $state({
	resources: {
		energy: 0
	},
	coreShape: {
		sides: 3,
		type: 'triangle'
	},
	nodes: [
		{ id: 'core', parentId: null, shape: 'triangle', edgeIndex: -1, level: 1 }
	],
	prestige: {
		level: 0,
		currency: 0,
		totalPrestigeEnergy: 0
	},
	stats: {
		totalEnergyEarned: 0,
		totalShapesPlaced: 0,
		timePlayed: 0
	}
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

export function getNodeProduction(nodeId) {
	const node = gameState.nodes.find((n) => n.id === nodeId);
	if (!node || node.id === 'core') return 0;

	const def = SHAPE_DEFS[node.shape];
	if (!def) return 0;

	const base = def.baseProduction * node.level;
	const children = getNodeChildren(node.id);

	let childBoost = 1;
	for (const child of children) {
		childBoost += child.level * 0.25;
	}

	return base * childBoost;
}

export function getTotalProduction() {
	let total = 0;
	for (const node of gameState.nodes) {
		if (node.id === 'core') continue;
		total += getNodeProduction(node.id);
	}
	return total;
}

export function getNextShapeCost() {
	return getShapeCost(getPlacedCount());
}

export function canAffordShape() {
	return gameState.resources.energy >= getNextShapeCost();
}

export function placeShape(parentId, edgeIndex) {
	const cost = getNextShapeCost();
	if (gameState.resources.energy < cost) return false;

	const alreadyExists = gameState.nodes.some(
		(n) => n.parentId === parentId && n.edgeIndex === edgeIndex
	);
	if (alreadyExists) return false;

	gameState.resources.energy -= cost;
	gameState.nodes.push({
		id: `n-${nextId++}`,
		parentId,
		shape: 'triangle',
		edgeIndex,
		level: 1
	});
	gameState.stats.totalShapesPlaced++;
	return true;
}

export function addResource(type, amount) {
	if (gameState.resources[type] !== undefined) {
		gameState.resources[type] += amount;
		if (type === 'energy') {
			gameState.stats.totalEnergyEarned += amount;
		}
	}
}

export function getUpgradeCost(node) {
	if (node.id === 'core') return Infinity;
	const def = SHAPE_DEFS[node.shape];
	return Math.floor(def.baseCost * 3 * Math.pow(1.2, node.level - 1 + getPlacedCount() * 0.5));
}

export function upgradeNode(nodeId) {
	const node = gameState.nodes.find((n) => n.id === nodeId);
	if (!node || node.id === 'core') return false;

	const cost = getUpgradeCost(node);
	if (gameState.resources.energy < cost) return false;

	gameState.resources.energy -= cost;
	node.level++;
	return true;
}

export function getPrestigeThreshold() {
	return 1000 * Math.pow(10, gameState.prestige.level);
}

export function canPrestige() {
	return gameState.stats.totalEnergyEarned >= getPrestigeThreshold();
}

export function resetForPrestige() {
	if (!canPrestige()) return;

	gameState.prestige.level++;
	gameState.prestige.totalPrestigeEnergy += gameState.stats.totalEnergyEarned;
	gameState.coreShape.sides++;
	gameState.resources.energy = 0;
	gameState.stats.totalEnergyEarned = 0;

	const shapeNames = ['triangle', 'square', 'pentagon', 'hexagon', 'heptagon', 'octagon'];
	gameState.coreShape.type = shapeNames[gameState.coreShape.sides - 3] || `${gameState.coreShape.sides}-gon`;

	nextId = 1;
	gameState.nodes = [
		{ id: 'core', parentId: null, shape: gameState.coreShape.type, edgeIndex: -1, level: 1 }
	];
}

export function loadStateFrom(saved) {
	if (!saved) return;
	Object.assign(gameState.resources, saved.resources || {});
	Object.assign(gameState.coreShape, saved.coreShape || {});
	Object.assign(gameState.prestige, saved.prestige || {});
	Object.assign(gameState.stats, saved.stats || {});
	if (saved.nodes && saved.nodes.length > 0) {
		gameState.nodes = saved.nodes;
		const maxId = saved.nodes
			.filter((n) => n.id.startsWith('n-'))
			.reduce((max, n) => Math.max(max, parseInt(n.id.split('-')[1]) || 0), 0);
		nextId = maxId + 1;
	}
}
