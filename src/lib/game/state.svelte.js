import { getShapeCost, SHAPE_DEFS, buildGeometryTree } from './shapes.js';
import { getComboMultiplier, getActiveCombos } from './combos.js';
import { generateBuffZones, getZoneBonus } from './buffzones.js';
import { playPlace, playUpgrade, playPrestige, playCombo } from './audio.js';
import { getSkillEffect, canUnlockSkill, getSkillCost, getSkillDef } from './skills.js';

let nextId = 1;
let prevComboCount = 0;

export const RESOURCE_DEFS = {
	energy: { name: 'Energy', color: '#44aaff', icon: '⚡', minPrestige: 0 },
	flux: { name: 'Flux', color: '#ff44aa', icon: '🌀', minPrestige: 1, minLayer: 2 },
	prisms: { name: 'Prisms', color: '#aa44ff', icon: '💎', minPrestige: 2, minLayer: 3 }
};

export function getUnlockedResources() {
	return Object.entries(RESOURCE_DEFS)
		.filter(([, def]) => gameState.prestige.level >= def.minPrestige)
		.map(([key, def]) => ({ key, ...def }));
}

export const gameState = $state({
	resources: {
		energy: 0,
		flux: 0,
		prisms: 0
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
	tierLevels: {},
	skills: {},
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

export function getTierLevel(tier) {
	return gameState.tierLevels[tier] || 1;
}

export function getNodeProduction(nodeId) {
	const node = gameState.nodes.find((n) => n.id === nodeId);
	if (!node || node.id === 'core') return 0;

	const def = SHAPE_DEFS[node.shape];
	if (!def) return 0;

	const depth = getNodeDepth(nodeId);
	const tierLvl = getTierLevel(depth);
	const base = def.baseProduction * tierLvl;
	const children = getNodeChildren(node.id);

	const childBoostBase = 0.25 + getSkillEffect(gameState.skills, 'child_boost');
	let childBoost = 1;
	for (const child of children) {
		const childDepth = getNodeDepth(child.id);
		childBoost += getTierLevel(childDepth) * childBoostBase;
	}

	return base * childBoost;
}

export function getBuffZones() {
	return generateBuffZones(gameState.prestige.level, gameState.coreShape.sides);
}

export function getCurrentCombos() {
	return getActiveCombos(gameState.nodes, gameState.coreShape.sides);
}

export function getProductionByResource() {
	const comboMult = getComboMultiplier(gameState.nodes, gameState.coreShape.sides);
	const zones = getBuffZones();
	const geo = buildGeometryTree(gameState.nodes, gameState.coreShape.sides, 50);
	const geoMap = new Map(geo.map((g) => [g.node.id, g]));

	const result = { energy: 0, flux: 0, prisms: 0 };

	for (const node of gameState.nodes) {
		if (node.id === 'core') continue;
		let prod = getNodeProduction(node.id);
		const depth = getNodeDepth(node.id);

		const nodeGeo = geoMap.get(node.id);
		if (nodeGeo) {
			prod *= getZoneBonus(nodeGeo.center, zones);
		}

		result.energy += prod;

		if (gameState.prestige.level >= 1 && depth >= 2) {
			result.flux += prod * 0.3;
		}
		if (gameState.prestige.level >= 2 && depth >= 3) {
			result.prisms += prod * 0.1;
		}
	}

	result.energy *= comboMult * (1 + getSkillEffect(gameState.skills, 'production_mult', 'energy'));
	result.flux *= comboMult * (1 + getSkillEffect(gameState.skills, 'production_mult', 'flux'));
	result.prisms *= comboMult * (1 + getSkillEffect(gameState.skills, 'production_mult', 'prisms'));

	return result;
}

export function getTotalProduction() {
	return getProductionByResource().energy;
}

export function getNextShapeCost() {
	const base = getShapeCost(getPlacedCount());
	const reduction = getSkillEffect(gameState.skills, 'cost_reduction');
	return Math.max(1, Math.floor(base * (1 - reduction)));
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

	playPlace();

	const prevCombos = prevComboCount;
	const newCombos = getActiveCombos(gameState.nodes, gameState.coreShape.sides).length;
	if (newCombos > prevCombos) playCombo();
	prevComboCount = newCombos;

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

export function getTierUpgradeCost(tier) {
	const tierLvl = getTierLevel(tier);
	const shapesOnTier = gameState.nodes.filter((n) => n.id !== 'core' && getNodeDepth(n.id) === tier).length;
	const base = SHAPE_DEFS.triangle.baseCost * 5;
	return Math.max(1, Math.floor(base * Math.pow(1.35, tierLvl - 1) * (1 + shapesOnTier * 0.3)));
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
		if (node.id === 'core') continue;
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
	return 1 + getSkillEffect(gameState.skills, 'click_bonus');
}

export function unlockSkill(skillId) {
	if (!canUnlockSkill(gameState.skills, skillId)) return false;
	const cost = getSkillCost(gameState.skills, skillId);
	if (gameState.prestige.currency < cost) return false;

	gameState.prestige.currency -= cost;
	gameState.skills[skillId] = (gameState.skills[skillId] || 0) + 1;
	playUpgrade();
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

	const prestigeReward = Math.floor(1 + gameState.prestige.level * 0.5);
	gameState.prestige.level++;
	gameState.prestige.currency += prestigeReward;
	gameState.prestige.totalPrestigeEnergy += gameState.stats.totalEnergyEarned;
	gameState.coreShape.sides++;
	gameState.resources.energy = 0;
	gameState.resources.flux = 0;
	gameState.resources.prisms = 0;
	gameState.stats.totalEnergyEarned = 0;

	const shapeNames = ['triangle', 'square', 'pentagon', 'hexagon', 'heptagon', 'octagon'];
	gameState.coreShape.type = shapeNames[gameState.coreShape.sides - 3] || `${gameState.coreShape.sides}-gon`;

	nextId = 1;
	prevComboCount = 0;
	gameState.tierLevels = {};
	gameState.nodes = [
		{ id: 'core', parentId: null, shape: gameState.coreShape.type, edgeIndex: -1, level: 1 }
	];
	playPrestige();
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
			if (node.id === 'core') continue;
			const depth = getNodeDepthFromList(saved.nodes, node.id);
			const lvl = node.level || 1;
			migrated[depth] = Math.max(migrated[depth] || 1, lvl);
		}
		Object.assign(gameState.tierLevels, migrated);
	}
	if (saved.skills) {
		Object.assign(gameState.skills, saved.skills);
	}
	if (saved.nodes && saved.nodes.length > 0) {
		gameState.nodes = saved.nodes;
		const maxId = saved.nodes
			.filter((n) => n.id.startsWith('n-'))
			.reduce((max, n) => Math.max(max, parseInt(n.id.split('-')[1]) || 0), 0);
		nextId = maxId + 1;
	}
}
