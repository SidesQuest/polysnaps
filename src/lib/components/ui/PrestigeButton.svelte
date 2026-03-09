<script>
	import { gameState, resetForPrestige, canPrestige, getPrestigeThreshold } from '$lib/game/state.svelte.js';
	import { formatNumber } from '$lib/utils/format.js';

	let threshold = $derived(getPrestigeThreshold());
	let ready = $derived(canPrestige());
	let nextSides = $derived(gameState.coreShape.sides + 1);
	let shapeNames = ['triangle', 'square', 'pentagon', 'hexagon', 'heptagon', 'octagon'];
	let nextName = $derived(shapeNames[nextSides - 3] || `${nextSides}-gon`);
	let progress = $derived(Math.min(100, (gameState.stats.totalEnergyEarned / threshold) * 100));

	function handlePrestige() {
		if (!ready) return;
		resetForPrestige();
	}
</script>

{#if ready}
	<button class="prestige-button" onclick={handlePrestige}>
		<span class="prestige-title">PRESTIGE</span>
		<span class="prestige-desc">
			Evolve to {nextName} ({nextSides} sides)
		</span>
		<span class="prestige-warning">
			Resets energy & shapes
		</span>
	</button>
{:else}
	<div class="prestige-locked">
		<span class="prestige-req">
			PRESTIGE at {formatNumber(threshold)} energy
		</span>
		<div class="prestige-bar-bg">
			<div
				class="prestige-bar-fill"
				style="width: {progress}%"
			></div>
		</div>
		<span class="prestige-percent">{progress.toFixed(1)}%</span>
	</div>
{/if}

<style>
	.prestige-button {
		width: 100%;
		background: var(--color-bg);
		border: 2px solid var(--color-gold);
		padding: 0.6rem;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		text-align: center;
		font-family: var(--font-pixel);
		box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.4);
		animation: prestige-blink 1.8s steps(2) infinite;
	}

	.prestige-button:hover {
		background: rgba(255, 221, 85, 0.08);
	}

	.prestige-button:active {
		transform: translate(2px, 2px);
		box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.4);
	}

	.prestige-title {
		font-size: 0.65rem;
		color: var(--color-gold);
		letter-spacing: 4px;
	}

	.prestige-desc {
		font-size: 0.5rem;
		color: var(--color-text);
	}

	.prestige-warning {
		font-size: 0.45rem;
		color: var(--color-red);
		opacity: 0.7;
	}

	.prestige-locked {
		width: 100%;
		padding: 0.4rem 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.prestige-req {
		font-size: 0.5rem;
		color: var(--color-text-dim);
		text-align: center;
	}

	.prestige-bar-bg {
		width: 100%;
		height: 6px;
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		overflow: hidden;
	}

	.prestige-bar-fill {
		height: 100%;
		background: var(--color-gold);
	}

	.prestige-percent {
		font-size: 0.45rem;
		color: var(--color-gold);
		text-align: center;
		opacity: 0.6;
	}

	@keyframes prestige-blink {
		0%, 100% { border-color: var(--color-gold); }
		50% { border-color: rgba(255, 221, 85, 0.4); }
	}
</style>
