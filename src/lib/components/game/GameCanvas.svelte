<script>
	import { onMount } from 'svelte';
	import { gameState, addResource, getProductionByResource, getUnlockedResources, loadStateFrom, getPlacedCount, tickGenerators } from '$lib/game/state.svelte.js';
	import { startEngine, stopEngine, onTick } from '$lib/game/engine.js';
	import { saveGame, loadGame, hasSave } from '$lib/game/save.js';
	import { getOfflineSeconds, calculateOfflineEarnings, recordOnlineTime } from '$lib/game/offline.js';
	import { formatNumber, formatTime } from '$lib/utils/format.js';
	import ShapeNetwork from './ShapeNetwork.svelte';
	import ShopPanel from '$lib/components/ui/ShopPanel.svelte';
	import PrestigeButton from '$lib/components/ui/PrestigeButton.svelte';
	import ComboPanel from '$lib/components/ui/ComboPanel.svelte';
	import SkillPanel from '$lib/components/ui/SkillPanel.svelte';
	import SkillOverlay from '$lib/components/ui/SkillOverlay.svelte';

	let production = $derived(getProductionByResource());
	let unlockedResources = $derived(getUnlockedResources());
	let placed = $derived(getPlacedCount());
	let offlinePopup = $state(null);
	let skillTreeOpen = $state(false);

	onMount(() => {
		if (hasSave()) {
			const saved = loadGame();
			loadStateFrom(saved);

			const offlineSecs = getOfflineSeconds();
			if (offlineSecs > 10 && placed > 0) {
				const earnings = calculateOfflineEarnings(gameState, offlineSecs);
				if (earnings.energy > 0 || earnings.flux > 0 || earnings.prisms > 0) {
					addResource('energy', earnings.energy);
					if (earnings.flux > 0) addResource('flux', earnings.flux);
					if (earnings.prisms > 0) addResource('prisms', earnings.prisms);
					offlinePopup = { seconds: offlineSecs, ...earnings };
					setTimeout(() => (offlinePopup = null), 5000);
				}
			}
		}

		const unsubscribe = onTick((delta) => {
			tickGenerators(delta);
			const prod = getProductionByResource();
			addResource('energy', prod.energy * delta);
			if (prod.flux > 0) addResource('flux', prod.flux * delta);
			if (prod.prisms > 0) addResource('prisms', prod.prisms * delta);
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
	{#if skillTreeOpen}
		<SkillOverlay onclose={() => (skillTreeOpen = false)} />
	{/if}

	{#if offlinePopup}
		<div class="offline-popup" onclick={() => (offlinePopup = null)} role="button" tabindex="0" onkeydown={(e) => e.key === 'Enter' && (offlinePopup = null)}>
			<span class="offline-title">WELCOME BACK</span>
			<span class="offline-time">Away for {formatTime(offlinePopup.seconds)}</span>
			<span class="offline-earned">+{formatNumber(offlinePopup.energy)} energy</span>
			{#if offlinePopup.flux > 0}
				<span class="offline-earned flux">+{formatNumber(offlinePopup.flux)} flux</span>
			{/if}
			{#if offlinePopup.prisms > 0}
				<span class="offline-earned prisms">+{formatNumber(offlinePopup.prisms)} prisms</span>
			{/if}
			<span class="offline-dismiss">click to dismiss</span>
		</div>
	{/if}

	<div class="hud">
		<div class="resources-row">
		{#each unlockedResources as res}
			<div class="resource-display">
				<span class="resource-label" style="color: {res.color};">{res.icon} {res.name.toUpperCase()}</span>
				<span class="resource-value" style="color: {res.color};">{formatNumber(gameState.resources[res.key])}</span>
				<span class="resource-rate">+{formatNumber(production[res.key])}/s</span>
			</div>
		{/each}
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
			<ComboPanel />
			<SkillPanel bind:open={skillTreeOpen} />
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
		padding: 20px 28px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		z-index: 100;
		animation: popup-in 0.15s ease-out;
		cursor: pointer;
	}

	.offline-title {
		font-size: 9px;
		color: var(--color-gold);
		letter-spacing: 4px;
	}

	.offline-time {
		font-size: 7px;
		color: var(--color-text-dim);
	}

	.offline-earned {
		font-size: 10px;
		color: var(--color-green);
	}

	.offline-earned.flux {
		color: #ff44aa;
	}

	.offline-earned.prisms {
		color: #aa44ff;
	}

	.offline-dismiss {
		font-size: 6px;
		color: var(--color-text-dim);
		opacity: 0.5;
		margin-top: 4px;
	}

	.hud {
		padding: 10px 16px;
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		z-index: 10;
		flex-shrink: 0;
		background: linear-gradient(
			180deg,
			rgba(11, 11, 20, 0.95) 0%,
			rgba(11, 11, 20, 0.7) 70%,
			transparent 100%
		);
		border-bottom: 1px solid var(--color-border);
	}

	.resources-row {
		display: flex;
		gap: 20px;
	}

	.resource-display {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.resource-label {
		font-size: 7px;
		letter-spacing: 2px;
	}

	.resource-value {
		font-size: 16px;
	}

	.resource-rate {
		font-size: 7px;
		color: var(--color-green);
	}

	.stats {
		display: flex;
		flex-direction: column;
		gap: 2px;
		font-size: 7px;
		color: var(--color-text-dim);
		text-align: right;
	}

	.prestige-badge {
		color: var(--color-gold);
	}

	.main-area {
		flex: 1;
		display: flex;
		padding: 0 12px 10px;
		gap: 8px;
		overflow: hidden;
	}

	.network-area {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 0;
		position: relative;
	}

	.side-panel {
		display: flex;
		flex-direction: column;
		gap: 4px;
		flex-shrink: 0;
		overflow-y: auto;
		max-height: 100%;
		width: 320px;
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
