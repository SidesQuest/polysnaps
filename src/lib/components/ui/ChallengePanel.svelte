<script>
	import { gameState, startChallenge, abandonChallenge } from '$lib/game/state.svelte.js';
	import { CHALLENGE_DEFS, getAvailableChallenges } from '$lib/game/challenges.js';
	import CyberPanel from './CyberPanel.svelte';
	import CyberButton from './CyberButton.svelte';

	let { open = $bindable(false) } = $props();

	let confirmAbandon = $state(false);
	let available = $derived(getAvailableChallenges(gameState.prestige.level, gameState.completedChallenges || []));
	let completed = $derived(gameState.completedChallenges || []);
	let active = $derived(gameState.activeChallenge);
	let activeDef = $derived(active ? CHALLENGE_DEFS.find(c => c.id === active) : null);

	function handleStart(id) {
		startChallenge(id);
	}

	function handleAbandon() {
		if (!confirmAbandon) {
			confirmAbandon = true;
			setTimeout(() => (confirmAbandon = false), 3000);
			return;
		}
		abandonChallenge();
		confirmAbandon = false;
	}
</script>

{#if open}
	<div class="ch-overlay" onclick={() => (open = false)} role="button" tabindex="-1" onkeydown={(e) => e.key === 'Escape' && (open = false)}>
		<div class="ch-container" onclick={(e) => e.stopPropagation()} role="dialog" tabindex="-1" onkeydown={(e) => e.key === 'Escape' && (open = false)}>
			<CyberPanel title="CHALLENGES" closable onclose={() => (open = false)} accent="red">
				<div class="ch-body">
					<div class="ch-header-row">
						<span class="ch-count">{completed.length}/{CHALLENGE_DEFS.length}</span>
						{#if gameState.prestige.level < 3}
							<span class="ch-locked">Unlocks at P3</span>
						{/if}
					</div>

					{#if activeDef}
						<div class="ch-active">
							<div class="ch-active-header">
								<span class="ch-active-label">ACTIVE</span>
								<span class="ch-active-name">{activeDef.name}</span>
							</div>
							<span class="ch-active-desc">{activeDef.desc}</span>
							<div class="ch-modifiers">
								{#if activeDef.modifier.allowedShapes}
									<span class="ch-mod">Shapes: {activeDef.modifier.allowedShapes.join(', ')}</span>
								{/if}
								{#if activeDef.modifier.timeLimit}
									<span class="ch-mod">Time: {activeDef.modifier.timeLimit}s</span>
								{/if}
								{#if activeDef.modifier.maxShapes}
									<span class="ch-mod">Max shapes: {activeDef.modifier.maxShapes}</span>
								{/if}
								{#if activeDef.modifier.skillsDisabled}
									<span class="ch-mod">Skills disabled</span>
								{/if}
							</div>
							<div class="ch-reward">
								<span class="ch-reward-label">Reward:</span>
								<span class="ch-reward-value">{activeDef.reward.label}</span>
							</div>
							<CyberButton small variant="red" onclick={handleAbandon}>
								{#snippet children()}{confirmAbandon ? '⚠ CONFIRM?' : 'ABANDON'}{/snippet}
							</CyberButton>
						</div>
					{/if}

					{#if !active && available.length > 0}
						<div class="ch-list">
							{#each available as ch}
								<div class="ch-item">
									<div class="ch-item-info">
										<span class="ch-item-name">{ch.name}</span>
										<span class="ch-item-desc">{ch.desc}</span>
										<span class="ch-item-reward">{ch.reward.label}</span>
									</div>
									<CyberButton small variant="purple" onclick={() => handleStart(ch.id)}>
										{#snippet children()}START{/snippet}
									</CyberButton>
								</div>
							{/each}
						</div>
					{:else if !active && available.length === 0 && gameState.prestige.level >= 3}
						<div class="ch-empty">All available challenges completed!</div>
					{/if}

					{#if completed.length > 0}
						<div class="ch-completed-header">COMPLETED</div>
						<div class="ch-list">
							{#each completed as id}
								{@const def = CHALLENGE_DEFS.find(c => c.id === id)}
								{#if def}
									<div class="ch-item done">
										<div class="ch-item-info">
											<span class="ch-item-name">✓ {def.name}</span>
											<span class="ch-item-reward">{def.reward.label}</span>
										</div>
									</div>
								{/if}
							{/each}
						</div>
					{/if}
				</div>
			</CyberPanel>
		</div>
	</div>
{/if}

<style>
	.ch-overlay {
		position: fixed;
		inset: 0;
		background: rgba(5, 5, 15, 0.85);
		z-index: 200;
		display: flex;
		align-items: center;
		justify-content: center;
		animation: ch-fade 0.15s ease-out;
		backdrop-filter: blur(4px);
	}

	.ch-container {
		width: 420px;
		max-width: 92vw;
		max-height: 80vh;
		animation: ch-slide 0.2s ease-out;
	}

	.ch-body {
		padding: 14px 16px;
		display: flex;
		flex-direction: column;
		gap: 12px;
		max-height: 65vh;
		overflow-y: auto;
	}

	.ch-header-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-bottom: 8px;
		border-bottom: 1px solid #2a2f55;
	}

	.ch-count {
		font-family: var(--font-pixel);
		font-size: 12px;
		color: #ff44aa;
		text-shadow: 0 0 8px rgba(255, 68, 170, 0.3);
	}

	.ch-locked {
		font-family: var(--font-pixel);
		font-size: 9px;
		color: var(--color-text-dim);
	}

	.ch-active {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 12px;
		background: rgba(255, 68, 170, 0.05);
		border: 1px solid #5a2a3a;
		border-radius: 4px;
	}

	.ch-active-header {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.ch-active-label {
		font-family: var(--font-pixel);
		font-size: 8px;
		color: #ff44aa;
		background: rgba(255, 68, 170, 0.15);
		padding: 3px 8px;
		border-radius: 3px;
	}

	.ch-active-name {
		font-family: var(--font-pixel);
		font-size: 11px;
		color: var(--color-text);
	}

	.ch-active-desc {
		font-family: var(--font-pixel);
		font-size: 9px;
		color: var(--color-text-dim);
		line-height: 1.4;
	}

	.ch-modifiers {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.ch-mod {
		font-family: var(--font-pixel);
		font-size: 8px;
		color: var(--color-red);
		background: rgba(255, 85, 119, 0.08);
		padding: 3px 8px;
		border-radius: 3px;
		border: 1px solid #4a2030;
	}

	.ch-reward {
		display: flex;
		gap: 8px;
		align-items: center;
	}

	.ch-reward-label {
		font-family: var(--font-pixel);
		font-size: 9px;
		color: var(--color-text-dim);
	}

	.ch-reward-value {
		font-family: var(--font-pixel);
		font-size: 9px;
		color: var(--color-green);
	}

	.ch-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.ch-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 10px 12px;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid #2a2f55;
		border-radius: 4px;
	}

	.ch-item.done {
		opacity: 0.5;
	}

	.ch-item-info {
		display: flex;
		flex-direction: column;
		gap: 4px;
		flex: 1;
	}

	.ch-item-name {
		font-family: var(--font-pixel);
		font-size: 10px;
		color: var(--color-text);
	}

	.ch-item-desc {
		font-family: var(--font-pixel);
		font-size: 8px;
		color: var(--color-text-dim);
		line-height: 1.3;
	}

	.ch-item-reward {
		font-family: var(--font-pixel);
		font-size: 8px;
		color: var(--color-green);
	}

	.ch-completed-header {
		font-family: var(--font-pixel);
		font-size: 9px;
		color: var(--color-text-dim);
		letter-spacing: 2px;
		margin-top: 6px;
	}

	.ch-empty {
		font-family: var(--font-pixel);
		font-size: 10px;
		color: var(--color-text-dim);
		text-align: center;
		padding: 16px;
	}

	@keyframes ch-fade {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	@keyframes ch-slide {
		from { opacity: 0; transform: translateY(-10px) scale(0.97); }
		to { opacity: 1; transform: translateY(0) scale(1); }
	}
</style>
