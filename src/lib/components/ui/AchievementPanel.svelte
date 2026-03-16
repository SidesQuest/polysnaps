<script>
	import { gameState } from '$lib/game/state.svelte.js';
	import { getAllAchievements, getAchievementMultiplier } from '$lib/game/achievements.js';
	import CyberPanel from './CyberPanel.svelte';

	let { open = $bindable(false) } = $props();

	let allAchievements = getAllAchievements();
	let unlocked = $derived(gameState.achievements || []);
	let mult = $derived(getAchievementMultiplier(unlocked));
</script>

{#if open}
	<div class="ach-overlay" onclick={() => (open = false)} role="button" tabindex="-1" onkeydown={(e) => e.key === 'Escape' && (open = false)}>
		<div class="ach-container" onclick={(e) => e.stopPropagation()} role="dialog" tabindex="-1" onkeydown={(e) => e.key === 'Escape' && (open = false)}>
			<CyberPanel title="ACHIEVEMENTS" closable onclose={() => (open = false)} accent="gold">
				<div class="ach-body">
					<div class="ach-header-row">
						<span class="ach-count">{unlocked.length}/{allAchievements.length}</span>
						<span class="ach-mult">+{((mult - 1) * 100).toFixed(0)}% prod</span>
					</div>

					<div class="ach-list">
						{#each allAchievements as ach}
							{@const isUnlocked = unlocked.includes(ach.id)}
							<div class="ach-item" class:locked={!isUnlocked}>
								<span class="ach-icon">{isUnlocked ? '🏆' : '🔒'}</span>
								<div class="ach-info">
									<span class="ach-name">{isUnlocked ? ach.name : '???'}</span>
									<span class="ach-desc">{isUnlocked ? ach.desc : 'Locked'}</span>
								</div>
								{#if isUnlocked}
									<span class="ach-bonus">+1%</span>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			</CyberPanel>
		</div>
	</div>
{/if}

<style>
	.ach-overlay {
		position: fixed;
		inset: 0;
		background: rgba(5, 5, 15, 0.88);
		z-index: 200;
		display: flex;
		align-items: center;
		justify-content: center;
		animation: ach-fade 0.15s ease-out;
		backdrop-filter: blur(6px);
	}

	.ach-container {
		width: 560px;
		max-width: 94vw;
		max-height: 85vh;
		animation: ach-slide 0.2s ease-out;
	}

	.ach-body {
		padding: 16px 18px;
		display: flex;
		flex-direction: column;
		gap: 14px;
		max-height: 70vh;
		overflow-y: auto;
	}

	.ach-header-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-bottom: 10px;
		border-bottom: 1px solid #2a3058;
	}

	.ach-count {
		font-family: var(--font-pixel);
		font-size: 14px;
		color: var(--color-gold);
		text-shadow: 0 0 10px rgba(255, 221, 85, 0.4);
	}

	.ach-mult {
		font-family: var(--font-pixel);
		font-size: 11px;
		color: var(--color-green);
	}

	.ach-list {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 10px;
	}

	.ach-item {
		display: flex;
		align-items: flex-start;
		gap: 10px;
		padding: 12px 14px;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid #2a3058;
		border-radius: 6px;
		transition: border-color 0.15s, background 0.15s;
	}

	.ach-item:not(.locked):hover {
		border-color: rgba(255, 221, 85, 0.3);
		background: rgba(255, 221, 85, 0.03);
	}

	.ach-item:not(.locked) {
		border-color: rgba(255, 221, 85, 0.2);
	}

	.ach-item.locked {
		opacity: 0.35;
	}

	.ach-icon {
		font-size: 20px;
		flex-shrink: 0;
		margin-top: 1px;
	}

	.ach-info {
		display: flex;
		flex-direction: column;
		gap: 4px;
		flex: 1;
		min-width: 0;
	}

	.ach-name {
		font-family: var(--font-pixel);
		font-size: 10px;
		color: var(--color-text);
	}

	.ach-desc {
		font-family: var(--font-pixel);
		font-size: 9px;
		color: var(--color-text-dim);
		line-height: 1.5;
	}

	.ach-bonus {
		font-family: var(--font-pixel);
		font-size: 10px;
		color: var(--color-green);
		flex-shrink: 0;
		margin-top: 2px;
	}

	@keyframes ach-fade {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	@keyframes ach-slide {
		from { opacity: 0; transform: translateY(-10px) scale(0.97); }
		to { opacity: 1; transform: translateY(0) scale(1); }
	}

	@media (max-width: 768px) {
		.ach-list {
			grid-template-columns: 1fr;
		}
	}
</style>
