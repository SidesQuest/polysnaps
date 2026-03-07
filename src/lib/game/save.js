const SAVE_KEY = 'polysnaps_save';

export function saveGame(gameState) {
	try {
		const data = JSON.stringify(gameState);
		localStorage.setItem(SAVE_KEY, data);
	} catch (e) {
		console.error('Failed to save game:', e);
	}
}

export function loadGame() {
	try {
		const data = localStorage.getItem(SAVE_KEY);
		if (!data) return null;
		return JSON.parse(data);
	} catch (e) {
		console.error('Failed to load game:', e);
		return null;
	}
}

export function deleteSave() {
	localStorage.removeItem(SAVE_KEY);
}

export function hasSave() {
	return localStorage.getItem(SAVE_KEY) !== null;
}
