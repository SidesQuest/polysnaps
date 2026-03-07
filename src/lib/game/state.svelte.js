export const gameState = $state({
	resources: {
		energy: 0
	},
	shapes: [],
	coreShape: {
		sides: 3,
		type: 'triangle',
		x: 0,
		y: 0
	},
	prestige: {
		level: 0,
		currency: 0
	},
	stats: {
		totalEnergyEarned: 0,
		totalShapesPlaced: 0,
		timePlayed: 0
	}
});

export function addResource(type, amount) {
	if (gameState.resources[type] !== undefined) {
		gameState.resources[type] += amount;
	}
}

export function placeShape(shape) {
	gameState.shapes.push(shape);
	gameState.stats.totalShapesPlaced++;
}

export function resetForPrestige() {
	gameState.prestige.level++;
	gameState.coreShape.sides++;
	gameState.resources.energy = 0;
	gameState.shapes = [];

	const shapeNames = ['triangle', 'square', 'pentagon', 'hexagon', 'heptagon', 'octagon'];
	gameState.coreShape.type = shapeNames[gameState.coreShape.sides - 3] || `${gameState.coreShape.sides}-gon`;
}
