<script>
	import { gameState, resetForPrestige, canPrestige, getPrestigeThreshold, getPrestigeReward } from '$lib/game/state.svelte.js';
	import { formatNumber } from '$lib/utils/format.js';
	import CyberPanel from './CyberPanel.svelte';
	import CyberButton from './CyberButton.svelte';
	import CyberBar from './CyberBar.svelte';

	let threshold = $derived(getPrestigeThreshold());
	let ready = $derived(canPrestige());
	let reward = $derived(getPrestigeReward());
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
	<CyberButton variant="red" onclick={handlePrestige}>
		{#snippet children()}
			<div class="prestige-content">
				<span class="prestige-title">★ PRESTIGE</span>
				<span class="prestige-desc">Evolve to {nextName} ({nextSides} sides)</span>
				<span class="prestige-reward">+{reward} Cores</span>
				<span class="prestige-warn">resets energy & shapes</span>
			</div>
		{/snippet}
	</CyberButton>
{:else}
	<CyberPanel accent="gold">
		<div class="prestige-locked">
			<span class="prestige-req">PRESTIGE at {formatNumber(threshold)}</span>
			<CyberBar value={progress} max={100} color="gold" showPct />
		</div>
	</CyberPanel>
{/if}

<style>
	.prestige-content {
		display: flex;
		flex-direction: column;
		gap: 4px;
		text-align: center;
		width: 100%;
	}

	.prestige-title {
		font-size: 13px;
		color: var(--color-gold);
		letter-spacing: 3px;
		text-shadow: 0 0 12px rgba(255,221,85,0.5);
	}

	.prestige-desc {
		font-size: 9px;
		color: #fff;
		opacity: 0.85;
	}

	.prestige-reward {
		font-size: 10px;
		color: var(--color-gold);
		text-shadow: 0 0 8px rgba(255,221,85,0.4);
	}

	.prestige-warn {
		font-size: 8px;
		color: var(--color-red);
		opacity: 0.7;
	}

	.prestige-locked {
		padding: 12px 14px;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.prestige-req {
		font-family: var(--font-pixel);
		font-size: 10px;
		color: var(--color-text-dim);
		text-align: center;
	}
</style>
