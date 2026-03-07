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
	// TODO: calculate based on production rates and offline multiplier
	const baseProductionPerSecond = gameState.shapes.length;
	const offlineMultiplier = 0.5; // 50% efficiency while offline, upgradeable later

	return {
		energy: Math.floor(baseProductionPerSecond * offlineSeconds * offlineMultiplier)
	};
}
