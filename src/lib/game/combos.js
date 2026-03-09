import { buildGeometryTree } from './shapes.js';

const COMBO_DEFS = [
	{
		id: 'full-ring',
		name: 'Full Ring',
		description: 'Fill all edges of the core',
		check: (nodes, coreSides) => {
			const coreChildren = nodes.filter((n) => n.parentId === 'core');
			return coreChildren.length >= coreSides;
		},
		bonus: { type: 'multiply', value: 1.5, target: 'all' },
		icon: '⭕'
	},
	{
		id: 'twin-branch',
		name: 'Twin Branch',
		description: 'Fill both edges of any shape',
		check: (nodes) => {
			const nonCore = nodes.filter((n) => n.id !== 'core');
			return nonCore.some((parent) => {
				const children = nodes.filter((n) => n.parentId === parent.id);
				return children.length >= 2;
			});
		},
		bonus: { type: 'multiply', value: 1.2, target: 'all' },
		icon: '🔱'
	},
	{
		id: 'deep-reach',
		name: 'Deep Reach',
		description: 'Build a chain 3 layers deep',
		check: (nodes) => {
			function getDepth(nodeId) {
				let d = 0, cur = nodes.find((n) => n.id === nodeId);
				while (cur && cur.parentId) { d++; cur = nodes.find((n) => n.id === cur.parentId); }
				return d;
			}
			return nodes.some((n) => getDepth(n.id) >= 3);
		},
		bonus: { type: 'multiply', value: 1.3, target: 'all' },
		icon: '🌀'
	},
	{
		id: 'five-shapes',
		name: 'Pentagon of Power',
		description: 'Place 5 shapes total',
		check: (nodes) => nodes.length - 1 >= 5,
		bonus: { type: 'multiply', value: 1.15, target: 'all' },
		icon: '⬠'
	},
	{
		id: 'ten-shapes',
		name: 'Decagon Dream',
		description: 'Place 10 shapes total',
		check: (nodes) => nodes.length - 1 >= 10,
		bonus: { type: 'multiply', value: 1.25, target: 'all' },
		icon: '✦'
	},
	{
		id: 'twenty-shapes',
		name: 'Geometric Explosion',
		description: 'Place 20 shapes total',
		check: (nodes) => nodes.length - 1 >= 20,
		bonus: { type: 'multiply', value: 1.5, target: 'all' },
		icon: '💥'
	},
	{
		id: 'all-twins',
		name: 'Perfect Symmetry',
		description: 'Every placed shape has both edges filled',
		check: (nodes) => {
			const nonCore = nodes.filter((n) => n.id !== 'core');
			if (nonCore.length < 3) return false;
			return nonCore.every((parent) => {
				const children = nodes.filter((n) => n.parentId === parent.id);
				return children.length >= 2;
			});
		},
		bonus: { type: 'multiply', value: 2.0, target: 'all' },
		icon: '🪞'
	},
	{
		id: 'max-level-5',
		name: 'Forged',
		description: 'Upgrade any shape to level 5',
		check: (nodes) => nodes.some((n) => n.id !== 'core' && n.level >= 5),
		bonus: { type: 'multiply', value: 1.2, target: 'all' },
		icon: '🔥'
	},
	{
		id: 'deep-reach-5',
		name: 'Abyss Walker',
		description: 'Build a chain 5 layers deep',
		check: (nodes) => {
			function getDepth(nodeId) {
				let d = 0, cur = nodes.find((n) => n.id === nodeId);
				while (cur && cur.parentId) { d++; cur = nodes.find((n) => n.id === cur.parentId); }
				return d;
			}
			return nodes.some((n) => getDepth(n.id) >= 5);
		},
		bonus: { type: 'multiply', value: 1.5, target: 'all' },
		icon: '🕳️'
	}
];

export function getActiveCombos(nodes, coreSides) {
	return COMBO_DEFS.filter((combo) => combo.check(nodes, coreSides));
}

export function getComboMultiplier(nodes, coreSides) {
	const active = getActiveCombos(nodes, coreSides);
	let multiplier = 1;
	for (const combo of active) {
		if (combo.bonus.type === 'multiply') {
			multiplier *= combo.bonus.value;
		}
	}
	return multiplier;
}

export function getAllCombos() {
	return COMBO_DEFS;
}
