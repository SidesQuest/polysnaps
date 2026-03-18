<script>
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { gameState, addResource, getProductionByResource, getUnlockedResources, loadStateFrom, getPlacedCount, tickGenerators, tickAutoSystems, tickFluxConvert, tickPuzzleChecks, tickPentagonStorage, tickAchievements, tickChallengeCheck, getPrestigeReward, getPrestigeThreshold, canPrestige, resetForPrestige } from '$lib/game/state.svelte.js';
	import { startEngine, stopEngine, onTick } from '$lib/game/engine.js';
	import { saveGame, loadGame, hasSave } from '$lib/game/save.js';
	import { getOfflineSeconds, calculateOfflineEarnings, doubleOfflineEarnings, recordOnlineTime } from '$lib/game/offline.js';
	import { getAllAchievements } from '$lib/game/achievements.js';
	import { CHALLENGE_DEFS } from '$lib/game/challenges.js';
	import { getAllCombos } from '$lib/game/combos.js';
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
	let nextGoal = $derived.by(() => {
		const p = placed;
		const totalEnergy = gameState.stats.totalEnergyEarned;
		const threshold = getPrestigeThreshold ? getPrestigeThreshold() : Infinity;
		const prestigePct = Math.min(100, (totalEnergy / threshold) * 100);

		// Check shape milestones
		const shapeMilestones = [3, 5, 10, 20, 50];
		for (const m of shapeMilestones) {
			if (p < m) return { label: `Place ${m} shapes`, progress: p, target: m, pct: (p / m) * 100 };
		}

		// Check prestige progress
		if (prestigePct < 100) {
			return { label: 'Prestige', progress: Math.round(prestigePct), target: 100, pct: prestigePct };
		}

		return { label: 'Prestige ready!', progress: 100, target: 100, pct: 100 };
	});
	let milestonePopup = $state(null);
	let lastMilestoneCheck = $state({ shapes: 0, energy: '' });
	let offlinePopup = $state(null);
	let skillTreeOpen = $state(false);
	let achievementsOpen = $state(false);
	let challengesOpen = $state(false);
	let menuOpen = $state(false);
	let prestigePhase = $state(null); // null | 'flash' | 'banner'
	let prestigeInfo = $state(null);
	let usePixi = $state(false);
	let prevComboLen = $state(0);
	let allAchievements = getAllAchievements();
	let allCombos = getAllCombos();
	let comboPopup = $state(null);
	let mobileTab = $state('canvas');
	let dashboardOpen = $state(false);

	function handlePrestige() {
		const shapeNames = ['triangle', 'square', 'pentagon', 'hexagon', 'heptagon', 'octagon'];
		const nextSides = gameState.coreShape.sides + 1;
		const nextName = shapeNames[nextSides - 3] || `${nextSides}-gon`;
		const reward = getPrestigeReward ? getPrestigeReward() : 0;
		
		prestigeInfo = { nextName, nextSides, reward, level: gameState.prestige.level + 1 };
		prestigePhase = 'flash';
		setTimeout(() => { prestigePhase = 'banner'; }, 1200);
		setTimeout(() => { prestigePhase = null; prestigeInfo = null; }, 4500);
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
				const newComboIds = (gameState.discoveredCombos || []).slice(prevComboLen);
				for (const comboId of newComboIds) {
					const comboDef = allCombos.find(c => c.id === comboId);
					if (comboDef) {
						addToast(`${comboDef.icon} ${comboDef.name} — ${comboDef.description}`, 'combo');
						comboPopup = { name: comboDef.name, icon: comboDef.icon, bonus: comboDef.bonus.value };
						setTimeout(() => { comboPopup = null; }, 2500);
					}
				}
				prevComboLen = curComboLen;
			}

			const prod = getProductionByResource();
			addResource('energy', prod.energy * delta);
			if (prod.flux > 0) addResource('flux', prod.flux * delta);
			if (prod.prisms > 0) addResource('prisms', prod.prisms * delta);
			gameState.stats.timePlayed += delta;
			gameState.stats.runTime = (gameState.stats.runTime || 0) + delta;

			// Milestone checks
			const shapeM = [10, 20, 50, 100, 500];
			const energyM = [1e6, 1e9, 1e12];
			const energyNames = ['1M', '1B', '1T'];
			for (const m of shapeM) {
				if (getPlacedCount() >= m && lastMilestoneCheck.shapes < m) {
					lastMilestoneCheck.shapes = m;
					milestonePopup = { text: `${m} SHAPES!`, sub: 'Network expanding', icon: '◆' };
					addToast(`${m} shapes placed!`, 'info');
					setTimeout(() => { milestonePopup = null; }, 2500);
					break;
				}
			}
			for (let i = 0; i < energyM.length; i++) {
				if (gameState.stats.totalEnergyEarned >= energyM[i] && lastMilestoneCheck.energy !== energyNames[i]) {
					lastMilestoneCheck.energy = energyNames[i];
					milestonePopup = { text: `${energyNames[i]} ENERGY!`, sub: 'Power rising', icon: '⚡' };
					addToast(`${energyNames[i]} total energy earned!`, 'info');
					setTimeout(() => { milestonePopup = null; }, 2500);
					break;
				}
			}
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

	function handleKeydown(e) {
		if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
		if (skillTreeOpen || achievementsOpen || challengesOpen || menuOpen) {
			if (e.key === 'Escape') {
				skillTreeOpen = false;
				achievementsOpen = false;
				challengesOpen = false;
				menuOpen = false;
			}
			return;
		}
		switch(e.key) {
			case 'm': case 'M': menuOpen = true; break;
			case 'p': case 'P':
				if (canPrestige()) {
					handlePrestige();
					resetForPrestige();
				}
				break;
			case 'Escape': break;
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="game-canvas">
	{#if prestigePhase === 'flash'}
		<div class="prestige-flash"></div>
	{/if}
	{#if prestigePhase === 'banner' && prestigeInfo}
		<div class="prestige-banner">
			<div class="prestige-banner-inner">
				<span class="pb-star">★</span>
				<span class="pb-title">PRESTIGE</span>
				<span class="pb-level">Level {prestigeInfo.level}</span>
				<span class="pb-shape">Core evolved to {prestigeInfo.nextName}</span>
				<span class="pb-reward">+{prestigeInfo.reward} Cores earned</span>
			</div>
		</div>
	{/if}

	{#if comboPopup}
		<div class="combo-popup">
			<span class="combo-popup-icon">{comboPopup.icon}</span>
			<span class="combo-popup-name">{comboPopup.name}</span>
			<span class="combo-popup-bonus">×{comboPopup.bonus} multiplier</span>
		</div>
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
	{#if milestonePopup}
		<div class="milestone-popup">
			<span class="milestone-icon">{milestonePopup.icon}</span>
			<span class="milestone-text">{milestonePopup.text}</span>
			<span class="milestone-sub">{milestonePopup.sub}</span>
		</div>
	{/if}
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
		{#if nextGoal}
			<div class="next-goal">
				<span class="next-goal-label">{nextGoal.label}</span>
				<div class="next-goal-bar">
					<div class="next-goal-fill" style="width: {nextGoal.pct}%"></div>
				</div>
			</div>
		{/if}
		<div class="hud-right">
			<span class="hud-shapes">{placed} {placed === 1 ? 'shape' : 'shapes'}</span>
			{#if gameState.prestige.level > 0}
				<span class="prestige-badge">P{gameState.prestige.level} · 🔮 {gameState.prestige.currency}</span>
			{/if}
			{#if gameState.skillPoints > 0}
				<span class="skill-points">★ {gameState.skillPoints} SP</span>
			{/if}
		</div>
	</div>

	<div class="mobile-tabs">
		<button class="mobile-tab" class:active={mobileTab === 'canvas'} onclick={() => (mobileTab = 'canvas')}>
			◆ MAP
		</button>
		<button class="mobile-tab" class:active={mobileTab === 'panel'} onclick={() => (mobileTab = 'panel')}>
			⚙ BUILD
		</button>
	</div>

	<div class="main-area">
		<div class="network-area" class:mobile-hidden={mobileTab !== 'canvas'}>
			{#if usePixi}
				<PixiCanvas />
			{:else}
				<ShapeNetwork />
			{/if}
		</div>
		<div class="side-panel" class:mobile-hidden={mobileTab !== 'panel'}>
			<ShopPanel />
			<ComboPanel />
			<button class="dash-toggle" onclick={() => (dashboardOpen = !dashboardOpen)}>
				<span class="dash-title">📊 STATS</span>
				<span class="dash-arrow">{dashboardOpen ? '▲' : '▼'}</span>
			</button>
			{#if dashboardOpen}
				<CyberPanel>
					<div class="dash-body">
						{#each unlockedResources as res}
							<div class="dash-row">
								<span class="dash-label" style="color: {res.color};">{res.icon} {res.name}</span>
								<span class="dash-value" style="color: {res.color};">{formatNumber(production[res.key])}/s</span>
							</div>
						{/each}
						<div class="dash-sep"></div>
						<div class="dash-row">
							<span class="dash-label">Shapes</span>
							<span class="dash-value">{placed}</span>
						</div>
						<div class="dash-row">
							<span class="dash-label">Prestige</span>
							<span class="dash-value gold">P{gameState.prestige.level} · 🔮{gameState.prestige.currency}</span>
						</div>
						<div class="dash-row">
							<span class="dash-label">Achievements</span>
							<span class="dash-value">+{(gameState.achievements || []).length}% prod</span>
						</div>
						<div class="dash-row">
							<span class="dash-label">Time played</span>
							<span class="dash-value">{formatTime(gameState.stats.timePlayed)}</span>
						</div>
					</div>
				</CyberPanel>
			{/if}
			{#if gameState.prestige.level >= 1}
			<SkillPanel bind:open={skillTreeOpen} />
		{/if}
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
		width: 320px;
		max-width: 90vw;
	}

	.offline-body {
		padding: 16px 20px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
	}

	.offline-time {
		font-size: 10px;
		color: var(--color-text-dim);
	}

	.offline-earned {
		font-size: 13px;
		font-weight: normal;
	}

	.offline-earned.energy { color: var(--color-accent); }
	.offline-earned.flux { color: #ff66bb; }
	.offline-earned.prisms { color: #bb66ff; }

	.offline-doubled {
		font-family: var(--font-pixel);
		font-size: 11px;
		color: var(--color-green);
		text-shadow: 0 0 8px rgba(85, 255, 153, 0.4);
	}

	.offline-dismiss-btn {
		font-family: var(--font-pixel);
		font-size: 9px;
		color: var(--color-text-dim);
		background: transparent;
		border: 1px solid var(--color-border);
		border-radius: 4px;
		padding: 8px 20px;
		cursor: pointer;
		margin-top: 6px;
		transition: color 0.15s, border-color 0.15s, background 0.15s;
	}

	.offline-dismiss-btn:hover {
		color: var(--color-text);
		border-color: var(--color-border-light);
		background: rgba(255,255,255,0.03);
	}

	.hud {
		padding: 10px 16px;
		display: flex;
		align-items: center;
		gap: 16px;
		z-index: 10;
		flex-shrink: 0;
		background: rgba(14, 16, 36, 0.97);
		border-bottom: 2px solid var(--color-border);
		backdrop-filter: blur(8px);
	}

	.menu-btn {
		width: 44px;
		height: 44px;
		background: var(--color-surface);
		border: 2px solid var(--color-border);
		border-radius: 6px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 6px;
		flex-shrink: 0;
		transition: border-color 0.15s, background 0.15s, transform 0.1s;
		box-shadow: 0 2px 8px rgba(0,0,0,0.4);
	}

	.menu-btn:hover {
		border-color: var(--color-accent);
		background: var(--color-surface-hover);
	}

	.menu-btn:active {
		transform: scale(0.95);
	}

	.menu-btn img {
		width: 28px;
		height: 28px;
		image-rendering: pixelated;
	}

	.resources-row {
		display: flex;
		gap: 24px;
		flex: 1;
		overflow-x: auto;
	}

	.resource-display {
		display: flex;
		flex-direction: column;
		gap: 3px;
		min-width: 0;
	}

	.resource-label {
		font-size: 10px;
		letter-spacing: 2px;
		color: var(--res-color);
		opacity: 0.9;
	}

	.resource-nums {
		display: flex;
		align-items: baseline;
		gap: 8px;
	}

	.resource-value {
		font-size: 18px;
		color: var(--res-color);
		text-shadow: 0 0 8px color-mix(in srgb, var(--res-color) 30%, transparent);
	}

	.resource-rate {
		font-size: 10px;
		color: var(--color-green);
		opacity: 0.9;
		animation: rate-pulse 2s ease-in-out infinite;
	}

	@keyframes rate-pulse {
		0%, 100% { opacity: 0.7; }
		50% { opacity: 1; text-shadow: 0 0 4px rgba(68, 255, 136, 0.3); }
	}

	.next-goal {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 4px 10px;
		background: rgba(255, 221, 85, 0.06);
		border: 1px solid rgba(255, 221, 85, 0.15);
		border-radius: 4px;
	}

	.next-goal-label {
		font-size: 9px;
		color: var(--color-gold);
		white-space: nowrap;
		opacity: 0.8;
	}

	.next-goal-bar {
		width: 60px;
		height: 6px;
		background: rgba(0,0,0,0.3);
		border-radius: 3px;
		overflow: hidden;
	}

	.next-goal-fill {
		height: 100%;
		background: var(--color-gold);
		border-radius: 3px;
		transition: width 0.5s ease;
		box-shadow: 0 0 4px rgba(255, 221, 85, 0.4);
	}

	.hud-right {
		display: flex;
		flex-direction: column;
		gap: 4px;
		font-size: 11px;
		color: var(--color-text-dim);
		text-align: right;
		flex-shrink: 0;
	}

	.hud-shapes {
		font-size: 11px;
		color: var(--color-text);
	}

	.prestige-badge {
		font-size: 12px;
		color: var(--color-gold);
		text-shadow: 0 0 8px rgba(255,221,85,0.35);
	}

	.skill-points {
		font-size: 11px;
		color: #ff66bb;
	}

	.side-count {
		margin-left: auto;
		font-size: 10px;
		color: var(--color-text-dim);
	}

	.mobile-tabs {
		display: none;
		z-index: 10;
		background: rgba(14, 16, 36, 0.97);
		border-bottom: 2px solid var(--color-border);
	}

	.mobile-tab {
		flex: 1;
		padding: 10px;
		font-family: var(--font-pixel);
		font-size: 11px;
		color: var(--color-text-dim);
		background: transparent;
		border: none;
		cursor: pointer;
		transition: color 0.15s, background 0.15s;
		border-bottom: 3px solid transparent;
	}

	.mobile-tab.active {
		color: var(--color-accent);
		background: rgba(100, 140, 255, 0.06);
		border-bottom-color: var(--color-accent);
	}

	.mobile-tab:not(.active):hover {
		color: var(--color-text);
		background: rgba(255, 255, 255, 0.02);
	}

	.main-area {
		flex: 1;
		display: flex;
		padding: 0 10px 10px;
		gap: 10px;
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

	.network-area::after {
		content: '';
		position: absolute;
		inset: 0;
		background: radial-gradient(ellipse at center, transparent 40%, rgba(8,8,20,0.5) 80%, rgba(8,8,20,0.85) 100%);
		pointer-events: none;
		z-index: 1;
	}

	.side-panel {
		display: flex;
		flex-direction: column;
		gap: 10px;
		flex-shrink: 0;
		overflow-y: auto;
		max-height: 100%;
		width: 340px;
		padding: 4px;
	}

	.prestige-flash {
		position: absolute;
		inset: 0;
		z-index: 50;
		pointer-events: none;
		background: radial-gradient(circle, rgba(255,221,85,0.8) 0%, rgba(255,255,255,0.9) 40%, rgba(255,221,85,0) 80%);
		animation: prestige-flash-anim 1.2s ease-out forwards;
	}

	@keyframes prestige-flash-anim {
		0% { opacity: 0; transform: scale(0.3); }
		20% { opacity: 1; transform: scale(1); }
		60% { opacity: 1; }
		100% { opacity: 0; transform: scale(1.5); }
	}

	.prestige-banner {
		position: absolute;
		inset: 0;
		z-index: 55;
		pointer-events: none;
		display: flex;
		align-items: center;
		justify-content: center;
		animation: banner-fade 3.3s ease-out forwards;
	}

	.prestige-banner-inner {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		padding: 30px 50px;
		background: rgba(10, 10, 25, 0.92);
		border: 3px solid var(--color-gold);
		border-radius: 8px;
		box-shadow: 0 0 40px rgba(255, 221, 85, 0.4), inset 0 0 20px rgba(255, 221, 85, 0.05);
		animation: banner-scale 3.3s ease-out forwards;
	}

	.pb-star {
		font-size: 32px;
		color: var(--color-gold);
		text-shadow: 0 0 20px rgba(255, 221, 85, 0.6);
		animation: star-spin 1s ease-out;
	}

	.pb-title {
		font-family: var(--font-pixel);
		font-size: 20px;
		color: var(--color-gold);
		letter-spacing: 6px;
		text-shadow: 0 0 16px rgba(255, 221, 85, 0.5);
	}

	.pb-level {
		font-family: var(--font-pixel);
		font-size: 14px;
		color: var(--color-text);
	}

	.pb-shape {
		font-family: var(--font-pixel);
		font-size: 11px;
		color: var(--color-accent);
		text-shadow: 0 0 8px rgba(136, 170, 255, 0.4);
	}

	.pb-reward {
		font-family: var(--font-pixel);
		font-size: 11px;
		color: var(--color-green);
		text-shadow: 0 0 8px rgba(85, 255, 153, 0.4);
	}

	@keyframes banner-fade {
		0% { opacity: 0; }
		10% { opacity: 1; }
		80% { opacity: 1; }
		100% { opacity: 0; }
	}

	@keyframes banner-scale {
		0% { transform: scale(0.8); }
		15% { transform: scale(1.05); }
		25% { transform: scale(1); }
		80% { transform: scale(1); }
		100% { transform: scale(0.95); }
	}

	@keyframes star-spin {
		0% { transform: scale(0) rotate(-180deg); }
		60% { transform: scale(1.3) rotate(10deg); }
		100% { transform: scale(1) rotate(0deg); }
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

	.milestone-popup {
		position: absolute;
		top: 30%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: 42;
		pointer-events: none;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		animation: milestone-anim 2.5s ease-out forwards;
	}

	.milestone-icon {
		font-size: 36px;
		animation: milestone-bounce 0.6s ease-out;
	}

	.milestone-text {
		font-family: var(--font-pixel);
		font-size: 18px;
		color: var(--color-gold);
		letter-spacing: 4px;
		text-shadow: 0 0 20px rgba(255, 221, 85, 0.6);
	}

	.milestone-sub {
		font-family: var(--font-pixel);
		font-size: 10px;
		color: var(--color-text-dim);
		letter-spacing: 2px;
	}

	@keyframes milestone-anim {
		0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
		15% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
		25% { transform: translate(-50%, -50%) scale(1); }
		75% { opacity: 1; }
		100% { opacity: 0; transform: translate(-50%, -55%); }
	}

	@keyframes milestone-bounce {
		0% { transform: scale(0) rotate(-20deg); }
		50% { transform: scale(1.4) rotate(5deg); }
		100% { transform: scale(1) rotate(0deg); }
	}

	.combo-popup {
		position: absolute;
		top: 35%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: 45;
		pointer-events: none;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		padding: 20px 36px;
		background: rgba(10, 10, 25, 0.9);
		border: 2px solid var(--color-green);
		border-radius: 8px;
		box-shadow: 0 0 30px rgba(85, 255, 153, 0.3);
		animation: combo-enter 2.5s ease-out forwards;
	}

	.combo-popup-icon {
		font-size: 32px;
		animation: combo-icon-bounce 0.5s ease-out;
	}

	.combo-popup-name {
		font-family: var(--font-pixel);
		font-size: 14px;
		color: var(--color-green);
		letter-spacing: 2px;
		text-shadow: 0 0 12px rgba(85, 255, 153, 0.5);
	}

	.combo-popup-bonus {
		font-family: var(--font-pixel);
		font-size: 11px;
		color: var(--color-gold);
		text-shadow: 0 0 8px rgba(255, 221, 85, 0.4);
	}

	@keyframes combo-enter {
		0% { opacity: 0; transform: translate(-50%, -50%) scale(0.7); }
		15% { opacity: 1; transform: translate(-50%, -50%) scale(1.05); }
		25% { transform: translate(-50%, -50%) scale(1); }
		75% { opacity: 1; }
		100% { opacity: 0; transform: translate(-50%, -55%) scale(0.95); }
	}

	@keyframes combo-icon-bounce {
		0% { transform: scale(0) rotate(-30deg); }
		50% { transform: scale(1.3) rotate(5deg); }
		100% { transform: scale(1) rotate(0deg); }
	}

	.dash-toggle {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 14px;
		background: var(--color-surface);
		border: 2px solid var(--color-border);
		border-radius: var(--panel-radius);
		cursor: pointer;
		font-family: var(--font-pixel);
		color: var(--color-text);
		box-shadow: inset 1px 1px 0 #2a2f55, inset -1px -1px 0 #12163a, 0 4px 16px rgba(0,0,0,0.5);
		transition: background 0.15s, border-color 0.15s;
		min-height: 44px;
	}

	.dash-toggle:hover {
		background: var(--color-surface-hover);
		border-color: var(--color-border-light);
	}

	.dash-title {
		font-size: 11px;
		color: var(--color-accent);
		letter-spacing: 2px;
	}

	.dash-arrow {
		margin-left: auto;
		font-size: 10px;
		color: var(--color-text-dim);
	}

	.dash-body {
		padding: 12px 14px;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.dash-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 3px 0;
	}

	.dash-label {
		font-family: var(--font-pixel);
		font-size: 9px;
		color: var(--color-text-dim);
	}

	.dash-value {
		font-family: var(--font-pixel);
		font-size: 10px;
		color: var(--color-text);
	}

	.dash-value.gold {
		color: var(--color-gold);
	}

	.dash-sep {
		height: 1px;
		background: var(--color-border);
		margin: 4px 0;
	}

	@media (max-width: 768px) {
		.next-goal {
			display: none;
		}

		.hud {
			padding: 8px 10px;
			gap: 10px;
		}

		.resources-row {
			gap: 12px;
		}

		.resource-value {
			font-size: 14px;
		}

		.resource-label {
			font-size: 9px;
			letter-spacing: 1px;
		}

		.hud-right {
			display: none;
		}

		.mobile-tabs {
			display: flex;
		}

		.main-area {
			padding: 0;
			gap: 0;
		}

		.network-area {
			flex: 1;
		}

		.side-panel {
			width: 100%;
			padding: 10px;
		}

		.mobile-hidden {
			display: none !important;
		}
	}
</style>
