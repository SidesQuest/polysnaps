export const SKILL_DEFS = [
	{
		id: 'prod-boost-1',
		name: 'Energy Surge',
		description: '+25% energy production',
		icon: '⚡',
		cost: 1,
		maxLevel: 5,
		effect: { type: 'production_mult', resource: 'energy', value: 0.25 },
		x: 0, y: 0,
		connects: ['flux-boost', 'click-boost']
	},
	{
		id: 'click-boost',
		name: 'Power Tap',
		description: '+2 energy per tap',
		icon: '👆',
		cost: 1,
		maxLevel: 10,
		effect: { type: 'click_bonus', value: 2 },
		x: 2, y: 0,
		connects: ['child-boost', 'cost-reduction']
	},
	{
		id: 'flux-boost',
		name: 'Flux Amplifier',
		description: '+30% flux production',
		icon: '🌀',
		cost: 3,
		maxLevel: 5,
		requires: 'prod-boost-1',
		effect: { type: 'production_mult', resource: 'flux', value: 0.30 },
		x: -1, y: 1.4,
		connects: ['prism-boost']
	},
	{
		id: 'child-boost',
		name: 'Branch Power',
		description: '+15% child shape boost',
		icon: '🔱',
		cost: 2,
		maxLevel: 5,
		requires: 'click-boost',
		effect: { type: 'child_boost', value: 0.15 },
		x: 1, y: 1.4,
		connects: ['combo-boost']
	},
	{
		id: 'cost-reduction',
		name: 'Efficient Design',
		description: '-10% shape placement cost',
		icon: '💰',
		cost: 2,
		maxLevel: 5,
		requires: 'click-boost',
		effect: { type: 'cost_reduction', value: 0.10 },
		x: 3, y: 1.4,
		connects: ['zone-range']
	},
	{
		id: 'prism-boost',
		name: 'Prism Refractor',
		description: '+30% prism production',
		icon: '💎',
		cost: 5,
		maxLevel: 5,
		requires: 'flux-boost',
		effect: { type: 'production_mult', resource: 'prisms', value: 0.30 },
		x: -1, y: 2.8,
		connects: []
	},
	{
		id: 'combo-boost',
		name: 'Pattern Mastery',
		description: '+10% combo multiplier bonus',
		icon: '✨',
		cost: 4,
		maxLevel: 3,
		requires: 'child-boost',
		effect: { type: 'combo_boost', value: 0.10 },
		x: 1, y: 2.8,
		connects: ['offline-boost']
	},
	{
		id: 'zone-range',
		name: 'Zone Expansion',
		description: '+20% buff zone radius',
		icon: '🎯',
		cost: 2,
		maxLevel: 3,
		requires: 'cost-reduction',
		effect: { type: 'zone_range', value: 0.20 },
		x: 3, y: 2.8,
		connects: ['offline-boost']
	},
	{
		id: 'offline-boost',
		name: 'Dream Factory',
		description: '+20% offline production',
		icon: '🌙',
		cost: 3,
		maxLevel: 3,
		requires: 'combo-boost',
		effect: { type: 'offline_mult', value: 0.20 },
		x: 2, y: 4.2,
		connects: []
	}
];

export function getSkillDef(skillId) {
	return SKILL_DEFS.find((s) => s.id === skillId);
}

export function getSkillLevel(skills, skillId) {
	return skills[skillId] || 0;
}

export function canUnlockSkill(skills, skillId) {
	const def = getSkillDef(skillId);
	if (!def) return false;
	if (def.requires && !skills[def.requires]) return false;
	const current = skills[skillId] || 0;
	return current < def.maxLevel;
}

export function getSkillCost(skills, skillId) {
	const def = getSkillDef(skillId);
	if (!def) return Infinity;
	const current = skills[skillId] || 0;
	return def.cost * (current + 1);
}

export function getSkillEffect(skills, effectType, resource) {
	let total = 0;
	for (const def of SKILL_DEFS) {
		const level = skills[def.id] || 0;
		if (level === 0) continue;
		if (def.effect.type !== effectType) continue;
		if (resource && def.effect.resource && def.effect.resource !== resource) continue;
		total += def.effect.value * level;
	}
	return total;
}

export function getSkillConnections() {
	const connections = [];
	for (const def of SKILL_DEFS) {
		for (const targetId of def.connects) {
			const target = getSkillDef(targetId);
			if (target) {
				connections.push({ from: def, to: target });
			}
		}
	}
	return connections;
}

export function getVisibility(skills) {
	const visibility = {};

	for (const def of SKILL_DEFS) {
		const level = skills[def.id] || 0;
		if (level > 0) {
			visibility[def.id] = 'unlocked';
		}
	}

	if (!visibility['prod-boost-1'] && !visibility['click-boost']) {
		visibility['prod-boost-1'] = 'available';
		visibility['click-boost'] = 'available';
	}

	for (const def of SKILL_DEFS) {
		if (visibility[def.id]) continue;
		if (def.requires && visibility[def.requires]) {
			visibility[def.id] = 'available';
		}
	}

	for (const def of SKILL_DEFS) {
		if (visibility[def.id]) continue;

		let nearUnlocked = false;
		for (const otherDef of SKILL_DEFS) {
			if (!visibility[otherDef.id]) continue;
			if (otherDef.connects.includes(def.id) || def.connects.includes(otherDef.id)) {
				nearUnlocked = true;
				break;
			}
		}
		if (nearUnlocked) {
			visibility[def.id] = 'foggy';
		}
	}

	return visibility;
}
