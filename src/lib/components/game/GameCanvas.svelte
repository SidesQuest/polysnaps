<script>
	import { onMount } from 'svelte';
	import { gameState, addResource, getProductionByResource, getUnlockedResources, loadStateFrom, getPlacedCount } from '$lib/game/state.svelte.js';
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
				<span class="offline-earned" style="color: #ff44aa;">+{formatNumber(offlinePopup.flux)} flux</span>
			{/if}
			{#if offlinePopup.prisms > 0}
				<span class="offline-earned" style="color: #aa44ff;">+{formatNumber(offlinePopup.prisms)} prisms</span>
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
		font-size: 0.7rem;
		color: var(--color-gold);
		letter-spacing: 3px;
	}

	.offline-time {
		font-size: 0.5rem;
		color: var(--color-text-dim);
	}

	.offline-earned {
		font-size: 0.8rem;
		color: var(--color-green);
		text-shadow: 0 0 10px rgba(68, 255, 136, 0.4);
	}

	.offline-dismiss {
		font-size: 0.45rem;
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

	.resources-row {
		display: flex;
		gap: 1.2rem;
	}

	.resource-display {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.resource-label {
		font-size: 0.55rem;
		color: var(--color-text-dim);
		letter-spacing: 2px;
	}

	.resource-value {
		font-size: 1.3rem;
		color: var(--color-accent);
		text-shadow: 0 0 20px var(--color-accent-glow);
	}

	.resource-rate {
		font-size: 0.5rem;
		color: var(--color-green);
	}

	.stats {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		font-size: 0.5rem;
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
		overflow-y: auto;
		max-height: 100%;
		width: 300px;
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
