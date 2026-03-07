<script>
	import { onMount, onDestroy } from 'svelte';
	import { gameState, addResource } from '$lib/game/state.svelte.js';
	import { startEngine, stopEngine, onTick } from '$lib/game/engine.js';
	import { formatNumber } from '$lib/utils/format.js';

	let energyPerSecond = $derived(gameState.shapes.length);

	onMount(() => {
		const unsubscribe = onTick((delta) => {
			addResource('energy', energyPerSecond * delta);
			gameState.stats.timePlayed += delta;
		});

		startEngine();

		return () => {
			unsubscribe();
			stopEngine();
		};
	});

	function handleCoreClick() {
		addResource('energy', 1);
		gameState.stats.totalEnergyEarned += 1;
	}
</script>

<div class="game-canvas">
	<div class="hud">
		<div class="resource-display">
			<span class="resource-label">Energy</span>
			<span class="resource-value">{formatNumber(gameState.resources.energy)}</span>
			<span class="resource-rate">{formatNumber(energyPerSecond)}/s</span>
		</div>
		<div class="stats">
			<span>Core: {gameState.coreShape.type} ({gameState.coreShape.sides} sides)</span>
			<span>Shapes: {gameState.shapes.length}</span>
		</div>
	</div>

	<div class="canvas-area">
		<button class="core-shape" onclick={handleCoreClick}>
			<svg viewBox="-60 -60 120 120" width="120" height="120">
				<polygon
					points={getPolygonPoints(gameState.coreShape.sides, 50)}
					fill="none"
					stroke="var(--color-accent)"
					stroke-width="2"
				/>
			</svg>
			<span class="core-label">TAP</span>
		</button>
		<p class="hint">click the core to earn energy</p>
	</div>
</div>

<script module>
	function getPolygonPoints(sides, radius) {
		const points = [];
		for (let i = 0; i < sides; i++) {
			const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
			points.push(`${Math.cos(angle) * radius},${Math.sin(angle) * radius}`);
		}
		return points.join(' ');
	}
</script>

<style>
	.game-canvas {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		position: relative;
	}

	.hud {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		padding: 1.5rem;
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		z-index: 10;
	}

	.resource-display {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.resource-label {
		font-size: 0.6rem;
		color: var(--color-text-dim);
		text-transform: uppercase;
		letter-spacing: 2px;
	}

	.resource-value {
		font-size: 1.5rem;
		color: var(--color-accent);
		text-shadow: 0 0 20px var(--color-accent-glow);
	}

	.resource-rate {
		font-size: 0.5rem;
		color: var(--color-green);
	}

	.stats {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.5rem;
		color: var(--color-text-dim);
		text-align: right;
	}

	.canvas-area {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1.5rem;
	}

	.core-shape {
		background: none;
		border: none;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		transition: transform 0.1s;
		position: relative;
	}

	.core-shape:active {
		transform: scale(0.95);
	}

	.core-shape:hover polygon {
		filter: drop-shadow(0 0 15px var(--color-accent));
	}

	.core-label {
		font-family: var(--font-pixel);
		font-size: 0.5rem;
		color: var(--color-text-dim);
		letter-spacing: 3px;
	}

	.hint {
		font-size: 0.45rem;
		color: var(--color-text-dim);
		opacity: 0.5;
	}
</style>
