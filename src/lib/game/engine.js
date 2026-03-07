const TICK_RATE = 1000;

let tickInterval = null;
let listeners = [];

export function onTick(callback) {
	listeners.push(callback);
	return () => {
		listeners = listeners.filter((l) => l !== callback);
	};
}

export function startEngine() {
	if (tickInterval) return;

	tickInterval = setInterval(() => {
		const delta = TICK_RATE / 1000;
		for (const listener of listeners) {
			listener(delta);
		}
	}, TICK_RATE);
}

export function stopEngine() {
	if (tickInterval) {
		clearInterval(tickInterval);
		tickInterval = null;
	}
}
