<script>
	import { gameState, canAffordShape, getNextShapeCost, getPlacedCount, getProductionByResource, getUnlockedResources, getTierUpgradeCost, upgradeTier, getTierLevel, getTierInfo } from '$lib/game/state.svelte.js';
	import { getOpenSlots } from '$lib/game/shapes.js';
	import { SHAPE_DEFS } from '$lib/game/shapes.js';
	import { formatNumber } from '$lib/utils/format.js';

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
		const colors = ['#44aaff', '#44ff88', '#ffcc44', '#ff44aa', '#aa44ff', '#44ffff'];
		return colors[(depth - 1) % colors.length];
	}
</script>

<div class="shop-panel">
	<div class="panel-header">
		<span class="panel-title">SHOP</span>
		<span class="shape-count">{placed} shapes · {openSlotCount} open</span>
	</div>

	<div class="panel-content">
		<div class="production-summary">
			{#each unlockedResources as res}
				<div class="prod-row">
					<span class="prod-icon" style="color: {res.color};">{res.icon}</span>
					<span class="prod-value" style="color: {res.color};">
						{formatNumber(prodByResource[res.key])}/s
					</span>
				</div>
			{/each}
		</div>

		<div class="place-row">
			<div class="place-info">
				<span class="place-label">▲ PLACE</span>
				<span class="place-hint">click empty slot on map</span>
			</div>
			<span class="place-cost" class:affordable>
				{formatNumber(nextCost)}
			</span>
		</div>

		{#if tiers.length > 0}
			<div class="tier-section">
				<span class="section-label">TIER UPGRADES</span>
				{#each tiers as info}
					{@const tierLvl = getTierLevel(info.tier)}
					{@const cost = getTierUpgradeCost(info.tier)}
					{@const canUp = gameState.resources.energy >= cost}
					{@const color = getLayerColor(info.tier)}
					<button
						class="tier-row"
						onclick={() => upgradeTier(info.tier)}
						disabled={!canUp}
					>
						<div class="tier-left">
							<span class="tier-dot" style="background: {color};"></span>
							<div class="tier-meta">
								<span class="tier-name">Tier {info.tier}</span>
								<span class="tier-detail">{info.count} shapes · {formatNumber(info.totalProd)}/s</span>
							</div>
						</div>
						<div class="tier-right">
							<span class="tier-level">Lv.{tierLvl}</span>
							<span class="tier-cost" class:can-afford={canUp}>
								{formatNumber(cost)}
							</span>
						</div>
					</button>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.shop-panel {
		background: var(--color-bg);
		border: 2px solid var(--color-border);
		display: flex;
		flex-direction: column;
		overflow: hidden;
		box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.4);
	}

	.panel-header {
		padding: 0.5rem 0.7rem;
		border-bottom: 2px solid var(--color-border);
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: var(--color-surface);
	}

	.panel-title {
		font-size: 0.6rem;
		color: var(--color-accent);
		letter-spacing: 4px;
	}

	.shape-count {
		font-size: 0.5rem;
		color: var(--color-text-dim);
	}

	.panel-content {
		padding: 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		overflow-y: auto;
	}

	.production-summary {
		display: flex;
		gap: 0.6rem;
		padding: 0.35rem 0.4rem;
		background: var(--color-surface);
		border: 2px solid var(--color-border);
	}

	.prod-row {
		display: flex;
		align-items: center;
		gap: 0.2rem;
	}

	.prod-icon {
		font-size: 0.65rem;
	}

	.prod-value {
		font-size: 0.55rem;
	}

	.place-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.35rem 0.4rem;
		border: 2px solid var(--color-border);
		background: var(--color-surface);
	}

	.place-info {
		display: flex;
		flex-direction: column;
		gap: 0.05rem;
	}

	.place-label {
		font-size: 0.55rem;
		color: var(--color-text);
	}

	.place-hint {
		font-size: 0.45rem;
		color: var(--color-text-dim);
	}

	.place-cost {
		font-size: 0.55rem;
		color: var(--color-text-dim);
	}

	.place-cost.affordable {
		color: var(--color-gold);
	}

	.tier-section {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.section-label {
		font-size: 0.5rem;
		color: var(--color-text-dim);
		letter-spacing: 3px;
		padding: 0.15rem 0;
		border-bottom: 1px dashed var(--color-border);
	}

	.tier-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.35rem 0.4rem;
		background: var(--color-surface);
		border: 2px solid var(--color-border);
		cursor: pointer;
		font-family: var(--font-pixel);
		color: var(--color-text);
	}

	.tier-row:not(:disabled):hover {
		background: rgba(85, 187, 255, 0.08);
		border-color: var(--color-accent);
	}

	.tier-row:not(:disabled):active {
		transform: translate(1px, 1px);
	}

	.tier-row:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	.tier-left {
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}

	.tier-dot {
		width: 8px;
		height: 8px;
		flex-shrink: 0;
	}

	.tier-meta {
		display: flex;
		flex-direction: column;
		gap: 0.05rem;
	}

	.tier-name {
		font-size: 0.55rem;
		color: var(--color-text);
	}

	.tier-detail {
		font-size: 0.45rem;
		color: var(--color-text-dim);
	}

	.tier-right {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.05rem;
	}

	.tier-level {
		font-size: 0.5rem;
		color: var(--color-text);
	}

	.tier-cost {
		font-size: 0.5rem;
		color: var(--color-text-dim);
	}

	.tier-cost.can-afford {
		color: var(--color-gold);
	}
</style>
