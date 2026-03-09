<script>
	import { gameState, getCurrentCombos } from '$lib/game/state.svelte.js';
	import { getAllCombos, getComboMultiplier } from '$lib/game/combos.js';

	let activeCombos = $derived(getCurrentCombos());
	let allCombos = getAllCombos();
	let totalMultiplier = $derived(getComboMultiplier(gameState.nodes, gameState.coreShape.sides));
	let expanded = $state(false);
</script>

<div class="combo-panel">
	<button class="combo-header" onclick={() => (expanded = !expanded)}>
		<span class="combo-title">COMBOS</span>
		<span class="combo-count">{activeCombos.length}/{allCombos.length}</span>
		{#if totalMultiplier > 1}
			<span class="combo-mult">x{totalMultiplier.toFixed(2)}</span>
		{/if}
		<span class="combo-toggle">{expanded ? '▲' : '▼'}</span>
	</button>

	{#if expanded}
		<div class="combo-list">
			{#each allCombos as combo}
				{@const active = activeCombos.some((c) => c.id === combo.id)}
				<div class="combo-item" class:active>
					<span class="combo-icon">{combo.icon}</span>
					<div class="combo-info">
						<span class="combo-name">{combo.name}</span>
						<span class="combo-desc">{combo.description}</span>
					</div>
					<span class="combo-bonus">
						{active ? `x${combo.bonus.value}` : '???'}
					</span>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.combo-panel {
		background: var(--color-bg);
		border: 2px solid var(--color-border);
		overflow: hidden;
		box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.4);
	}

	.combo-header {
		width: 100%;
		padding: 0.5rem 0.7rem;
		display: flex;
		align-items: center;
		gap: 0.4rem;
		background: var(--color-surface);
		border: none;
		cursor: pointer;
		font-family: var(--font-pixel);
		color: var(--color-text);
	}

	.combo-header:hover {
		background: rgba(85, 187, 255, 0.06);
	}

	.combo-title {
		font-size: 0.6rem;
		color: var(--color-accent);
		letter-spacing: 3px;
	}

	.combo-count {
		font-size: 0.5rem;
		color: var(--color-text-dim);
		margin-left: auto;
	}

	.combo-mult {
		font-size: 0.55rem;
		color: var(--color-gold);
	}

	.combo-toggle {
		font-size: 0.5rem;
		color: var(--color-text-dim);
	}

	.combo-list {
		display: flex;
		flex-direction: column;
		border-top: 2px solid var(--color-border);
		max-height: 200px;
		overflow-y: auto;
	}

	.combo-item {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.4rem 0.6rem;
		border-bottom: 1px dashed var(--color-border);
		opacity: 0.3;
	}

	.combo-item.active {
		opacity: 1;
		background: var(--color-surface);
	}

	.combo-icon {
		font-size: 0.75rem;
		width: 1.4rem;
		text-align: center;
	}

	.combo-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.combo-name {
		font-size: 0.5rem;
		color: var(--color-text);
	}

	.combo-desc {
		font-size: 0.45rem;
		color: var(--color-text-dim);
	}

	.combo-bonus {
		font-size: 0.5rem;
		color: var(--color-gold);
	}

	.combo-item:not(.active) .combo-bonus {
		color: var(--color-text-dim);
	}
</style>
