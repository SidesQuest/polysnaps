<script>
	import { gameState, canAffordShape, getShapeResourceCosts, getPlacedCount, getTierUpgradeCost, upgradeTier, getTierLevel, getTierInfo, getAvailableShapes } from '$lib/game/state.svelte.js';
	import { RESOURCE_DEFS } from '$lib/game/state.svelte.js';
	import { getOpenSlots } from '$lib/game/shapes.js';
	import { formatNumber } from '$lib/utils/format.js';
	import CyberPanel from './CyberPanel.svelte';
	import CyberButton from './CyberButton.svelte';
	import CyberBar from './CyberBar.svelte';

	const TIER_COLORS = ['#44aaff', '#44ff88', '#ffcc44', '#ff44aa', '#aa44ff', '#44ffff'];
	const BAR_COLORS = ['cyan', 'green', 'gold', 'red', 'purple', 'cyan'];
	const SHAPE_ICONS = { triangle: '△', square: '□', pentagon: '⬠', hexagon: '⬡' };

	let placed = $derived(getPlacedCount());
	let openSlotCount = $derived(
		getOpenSlots(gameState.nodes, gameState.coreShape.sides, 50).length
	);
	let tiers = $derived(getTierInfo());
	let tiersExpanded = $state(false);
	let availableShapes = $derived(getAvailableShapes());

	const MAX_COLLAPSED = 4;
	let visibleTiers = $derived(tiersExpanded ? tiers : tiers.slice(0, MAX_COLLAPSED));

	function getLayerColor(depth) {
		return TIER_COLORS[(depth - 1) % TIER_COLORS.length];
	}
	function getBarColor(depth) {
		return BAR_COLORS[(depth - 1) % BAR_COLORS.length];
	}

	function formatMultiCost(costs) {
		return Object.entries(costs)
			.filter(([, v]) => v > 0)
			.map(([res, v]) => {
				const def = RESOURCE_DEFS[res];
				return { icon: def?.icon || '?', color: def?.color || '#888', amount: v, key: res };
			});
	}
</script>

<CyberPanel title="UPGRADES">
	<div class="shop-body">
		<div class="place-section">
			{#each availableShapes as shape}
				{@const costs = getShapeResourceCosts(shape.key)}
				{@const affordable = canAffordShape(shape.key)}
				{@const costItems = formatMultiCost(costs)}
				<div class="shape-row" class:affordable>
					<span class="shape-icon">{SHAPE_ICONS[shape.key] || '?'}</span>
					<div class="shape-info">
						<span class="shape-name">{shape.name}</span>
						<div class="shape-costs">
							{#each costItems as ci}
								<span class="cost-item" style="color: {ci.color};">{ci.icon}{formatNumber(ci.amount)}</span>
							{/each}
						</div>
					</div>
					<span class="shape-role">{shape.role}</span>
				</div>
			{/each}
			<div class="place-stats">
				<span>{placed} placed</span>
				<span class="sep">·</span>
				<span>{openSlotCount} open</span>
			</div>
		</div>

		{#if tiers.length > 0}
			<div class="tier-section">
				<div class="section-divider">
					<span class="divider-line"></span>
					<span class="divider-text">TIERS</span>
					<span class="divider-line"></span>
				</div>

				{#each visibleTiers as info}
					{@const tierLvl = getTierLevel(info.tier)}
					{@const cost = getTierUpgradeCost(info.tier)}
					{@const canUp = gameState.resources.energy >= cost}
					{@const color = getLayerColor(info.tier)}
					{@const barColor = getBarColor(info.tier)}
					<button
						class="tier-row"
						onclick={() => upgradeTier(info.tier)}
						disabled={!canUp}
					>
						<span class="tier-dot" style="background: {color}; box-shadow: 0 0 6px {color}44;"></span>
						<span class="tier-name">T{info.tier}</span>
						<CyberBar value={tierLvl} max={tierLvl + 1} color={barColor} />
						<span class="tier-lv">Lv{tierLvl}</span>
						<span class="tier-cost" class:can-afford={canUp}>{formatNumber(cost)}</span>
					</button>
				{/each}

				{#if tiers.length > MAX_COLLAPSED}
					<button class="expand-toggle" onclick={() => (tiersExpanded = !tiersExpanded)}>
						{tiersExpanded ? '▲ collapse' : `▼ ${tiers.length - MAX_COLLAPSED} more`}
					</button>
				{/if}
			</div>
		{/if}
	</div>
</CyberPanel>

<style>
	.shop-body {
		padding: 12px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.place-section {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.shape-row {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 10px;
		background: rgba(255, 255, 255, 0.02);
		border: 2px solid #2a2f55;
		border-radius: 3px;
		font-family: var(--font-pixel);
		color: var(--color-text-dim);
		opacity: 0.5;
		transition: opacity 0.15s, border-color 0.15s;
	}

	.shape-row.affordable {
		opacity: 1;
		border-color: var(--color-border-light);
	}

	.shape-icon {
		font-size: 18px;
		width: 24px;
		text-align: center;
	}

	.shape-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 3px;
		min-width: 0;
	}

	.shape-name {
		font-size: 10px;
		color: var(--color-text);
	}

	.shape-costs {
		display: flex;
		gap: 8px;
	}

	.cost-item {
		font-size: 9px;
	}

	.shape-role {
		font-size: 8px;
		color: var(--color-text-dim);
		opacity: 0.6;
		text-transform: uppercase;
		letter-spacing: 1px;
	}

	.place-stats {
		display: flex;
		justify-content: center;
		gap: 8px;
		font-family: var(--font-pixel);
		font-size: 9px;
		color: var(--color-text-dim);
		padding-top: 4px;
	}

	.sep { opacity: 0.3; }

	.tier-section {
		display: flex;
		flex-direction: column;
		gap: 5px;
	}

	.section-divider {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 4px;
	}

	.divider-line {
		flex: 1;
		height: 1px;
		background: var(--color-border);
	}

	.divider-text {
		font-family: var(--font-pixel);
		font-size: 9px;
		color: var(--color-text-dim);
		letter-spacing: 2px;
	}

	.tier-row {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 10px;
		background: rgba(255, 255, 255, 0.02);
		border: 2px solid #2a2f55;
		border-radius: 3px;
		font-family: var(--font-pixel);
		color: var(--color-text);
		cursor: pointer;
		transition: border-color 0.15s;
	}

	.tier-row:not(:disabled):hover {
		background: rgba(136, 170, 255, 0.05);
		border-color: var(--color-border-light);
	}

	.tier-row:not(:disabled):active {
		transform: translateY(1px);
	}

	.tier-row:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.tier-dot {
		width: 10px;
		height: 10px;
		border-radius: 2px;
		flex-shrink: 0;
	}

	.tier-name {
		font-size: 10px;
		min-width: 24px;
	}

	.tier-lv {
		font-size: 9px;
		color: var(--color-text-dim);
		min-width: 28px;
		text-align: right;
	}

	.tier-cost {
		font-size: 9px;
		color: var(--color-text-dim);
		min-width: 40px;
		text-align: right;
	}

	.tier-cost.can-afford {
		color: var(--color-gold);
	}

	.expand-toggle {
		padding: 6px;
		background: transparent;
		border: none;
		font-family: var(--font-pixel);
		font-size: 9px;
		color: var(--color-text-dim);
		cursor: pointer;
		text-align: center;
		opacity: 0.6;
	}

	.expand-toggle:hover {
		opacity: 1;
		color: var(--color-accent);
	}
</style>
