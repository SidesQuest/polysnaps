<script>
	import { gameState, canAffordShape, getNextShapeCost, getPlacedCount, getTierUpgradeCost, upgradeTier, getTierLevel, getTierInfo } from '$lib/game/state.svelte.js';
	import { getOpenSlots } from '$lib/game/shapes.js';
	import { formatNumber } from '$lib/utils/format.js';

	const TIER_COLORS = ['#44aaff', '#44ff88', '#ffcc44', '#ff44aa', '#aa44ff', '#44ffff'];

	let nextCost = $derived(getNextShapeCost());
	let affordable = $derived(canAffordShape());
	let placed = $derived(getPlacedCount());
	let openSlotCount = $derived(
		getOpenSlots(gameState.nodes, gameState.coreShape.sides, 50).length
	);
	let tiers = $derived(getTierInfo());
	let tiersExpanded = $state(false);

	const MAX_COLLAPSED_TIERS = 4;
	let visibleTiers = $derived(tiersExpanded ? tiers : tiers.slice(0, MAX_COLLAPSED_TIERS));

	function getLayerColor(depth) {
		return TIER_COLORS[(depth - 1) % TIER_COLORS.length];
	}
</script>

<div class="shop game-panel">
	<div class="header game-panel-header">
		<span class="title">SHOP</span>
		<span class="placed-count">{placed} placed · {openSlotCount} open</span>
	</div>

	<div class="body">
		<button class="place-btn" class:affordable disabled={!affordable && openSlotCount === 0}>
			<span class="place-icon">▲</span>
			<div class="place-text">
				<span class="place-label">PLACE SHAPE</span>
				<span class="place-cost">{formatNumber(nextCost)} energy</span>
			</div>
		</button>

		{#if tiers.length > 0}
			<div class="tier-section">
				<span class="section-label">UPGRADES</span>
				{#each visibleTiers as info}
					{@const tierLvl = getTierLevel(info.tier)}
					{@const cost = getTierUpgradeCost(info.tier)}
					{@const canUp = gameState.resources.energy >= cost}
					{@const color = getLayerColor(info.tier)}
					<button
						class="tier-row"
						onclick={() => upgradeTier(info.tier)}
						disabled={!canUp}
					>
						<span class="tier-dot" style="background: {color};"></span>
						<span class="tier-name">Tier {info.tier}</span>
						<span class="tier-lv">Lv {tierLvl}</span>
						<span class="tier-cost" class:can-afford={canUp}>{formatNumber(cost)}</span>
					</button>
				{/each}
				{#if tiers.length > MAX_COLLAPSED_TIERS}
					<button class="expand-btn" onclick={() => (tiersExpanded = !tiersExpanded)}>
						{tiersExpanded ? '▲ collapse' : `▼ ${tiers.length - MAX_COLLAPSED_TIERS} more...`}
					</button>
				{/if}
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
		gap: 8px;
		justify-content: space-between;
	}

	.title {
		font-size: 10px;
		color: var(--color-accent);
		letter-spacing: 3px;
	}

	.placed-count {
		font-size: 9px;
		color: var(--color-text-dim);
	}

	.body {
		padding: 8px;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.place-btn {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 12px;
		font-family: var(--font-pixel);
		color: var(--color-text-dim);
		background: rgba(255, 255, 255, 0.02);
		border: 1px dashed var(--color-border);
		border-radius: 4px;
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

	.place-icon {
		font-size: 16px;
	}

	.place-text {
		display: flex;
		flex-direction: column;
		gap: 3px;
		text-align: left;
	}

	.place-label {
		font-size: 10px;
	}

	.place-cost {
		font-size: 8px;
		opacity: 0.6;
	}

	.tier-section {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.section-label {
		font-size: 8px;
		color: var(--color-text-dim);
		letter-spacing: 2px;
		margin-bottom: 2px;
	}

	.tier-row {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 7px 8px;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid var(--color-border);
		border-radius: 3px;
		font-family: var(--font-pixel);
		color: var(--color-text);
		cursor: pointer;
	}

	.tier-row:not(:disabled):hover {
		background: var(--color-surface-hover);
		border-color: var(--color-border-light);
	}

	.tier-row:not(:disabled):active {
		transform: translate(1px, 1px);
	}

	.tier-row:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	.tier-dot {
		width: 8px;
		height: 8px;
		border-radius: 2px;
		flex-shrink: 0;
	}

	.tier-name {
		font-size: 9px;
	}

	.tier-lv {
		font-size: 8px;
		color: var(--color-text-dim);
	}

	.tier-cost {
		font-size: 8px;
		color: var(--color-text-dim);
		margin-left: auto;
	}

	.tier-cost.can-afford {
		color: var(--color-gold);
	}

	.expand-btn {
		padding: 4px;
		background: transparent;
		border: none;
		font-family: var(--font-pixel);
		font-size: 8px;
		color: var(--color-text-dim);
		cursor: pointer;
		text-align: center;
		opacity: 0.6;
	}

	.expand-btn:hover {
		opacity: 1;
		color: var(--color-accent);
	}
</style>
