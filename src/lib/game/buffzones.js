const ZONE_TYPES = [
	{ id: 'power', name: 'Power Zone', color: '#ff6644', multiplier: 2.0, icon: '⚡', description: '2x production' },
	{ id: 'speed', name: 'Flow Zone', color: '#44ddff', multiplier: 1.5, icon: '💨', description: '1.5x production' },
	{ id: 'growth', name: 'Growth Zone', color: '#66ff44', multiplier: 1.75, icon: '🌱', description: '1.75x production' }
];

function seededRandom(seed) {
	let s = seed;
	return () => {
		s = (s * 16807) % 2147483647;
		return (s - 1) / 2147483646;
	};
}

export function generateBuffZones(prestigeLevel, coreSides) {
	const seed = (prestigeLevel + 1) * 7919 + coreSides * 31;
	const rng = seededRandom(seed);

	const zoneCount = 2 + prestigeLevel;
	const zones = [];

	for (let i = 0; i < zoneCount; i++) {
		const angle = rng() * Math.PI * 2;
		const distance = 120 + rng() * 200;
		const type = ZONE_TYPES[Math.floor(rng() * ZONE_TYPES.length)];

		zones.push({
			id: `zone-${prestigeLevel}-${i}`,
			x: Math.cos(angle) * distance,
			y: Math.sin(angle) * distance,
			radius: 50 + rng() * 30,
			...type
		});
	}

	return zones;
}

export function getZoneBonus(shapeCenter, zones) {
	let bonus = 1;
	for (const zone of zones) {
		const dx = shapeCenter.x - zone.x;
		const dy = shapeCenter.y - zone.y;
		const dist = Math.sqrt(dx * dx + dy * dy);
		if (dist <= zone.radius) {
			bonus *= zone.multiplier;
		}
	}
	return bonus;
}
