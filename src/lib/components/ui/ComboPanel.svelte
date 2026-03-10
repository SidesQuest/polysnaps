<script>
	import { gameState, getCurrentCombos } from '$lib/game/state.svelte.js';
	import { getAllCombos, getComboMultiplier } from '$lib/game/combos.js';

	let activeCombos = $derived(getCurrentCombos());
	let allCombos = getAllCombos();
	let totalMultiplier = $derived(getComboMultiplier(gameState.nodes, gameState.coreShape.sides));
	let expanded = $state(false);
</script>

<div class="combo game-panel">
	<button class="header game-panel-header" onclick={() => (expanded = !expanded)}>
		<span class="title">COMBOS</span>
		<span class="count">{activeCombos.length}/{allCombos.length}</span>
		{#if totalMultiplier > 1}
			<span class="mult">x{totalMultiplier.toFixed(2)}</span>
		{/if}
		<span class="toggle">{expanded ? '▲' : '▼'}</span>
	</button>

	{#if expanded}
		<div class="list">
			{#each allCombos as combo}
				{@const active = activeCombos.some((c) => c.id === combo.id)}
				<div class="item" class:active>
					<span class="icon">{combo.icon}</span>
					<div class="info">
						<span class="name">{combo.name}</span>
						<span class="desc">{combo.description}</span>
					</div>
					<span class="bonus">
						{active ? `x${combo.bonus.value}` : '???'}
					</span>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.combo {
		display: flex;
		flex-direction: column;
	}

	.header {
		width: 100%;
		gap: 6px;
		border: none;
		cursor: pointer;
		font-family: var(--font-pixel);
		color: var(--color-text);
	}

	.header:hover {
		background: var(--color-surface-hover);
	}

	.title {
		font-size: 8px;
		color: var(--color-accent);
		letter-spacing: 3px;
	}

	.count {
		font-size: 7px;
		color: var(--color-text-dim);
		margin-left: auto;
	}

	.mult {
		font-size: 7px;
		color: var(--color-gold);
	}

	.toggle {
		font-size: 7px;
		color: var(--color-text-dim);
	}

	.list {
		display: flex;
		flex-direction: column;
		max-height: 200px;
		overflow-y: auto;
	}

	.item {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 8px;
		border-top: 1px solid var(--color-border);
		opacity: 0.3;
	}

	.item.active {
		opacity: 1;
		background: rgba(255, 255, 255, 0.02);
	}

	.icon {
		font-size: 10px;
		width: 18px;
		text-align: center;
	}

	.info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.name {
		font-size: 7px;
		color: var(--color-text);
	}

	.desc {
		font-size: 6px;
		color: var(--color-text-dim);
	}

	.bonus {
		font-size: 7px;
		color: var(--color-gold);
	}

	.item:not(.active) .bonus {
		color: var(--color-text-dim);
	}
</style>
