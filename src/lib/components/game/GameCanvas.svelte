<script>
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { gameState, addResource, getProductionByResource, getUnlockedResources, loadStateFrom, getPlacedCount, tickGenerators, tickAutoSystems, tickFluxConvert, tickPuzzleChecks, tickPentagonStorage, tickAchievements, tickChallengeCheck } from '$lib/game/state.svelte.js';
	import { startEngine, stopEngine, onTick } from '$lib/game/engine.js';
	import { saveGame, loadGame, hasSave } from '$lib/game/save.js';
	import { getOfflineSeconds, calculateOfflineEarnings, doubleOfflineEarnings, recordOnlineTime } from '$lib/game/offline.js';
	import { getAllAchievements } from '$lib/game/achievements.js';
	import { CHALLENGE_DEFS } from '$lib/game/challenges.js';
	import { playAchievement } from '$lib/game/audio.js';
	import { addToast } from '$lib/game/toast.svelte.js';
	import { formatNumber, formatTime } from '$lib/utils/format.js';
	import ShapeNetwork from './ShapeNetwork.svelte';
	import PixiCanvas from './PixiCanvas.svelte';
	import ShopPanel from '$lib/components/ui/ShopPanel.svelte';
	import PrestigeButton from '$lib/components/ui/PrestigeButton.svelte';
	import ComboPanel from '$lib/components/ui/ComboPanel.svelte';
	import SkillPanel from '$lib/components/ui/SkillPanel.svelte';
	import SkillOverlay from '$lib/components/ui/SkillOverlay.svelte';
	import GameMenu from '$lib/components/ui/GameMenu.svelte';
	import AchievementPanel from '$lib/components/ui/AchievementPanel.svelte';
	import ChallengePanel from '$lib/components/ui/ChallengePanel.svelte';
	import Toast from '$lib/components/ui/Toast.svelte';
	import Tutorial from '$lib/components/ui/Tutorial.svelte';
	import CyberPanel from '$lib/components/ui/CyberPanel.svelte';
	import CyberButton from '$lib/components/ui/CyberButton.svelte';

	let production = $derived(getProductionByResource());
	let unlockedResources = $derived(getUnlockedResources());
	let placed = $derived(getPlacedCount());
	let offlinePopup = $state(null);
	let skillTreeOpen = $state(false);
	let achievementsOpen = $state(false);
	let challengesOpen = $state(false);
	let menuOpen = $state(false);
	let prestigeFlash = $state(false);
	let usePixi = $state(false);
	let prevComboLen = $state(0);
	let allAchievements = getAllAchievements();

	function handlePrestige() {
		prestigeFlash = true;
		setTimeout(() => (prestigeFlash = false), 800);
	}

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
					offlinePopup = { seconds: offlineSecs, ...earnings, doubled: false };
				}
			}
		}

		prevComboLen = (gameState.discoveredCombos || []).length;

		let tickElapsed = 0;
		const unsubscribe = onTick((delta) => {
			tickElapsed += delta * 1000;
			tickGenerators(delta);
			tickAutoSystems(delta, tickElapsed);
			tickFluxConvert(delta);
			tickPentagonStorage(delta);
			if (Math.floor(tickElapsed / 2000) !== Math.floor((tickElapsed - delta * 1000) / 2000)) {
				tickPuzzleChecks();
				const newAchs = tickAchievements();
				if (newAchs.length > 0) {
					for (const id of newAchs) {
						const def = allAchievements.find(a => a.id === id);
						if (def) {
							addToast(def.name + ' — ' + def.desc, 'achievement');
							playAchievement();
						}
					}
				}
				const completedCh = tickChallengeCheck();
				if (completedCh) {
					const chDef = CHALLENGE_DEFS.find(c => c.id === completedCh);
					if (chDef) addToast('Challenge complete: ' + chDef.name, 'challenge');
				}
			}

			const curComboLen = (gameState.discoveredCombos || []).length;
			if (curComboLen > prevComboLen) {
				addToast('New combo discovered!', 'combo');
				prevComboLen = curComboLen;
			}

			const prod = getProductionByResource();
			addResource('energy', prod.energy * delta);
			if (prod.flux > 0) addResource('flux', prod.flux * delta);
			if (prod.prisms > 0) addResource('prisms', prod.prisms * delta);
			gameState.stats.timePlayed += delta;
			gameState.stats.runTime = (gameState.stats.runTime || 0) + delta;
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
	{#if prestigeFlash}
		<div class="prestige-flash"></div>
	{/if}

	{#if skillTreeOpen}
		<SkillOverlay onclose={() => (skillTreeOpen = false)} />
	{/if}

	<GameMenu bind:open={menuOpen} bind:usePixi />

	{#if offlinePopup}
		<div class="offline-popup" role="dialog" tabindex="-1" onkeydown={(e) => e.key === 'Escape' && (offlinePopup = null)}>
			<CyberPanel title="WELCOME BACK" accent="gold">
				<div class="offline-body">
					<span class="offline-time">Away for {formatTime(offlinePopup.seconds)}</span>
					<span class="offline-earned energy">+{formatNumber(offlinePopup.energy)} energy</span>
					{#if offlinePopup.flux > 0}
						<span class="offline-earned flux">+{formatNumber(offlinePopup.flux)} flux</span>
					{/if}
					{#if offlinePopup.prisms > 0}
						<span class="offline-earned prisms">+{formatNumber(offlinePopup.prisms)} prisms</span>
					{/if}
					{#if offlinePopup.adDoubleAvailable && !offlinePopup.doubled}
						<CyberButton small variant="green" onclick={(e) => {
							e.stopPropagation();
							addResource('energy', offlinePopup.energy);
							if (offlinePopup.flux > 0) addResource('flux', offlinePopup.flux);
							if (offlinePopup.prisms > 0) addResource('prisms', offlinePopup.prisms);
							offlinePopup = { ...offlinePopup, doubled: true, energy: offlinePopup.energy * 2, flux: offlinePopup.flux * 2, prisms: offlinePopup.prisms * 2 };
							addToast('Offline earnings doubled!', 'info');
						}}>
							{#snippet children()}📺 WATCH AD TO DOUBLE{/snippet}
						</CyberButton>
					{/if}
					{#if offlinePopup.doubled}
						<span class="offline-doubled">✓ DOUBLED!</span>
					{/if}
					<button class="offline-dismiss-btn" onclick={() => (offlinePopup = null)}>DISMISS</button>
				</div>
			</CyberPanel>
		</div>
	{/if}

	<AchievementPanel bind:open={achievementsOpen} />
	<ChallengePanel bind:open={challengesOpen} />
	<Toast />
	<Tutorial />

	<div class="hud">
		<button class="menu-btn" onclick={() => (menuOpen = true)} title="Menu">
			<img src="{base}/assets/ui/3%20Icons/Icons/Icon_14.png" alt="Menu" />
		</button>
		<div class="resources-row">
			{#each unlockedResources as res}
				<div class="resource-display" style="--res-color: {res.color};">
					<span class="resource-label">{res.icon} {res.name.toUpperCase()}</span>
					<div class="resource-nums">
						<span class="resource-value">{formatNumber(gameState.resources[res.key])}</span>
						<span class="resource-rate">+{formatNumber(production[res.key])}/s</span>
					</div>
				</div>
			{/each}
		</div>
		<div class="hud-right">
			<span class="hud-shapes">{placed} shapes</span>
			{#if gameState.prestige.level > 0}
				<span class="prestige-badge">P{gameState.prestige.level} · 🔮 {gameState.prestige.currency}</span>
			{/if}
			{#if gameState.skillPoints > 0}
				<span class="skill-points">★ {gameState.skillPoints} SP</span>
			{/if}
		</div>
	</div>

	<div class="main-area">
		<div class="network-area">
			{#if usePixi}
				<PixiCanvas />
			{:else}
				<ShapeNetwork />
			{/if}
		</div>
		<div class="side-panel">
			<ShopPanel />
			<ComboPanel />
			<SkillPanel bind:open={skillTreeOpen} />
			<CyberButton variant="ghost" onclick={() => (achievementsOpen = true)}>
				{#snippet children()}
					🏆 ACHIEVEMENTS
					<span class="side-count">{(gameState.achievements || []).length}/{allAchievements.length}</span>
				{/snippet}
			</CyberButton>
			{#if gameState.prestige.level >= 3}
				<CyberButton variant="ghost" onclick={() => (challengesOpen = true)}>
					{#snippet children()}
						⚔ CHALLENGES
						<span class="side-count">{(gameState.completedChallenges || []).length}/{CHALLENGE_DEFS.length}</span>
					{/snippet}
				</CyberButton>
			{/if}
			<PrestigeButton onprestige={handlePrestige} />
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
		z-index: 100;
		cursor: pointer;
		animation: popup-in 0.2s ease-out;
		width: 280px;
	}

	.offline-body {
		padding: 12px 16px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
	}

	.offline-time {
		font-size: 8px;
		color: var(--color-text-dim);
	}

	.offline-earned {
		font-size: 11px;
	}

	.offline-earned.energy { color: var(--color-accent); }
	.offline-earned.flux { color: #ff44aa; }
	.offline-earned.prisms { color: #aa44ff; }

	.offline-doubled {
		font-family: var(--font-pixel);
		font-size: 9px;
		color: var(--color-green);
		text-shadow: 0 0 6px rgba(85, 255, 153, 0.3);
	}

	.offline-dismiss-btn {
		font-family: var(--font-pixel);
		font-size: 7px;
		color: var(--color-text-dim);
		background: transparent;
		border: 1px solid var(--color-border);
		border-radius: 2px;
		padding: 4px 12px;
		cursor: pointer;
		margin-top: 4px;
	}

	.offline-dismiss-btn:hover {
		color: var(--color-text);
		border-color: var(--color-border-light);
	}

	.hud {
		padding: 10px 16px;
		display: flex;
		align-items: center;
		gap: 16px;
		z-index: 10;
		flex-shrink: 0;
		background: rgba(20, 20, 32, 0.95);
		border-bottom: 2px solid var(--color-border);
	}

	.menu-btn {
		width: 40px;
		height: 40px;
		background: var(--color-surface);
		border: 2px solid var(--color-border);
		border-radius: 4px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 4px;
		flex-shrink: 0;
		transition: border-color 0.15s, background 0.15s;
		box-shadow: 0 2px 4px rgba(0,0,0,0.3);
	}

	.menu-btn:hover {
		border-color: var(--color-accent);
		background: var(--color-surface-hover);
	}

	.menu-btn:active {
		transform: translateY(1px);
	}

	.menu-btn img {
		width: 28px;
		height: 28px;
		image-rendering: pixelated;
	}

	.resources-row {
		display: flex;
		gap: 20px;
		flex: 1;
	}

	.resource-display {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.resource-label {
		font-size: 10px;
		letter-spacing: 2px;
		color: var(--res-color);
		opacity: 0.8;
	}

	.resource-nums {
		display: flex;
		align-items: baseline;
		gap: 8px;
	}

	.resource-value {
		font-size: 20px;
		color: var(--res-color);
	}

	.resource-rate {
		font-size: 10px;
		color: var(--color-green);
	}

	.hud-right {
		display: flex;
		flex-direction: column;
		gap: 4px;
		font-size: 10px;
		color: var(--color-text-dim);
		text-align: right;
		flex-shrink: 0;
	}

	.hud-shapes {
		font-size: 11px;
	}

	.prestige-badge {
		font-size: 12px;
		color: var(--color-gold);
		text-shadow: 0 0 6px rgba(255,221,85,0.3);
	}

	.skill-points {
		font-size: 11px;
		color: #ff44aa;
	}

	.side-count {
		margin-left: auto;
		font-size: 10px;
		color: var(--color-text-dim);
	}

	.main-area {
		flex: 1;
		display: flex;
		padding: 0 8px 8px;
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
		gap: 8px;
		flex-shrink: 0;
		overflow-y: auto;
		max-height: 100%;
		width: 320px;
		padding: 4px;
	}

	.prestige-flash {
		position: absolute;
		inset: 0;
		background: radial-gradient(circle, rgba(255,221,85,0.6) 0%, rgba(255,221,85,0) 70%);
		z-index: 50;
		pointer-events: none;
		animation: flash-out 0.8s ease-out forwards;
	}

	@keyframes flash-out {
		0% { opacity: 1; transform: scale(0.8); }
		30% { opacity: 1; transform: scale(1.2); }
		100% { opacity: 0; transform: scale(2); }
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
