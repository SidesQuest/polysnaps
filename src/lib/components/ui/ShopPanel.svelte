<script>
	import { gameState, canAffordShape, getNextShapeCost, getPlacedCount, getProductionByResource, getUnlockedResources, getTierUpgradeCost, upgradeTier, getTierLevel, getTierInfo } from '$lib/game/state.svelte.js';
	import { getOpenSlots } from '$lib/game/shapes.js';
	import { formatNumber } from '$lib/utils/format.js';

	const TIER_COLORS = ['#44aaff', '#44ff88', '#ffcc44', '#ff44aa', '#aa44ff', '#44ffff'];

	let nextCost = $derived(getNextShapeCost());
	let affordable = $derived(canAffordShape());
	let prodByResource = $derived(getProductionByResource());
	let unlockedResources = $derived(getUnlockedResources());
	let placed = $derived(getPlacedCount());
	let openSlotCount = $derived(
		getOpenSlots(gameState.nodes, gameState.coreShape.sides, 50).length
	);
	let tiers = $derived(getTierInfo());

	function getLayerColor(depth) {
		return TIER_COLORS[(depth - 1) % TIER_COLORS.length];
	}
</script>

<div class="shop game-panel">
	<div class="header game-panel-header">
		<span class="title">SHOP</span>
		<div class="rates">
			{#each unlockedResources as res}
				<span class="rate" style="color: {res.color};">{res.icon} {formatNumber(prodByResource[res.key])}/s</span>
			{/each}
		</div>
	</div>

	<div class="body">
		<button class="place-btn" class:affordable disabled={!affordable && openSlotCount === 0}>
			<span class="place-top">▲ PLACE SHAPE</span>
			<span class="place-info">Cost: {formatNumber(nextCost)} · {placed} placed · {openSlotCount} slots</span>
		</button>

		{#if tiers.length > 0}
			<div class="tier-header">
				<span class="tier-title">TIER UPGRADES</span>
			</div>
			<div class="tier-grid">
				{#each tiers as info}
					{@const tierLvl = getTierLevel(info.tier)}
					{@const cost = getTierUpgradeCost(info.tier)}
					{@const canUp = gameState.resources.energy >= cost}
					{@const color = getLayerColor(info.tier)}
					<button
						class="tier-cell"
						onclick={() => upgradeTier(info.tier)}
						disabled={!canUp}
					>
						<span class="tier-dot" style="background: {color};"></span>
						<span class="tier-label">T{info.tier}</span>
						<span class="tier-lv">Lv{tierLvl}</span>
						<span class="tier-cost" class:can-afford={canUp}>{formatNumber(cost)}</span>
					</button>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.shop {
		display: flex;
		flex-direction: column;
	}

	.header {
		gap: 6px;
		justify-content: space-between;
	}

	.title {
		font-size: 8px;
		color: var(--color-accent);
		letter-spacing: 3px;
		flex-shrink: 0;
	}

	.rates {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
		justify-content: flex-end;
	}

	.rate {
		font-size: 7px;
		white-space: nowrap;
	}

	.body {
		padding: 6px;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.place-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		padding: 8px;
		font-family: var(--font-pixel);
		color: var(--color-text-dim);
		background: rgba(255, 255, 255, 0.02);
		border: 1px dashed var(--color-border);
		border-radius: 3px;
		cursor: not-allowed;
	}

	.place-btn.affordable {
		border: 1px solid var(--color-gold);
		color: var(--color-gold);
		cursor: pointer;
		background: rgba(255, 221, 85, 0.04);
	}

	.place-btn.affordable:hover {
		background: rgba(255, 221, 85, 0.1);
	}

	.place-top {
		font-size: 8px;
	}

	.place-info {
		font-size: 6px;
		opacity: 0.6;
	}

	.tier-header {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.tier-title {
		font-size: 7px;
		color: var(--color-text-dim);
		letter-spacing: 2px;
	}

	.tier-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 3px;
		max-height: 180px;
		overflow-y: auto;
	}

	.tier-cell {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 5px 6px;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid var(--color-border);
		border-radius: 2px;
		font-family: var(--font-pixel);
		color: var(--color-text);
		cursor: pointer;
	}

	.tier-cell:not(:disabled):hover {
		background: var(--color-surface-hover);
		border-color: var(--color-border-light);
	}

	.tier-cell:not(:disabled):active {
		transform: translate(1px, 1px);
	}

	.tier-cell:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.tier-dot {
		width: 6px;
		height: 6px;
		border-radius: 1px;
		flex-shrink: 0;
	}

	.tier-label {
		font-size: 7px;
	}

	.tier-lv {
		font-size: 6px;
		color: var(--color-text-dim);
	}

	.tier-cost {
		font-size: 6px;
		color: var(--color-text-dim);
		margin-left: auto;
	}

	.tier-cost.can-afford {
		color: var(--color-gold);
	}
</style>
