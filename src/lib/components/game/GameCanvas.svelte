<script>
	import { onMount } from 'svelte';
	import { gameState, addResource, getTotalProduction, loadStateFrom, getPlacedCount } from '$lib/game/state.svelte.js';
	import { startEngine, stopEngine, onTick } from '$lib/game/engine.js';
	import { saveGame, loadGame, hasSave } from '$lib/game/save.js';
	import { getOfflineSeconds, calculateOfflineEarnings, recordOnlineTime } from '$lib/game/offline.js';
	import { formatNumber, formatTime } from '$lib/utils/format.js';
	import ShapeNetwork from './ShapeNetwork.svelte';
	import ShopPanel from '$lib/components/ui/ShopPanel.svelte';
	import PrestigeButton from '$lib/components/ui/PrestigeButton.svelte';

	let production = $derived(getTotalProduction());
	let placed = $derived(getPlacedCount());
	let offlinePopup = $state(null);

	onMount(() => {
		if (hasSave()) {
			const saved = loadGame();
			loadStateFrom(saved);

			const offlineSecs = getOfflineSeconds();
			if (offlineSecs > 10 && placed > 0) {
				const earnings = calculateOfflineEarnings(gameState, offlineSecs);
				if (earnings.energy > 0) {
					addResource('energy', earnings.energy);
					offlinePopup = { seconds: offlineSecs, energy: earnings.energy };
					setTimeout(() => (offlinePopup = null), 5000);
				}
			}
		}

		const unsubscribe = onTick((delta) => {
			addResource('energy', production * delta);
			gameState.stats.timePlayed += delta;
		});

		startEngine();
		recordOnlineTime();

		const saveInterval = setInterval(() => {
			saveGame(gameState);
			recordOnlineTime();
		}, 30000);

		return () => {
			unsubscribe();
			stopEngine();
			clearInterval(saveInterval);
			saveGame(gameState);
			recordOnlineTime();
		};
	});
</script>

<div class="game-canvas">
	{#if offlinePopup}
		<div class="offline-popup" onclick={() => (offlinePopup = null)} role="button" tabindex="0" onkeydown={(e) => e.key === 'Enter' && (offlinePopup = null)}>
			<span class="offline-title">WELCOME BACK</span>
			<span class="offline-time">Away for {formatTime(offlinePopup.seconds)}</span>
			<span class="offline-earned">+{formatNumber(offlinePopup.energy)} energy</span>
			<span class="offline-dismiss">click to dismiss</span>
		</div>
	{/if}

	<div class="hud">
		<div class="resource-display">
			<span class="resource-label">ENERGY</span>
			<span class="resource-value">{formatNumber(gameState.resources.energy)}</span>
			<span class="resource-rate">+{formatNumber(production)}/s</span>
		</div>
		<div class="stats">
			<span>{gameState.coreShape.type} ({gameState.coreShape.sides} sides)</span>
			<span>{placed} shapes</span>
			{#if gameState.prestige.level > 0}
				<span class="prestige-badge">P{gameState.prestige.level}</span>
			{/if}
		</div>
	</div>

	<div class="main-area">
		<div class="network-area">
			<ShapeNetwork />
		</div>
		<div class="side-panel">
			<ShopPanel />
			<PrestigeButton />
		</div>
	</div>
</div>

<style>
	.game-canvas {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		position: relative;
		overflow: hidden;
	}

	.offline-popup {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: var(--color-surface);
		border: 1px solid var(--color-gold);
		border-radius: 6px;
		padding: 1.5rem 2rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
		z-index: 100;
		animation: popup-in 0.3s ease-out;
		box-shadow: 0 0 30px rgba(255, 204, 68, 0.2);
		cursor: pointer;
	}

	.offline-title {
		font-size: 0.55rem;
		color: var(--color-gold);
		letter-spacing: 3px;
	}

	.offline-time {
		font-size: 0.35rem;
		color: var(--color-text-dim);
	}

	.offline-earned {
		font-size: 0.7rem;
		color: var(--color-green);
		text-shadow: 0 0 10px rgba(68, 255, 136, 0.4);
	}

	.offline-dismiss {
		font-size: 0.25rem;
		color: var(--color-text-dim);
		opacity: 0.5;
		margin-top: 0.3rem;
	}

	.hud {
		padding: 0.8rem 1.2rem;
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		z-index: 10;
		flex-shrink: 0;
	}

	.resource-display {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.resource-label {
		font-size: 0.45rem;
		color: var(--color-text-dim);
		letter-spacing: 2px;
	}

	.resource-value {
		font-size: 1.3rem;
		color: var(--color-accent);
		text-shadow: 0 0 20px var(--color-accent-glow);
	}

	.resource-rate {
		font-size: 0.4rem;
		color: var(--color-green);
	}

	.stats {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		font-size: 0.4rem;
		color: var(--color-text-dim);
		text-align: right;
	}

	.prestige-badge {
		color: var(--color-gold);
		text-shadow: 0 0 8px rgba(255, 204, 68, 0.4);
	}

	.main-area {
		flex: 1;
		display: flex;
		padding: 0 1.2rem 1rem;
		gap: 0.8rem;
		overflow: hidden;
	}

	.network-area {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 0;
	}

	.side-panel {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		flex-shrink: 0;
	}

	@keyframes popup-in {
		from {
			opacity: 0;
			transform: translate(-50%, -50%) scale(0.9);
		}
		to {
			opacity: 1;
			transform: translate(-50%, -50%) scale(1);
		}
	}
</style>
