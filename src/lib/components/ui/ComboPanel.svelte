<script>
	import { gameState, getCurrentCombos } from '$lib/game/state.svelte.js';
	import { getDiscoveredCombos, getTotalComboCount, getComboMultiplier } from '$lib/game/combos.js';
	import CyberPanel from './CyberPanel.svelte';

	let activeCombos = $derived(getCurrentCombos());
	let discovered = $derived(getDiscoveredCombos(gameState.discoveredCombos || []));
	let totalCount = getTotalComboCount();
	let totalMultiplier = $derived(getComboMultiplier(gameState.nodes, gameState.coreShape.sides));
	let expanded = $state(false);
</script>

<div class="combo-wrap">
	<button class="combo-header" onclick={() => (expanded = !expanded)}>
		<span class="combo-title">COMBOS</span>
		<span class="combo-count">{(gameState.discoveredCombos || []).length}/? discovered</span>
		{#if totalMultiplier > 1}
			<span class="combo-mult">×{totalMultiplier.toFixed(2)}</span>
		{/if}
		<span class="combo-toggle">{expanded ? '▲' : '▼'}</span>
	</button>

	{#if expanded}
		<CyberPanel>
			<div class="combo-list">
				{#if discovered.length === 0}
					<div class="combo-empty">
						<span class="combo-empty-text">No combos discovered yet...</span>
						<span class="combo-hint">Place shapes to discover combos!</span>
					</div>
				{:else}
					{#each discovered as combo}
						{@const active = activeCombos.some((c) => c.id === combo.id)}
						<div class="combo-item" class:active>
							<span class="combo-icon">{combo.icon}</span>
							<div class="combo-info">
								<span class="combo-name">{combo.name}</span>
								<span class="combo-desc">{combo.description}</span>
							</div>
							<span class="combo-bonus">
								{active ? `×${combo.bonus.value}` : 'inactive'}
							</span>
						</div>
					{/each}
				{/if}
			</div>
		</CyberPanel>
	{/if}
</div>

<style>
	.combo-wrap {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.combo-header {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 14px;
		background: var(--color-surface);
		border: 2px solid var(--color-border);
		border-radius: var(--panel-radius);
		cursor: pointer;
		font-family: var(--font-pixel);
		color: var(--color-text);
		box-shadow:
			inset 1px 1px 0 #2a2f55,
			inset -1px -1px 0 #12163a,
			0 4px 16px rgba(0,0,0,0.5);
		transition: background 0.15s, border-color 0.15s;
		min-height: 44px;
	}

	.combo-header:hover {
		background: var(--color-surface-hover);
		border-color: var(--color-border-light);
	}

	.combo-title {
		font-size: 11px;
		color: var(--color-accent);
		letter-spacing: 2px;
		text-shadow: 0 0 10px rgba(136,170,255,0.4);
	}

	.combo-count {
		font-size: 9px;
		color: var(--color-text-dim);
		margin-left: auto;
	}

	.combo-mult {
		font-size: 10px;
		color: var(--color-gold);
		text-shadow: 0 0 6px rgba(255,221,85,0.4);
	}

	.combo-toggle {
		font-size: 10px;
		color: var(--color-text-dim);
	}

	.combo-list {
		display: flex;
		flex-direction: column;
		max-height: 260px;
		overflow-y: auto;
	}

	.combo-empty {
		padding: 20px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
	}

	.combo-empty-text {
		font-family: var(--font-pixel);
		font-size: 10px;
		color: var(--color-text-dim);
	}

	.combo-hint {
		font-family: var(--font-pixel);
		font-size: 9px;
		color: var(--color-text-dim);
		opacity: 0.6;
	}

	.combo-item {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 12px;
		border-bottom: 1px solid #1c2248;
		opacity: 0.45;
		transition: opacity 0.2s, background 0.15s;
	}

	.combo-item:last-child { border-bottom: none; }

	.combo-item.active {
		opacity: 1;
		background: rgba(136,170,255,0.04);
	}

	.combo-icon {
		font-size: 16px;
		width: 24px;
		text-align: center;
	}

	.combo-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 3px;
		min-width: 0;
	}

	.combo-name {
		font-size: 10px;
		color: var(--color-text);
	}

	.combo-desc {
		font-size: 9px;
		color: var(--color-text-dim);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.combo-bonus {
		font-size: 10px;
		color: var(--color-gold);
		flex-shrink: 0;
	}

	.combo-item:not(.active) .combo-bonus {
		color: var(--color-text-dim);
		font-size: 9px;
	}
</style>
