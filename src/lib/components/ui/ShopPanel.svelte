<script>
	import { gameState, canAffordShape, getNextShapeCost, getPlacedCount, getTotalProduction, upgradeNode, getUpgradeCost, getNodeProduction, getNodeDepth } from '$lib/game/state.svelte.js';
	import { getOpenSlots } from '$lib/game/shapes.js';
	import { SHAPE_DEFS } from '$lib/game/shapes.js';
	import { formatNumber } from '$lib/utils/format.js';

	let nextCost = $derived(getNextShapeCost());
	let affordable = $derived(canAffordShape());
	let totalProd = $derived(getTotalProduction());
	let placed = $derived(getPlacedCount());
	let openSlotCount = $derived(
		getOpenSlots(gameState.nodes, gameState.coreShape.sides, 50).length
	);

	let upgradableNodes = $derived(
		gameState.nodes.filter((n) => n.id !== 'core').slice().reverse()
	);

	function getLayerColor(depth) {
		const colors = ['#44aaff', '#44ff88', '#ffcc44', '#ff44aa', '#aa44ff', '#44ffff'];
		return colors[(depth - 1) % colors.length];
	}
</script>

<div class="shop-panel">
	<div class="panel-header">
		<span class="panel-title">SHOP</span>
	</div>

	<div class="panel-content">
		<div class="production-summary">
			<span class="prod-label">PRODUCTION</span>
			<span class="prod-value">{formatNumber(totalProd)}/s</span>
		</div>

		<div class="stat-row">
			<span>Shapes placed</span>
			<span>{placed}</span>
		</div>
		<div class="stat-row">
			<span>Open slots</span>
			<span>{openSlotCount}</span>
		</div>

		<div class="buy-section">
			<span class="section-title">PLACE</span>
			<button
				class="buy-button"
				disabled={!affordable || openSlotCount === 0}
				onclick={() => {}}
			>
				<span class="buy-shape-name">
					{SHAPE_DEFS.triangle.name}
				</span>
				<span class="buy-cost" class:can-afford={affordable}>
					{formatNumber(nextCost)} energy
				</span>
				<span class="buy-info">
					Click an empty slot on the map to place
				</span>
			</button>
		</div>

		{#if upgradableNodes.length > 0}
			<div class="upgrade-section">
				<span class="section-title">UPGRADES</span>
				<div class="upgrade-list">
					{#each upgradableNodes as node}
						{@const cost = getUpgradeCost(node)}
						{@const canUpgrade = gameState.resources.energy >= cost}
						{@const depth = getNodeDepth(node.id)}
						{@const prod = getNodeProduction(node.id)}
						{@const color = getLayerColor(depth)}
						<button
							class="upgrade-button"
							onclick={() => upgradeNode(node.id)}
							disabled={!canUpgrade}
						>
							<div class="upgrade-header">
								<span class="upgrade-name" style="color: {color};">
									L{depth} #{node.id.split('-')[1]} — Lv.{node.level}
								</span>
								<span class="upgrade-prod">{formatNumber(prod)}/s</span>
							</div>
							<span class="upgrade-cost" class:can-afford={canUpgrade}>
								{formatNumber(cost)} energy → Lv.{node.level + 1}
							</span>
						</button>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.shop-panel {
		width: 260px;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 4px;
		display: flex;
		flex-direction: column;
		max-height: 100%;
		overflow: hidden;
	}

	.panel-header {
		padding: 0.6rem 0.8rem;
		border-bottom: 1px solid var(--color-border);
	}

	.panel-title {
		font-size: 0.55rem;
		color: var(--color-accent);
		letter-spacing: 3px;
	}

	.panel-content {
		padding: 0.6rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		overflow-y: auto;
	}

	.production-summary {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.4rem 0.5rem;
		background: rgba(68, 170, 255, 0.05);
		border: 1px solid var(--color-border);
		border-radius: 3px;
	}

	.prod-label {
		font-size: 0.35rem;
		color: var(--color-text-dim);
		letter-spacing: 2px;
	}

	.prod-value {
		font-size: 0.55rem;
		color: var(--color-green);
	}

	.stat-row {
		display: flex;
		justify-content: space-between;
		font-size: 0.35rem;
		color: var(--color-text-dim);
		padding: 0 0.2rem;
	}

	.buy-section, .upgrade-section {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.section-title {
		font-size: 0.35rem;
		color: var(--color-text-dim);
		letter-spacing: 2px;
		padding-top: 0.2rem;
	}

	.buy-button, .upgrade-button {
		background: rgba(68, 170, 255, 0.06);
		border: 1px solid var(--color-border);
		border-radius: 3px;
		padding: 0.5rem;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		text-align: left;
		transition: all 0.15s;
		font-family: var(--font-pixel);
	}

	.buy-button:not(:disabled):hover,
	.upgrade-button:not(:disabled):hover {
		background: rgba(68, 170, 255, 0.12);
		border-color: var(--color-accent);
	}

	.buy-button:disabled,
	.upgrade-button:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	.buy-shape-name {
		font-size: 0.45rem;
		color: var(--color-text);
	}

	.buy-cost {
		font-size: 0.38rem;
		color: var(--color-red);
	}

	.buy-cost.can-afford {
		color: var(--color-gold);
	}

	.buy-info {
		font-size: 0.3rem;
		color: var(--color-text-dim);
	}

	.upgrade-list {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		max-height: 300px;
		overflow-y: auto;
	}

	.upgrade-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.upgrade-name {
		font-size: 0.38rem;
	}

	.upgrade-prod {
		font-size: 0.32rem;
		color: var(--color-green);
	}

	.upgrade-cost {
		font-size: 0.32rem;
		color: var(--color-red);
	}

	.upgrade-cost.can-afford {
		color: var(--color-gold);
	}
</style>
