<script>
	import { gameState, resetForPrestige, canPrestige, getPrestigeThreshold } from '$lib/game/state.svelte.js';
	import { formatNumber } from '$lib/utils/format.js';

	let threshold = $derived(getPrestigeThreshold());
	let ready = $derived(canPrestige());
	let nextSides = $derived(gameState.coreShape.sides + 1);
	let shapeNames = ['triangle', 'square', 'pentagon', 'hexagon', 'heptagon', 'octagon'];
	let nextName = $derived(shapeNames[nextSides - 3] || `${nextSides}-gon`);
	let progress = $derived(Math.min(100, (gameState.stats.totalEnergyEarned / threshold) * 100));

	let { onprestige = () => {} } = $props();

	function handlePrestige() {
		if (!ready) return;
		onprestige();
		resetForPrestige();
	}
</script>

{#if ready}
	<button class="prestige-btn game-panel" onclick={handlePrestige}>
		<span class="prestige-title">PRESTIGE</span>
		<span class="prestige-desc">
			Evolve to {nextName} ({nextSides} sides)
		</span>
		<span class="prestige-warning">
			Resets energy & shapes
		</span>
	</button>
{:else}
	<div class="prestige-locked game-panel">
		<span class="prestige-req">
			PRESTIGE at {formatNumber(threshold)} energy
		</span>
		<div class="prestige-bar-bg">
			<div class="prestige-bar-fill" style="width: {progress}%"></div>
		</div>
		<span class="prestige-pct">{progress.toFixed(1)}%</span>
	</div>
{/if}

<style>
	.prestige-btn {
		width: 100%;
		padding: 10px;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		gap: 4px;
		text-align: center;
		font-family: var(--font-pixel);
		border-color: var(--color-gold);
	}

	.prestige-btn:hover {
		background: var(--color-surface-hover);
	}

	.prestige-btn:active {
		transform: translate(1px, 1px);
	}

	.prestige-title {
		font-size: 8px;
		color: var(--color-gold);
		letter-spacing: 4px;
	}

	.prestige-desc {
		font-size: 7px;
		color: var(--color-text);
	}

	.prestige-warning {
		font-size: 6px;
		color: var(--color-red);
		opacity: 0.7;
	}

	.prestige-locked {
		width: 100%;
		padding: 8px 10px;
		display: flex;
		flex-direction: column;
		gap: 5px;
	}

	.prestige-req {
		font-size: 7px;
		color: var(--color-text-dim);
		text-align: center;
	}

	.prestige-bar-bg {
		width: 100%;
		height: 8px;
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: 2px;
		overflow: hidden;
	}

	.prestige-bar-fill {
		height: 100%;
		background: linear-gradient(90deg, var(--color-accent), var(--color-gold));
		border-radius: 1px;
		transition: width 0.3s;
	}

	.prestige-pct {
		font-size: 6px;
		color: var(--color-gold);
		text-align: center;
		opacity: 0.6;
	}
</style>
