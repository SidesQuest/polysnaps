import { SHAPE_DEFS } from './shapes.js';

const LAST_ONLINE_KEY = 'polysnaps_last_online';

export function recordOnlineTime() {
	localStorage.setItem(LAST_ONLINE_KEY, Date.now().toString());
}

export function getOfflineSeconds() {
	const lastOnline = localStorage.getItem(LAST_ONLINE_KEY);
	if (!lastOnline) return 0;

	const elapsed = (Date.now() - parseInt(lastOnline)) / 1000;
	return Math.max(0, Math.floor(elapsed));
}

export function calculateOfflineEarnings(gameState, offlineSeconds) {
	let productionPerSecond = 0;
	for (const node of gameState.nodes) {
		if (node.id === 'core') continue;
		const def = SHAPE_DEFS[node.shape];
		if (def) productionPerSecond += def.baseProduction * node.level;
	}

	const offlineMultiplier = 0.5;

	return {
		energy: Math.floor(productionPerSecond * offlineSeconds * offlineMultiplier)
	};
}
