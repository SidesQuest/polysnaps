<script>
	import { base } from '$app/paths';
	import { gameState, respecSkills, convertSkillPoints } from '$lib/game/state.svelte.js';
	import { saveGame, deleteSave, exportSaveFile, importSaveFile } from '$lib/game/save.js';
	import { loadStateFrom } from '$lib/game/state.svelte.js';
	import { isMuted, toggleMute, getVolume, setVolume, isAmbientPlaying, startAmbient, stopAmbient } from '$lib/game/audio.js';
	import { formatNumber, formatTime } from '$lib/utils/format.js';
	import { getAllAchievements } from '$lib/game/achievements.js';
	import { CHALLENGE_DEFS, getAvailableChallenges } from '$lib/game/challenges.js';
	import { getRespecCost } from '$lib/game/iap.js';
	import { getTheme, setTheme } from '$lib/game/theme.svelte.js';
	import CyberPanel from './CyberPanel.svelte';
	import CyberButton from './CyberButton.svelte';

	let { open = $bindable(false), usePixi = $bindable(false) } = $props();

	let tab = $state('main');
	let muted = $state(isMuted());
	let volume = $state(getVolume());
	let confirmReset = $state(false);
	let confirmRespec = $state(false);
	let saveFlash = $state(false);
	let exportFlash = $state(false);
	let importFlash = $state(false);
	let allAchievements = getAllAchievements();
	let respecCost = $derived(getRespecCost(gameState.prestige.respecCount || 0));
	let currentTheme = $derived(getTheme());

	function handleSave() {
		saveGame(gameState);
		saveFlash = true;
		setTimeout(() => (saveFlash = false), 1200);
	}

	function handleToggleMute() {
		muted = toggleMute();
	}

	function handleExport() {
		saveGame(gameState);
		exportSaveFile(gameState);
		exportFlash = true;
		setTimeout(() => (exportFlash = false), 1500);
	}

	async function handleImport() {
		const data = await importSaveFile();
		if (data) {
			loadStateFrom(data);
			saveGame(gameState);
			importFlash = true;
			setTimeout(() => (importFlash = false), 1500);
		}
	}

	function handleReset() {
		if (!confirmReset) {
			confirmReset = true;
			setTimeout(() => (confirmReset = false), 3000);
			return;
		}
		deleteSave();
		window.location.reload();
	}

	function handleRespec() {
		if (!confirmRespec) {
			confirmRespec = true;
			setTimeout(() => (confirmRespec = false), 3000);
			return;
		}
		respecSkills();
		confirmRespec = false;
	}

	function close() {
		open = false;
		tab = 'main';
		confirmReset = false;
		confirmRespec = false;
	}
</script>

{#if open}
	<div class="menu-overlay" onclick={close} role="button" tabindex="-1" onkeydown={(e) => e.key === 'Escape' && close()}>
		<div class="menu-container" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.key === 'Escape' && close()} role="dialog" tabindex="-1">
			<CyberPanel title="MENU" closable onclose={close}>
				<div class="menu-body">
					{#if tab === 'main'}
						<div class="menu-buttons">
							<CyberButton variant="ghost" onclick={() => (tab = 'settings')}>
								{#snippet children()}
									<img src="{base}/assets/ui/3%20Icons/Icons/Icon_14.png" alt="" />
									SETTINGS
								{/snippet}
							</CyberButton>

							<CyberButton variant="ghost" onclick={() => (tab = 'stats')}>
								{#snippet children()}
									<img src="{base}/assets/ui/3%20Icons/Icons/Icon_30.png" alt="" />
									STATS
								{/snippet}
							</CyberButton>

							<CyberButton variant="green" onclick={handleSave}>
								{#snippet children()}
									{saveFlash ? '✓ SAVED!' : '💾 SAVE GAME'}
								{/snippet}
							</CyberButton>

							<div class="save-row">
								<CyberButton small variant="ghost" onclick={handleExport}>
									{#snippet children()}{exportFlash ? '✓ EXPORTED' : '📥 EXPORT FILE'}{/snippet}
								</CyberButton>
								<CyberButton small variant="ghost" onclick={handleImport}>
									{#snippet children()}{importFlash ? '✓ LOADED' : '📤 IMPORT FILE'}{/snippet}
								</CyberButton>
							</div>

							<CyberButton variant="ghost" onclick={() => (tab = 'info')}>
								{#snippet children()}
									<img src="{base}/assets/ui/3%20Icons/Icons/Icon_20.png" alt="" />
									INFO
								{/snippet}
							</CyberButton>

							<CyberButton variant="red" onclick={close}>
								{#snippet children()}
									▶ RESUME
								{/snippet}
							</CyberButton>
						</div>

					{:else if tab === 'settings'}
						<div class="sub-panel">
							<button class="back-btn" onclick={() => (tab = 'main')}>← BACK</button>
							<div class="settings-grid">
								<div class="setting-row">
									<span class="setting-label">Sound</span>
									<CyberButton small variant={muted ? 'purple' : 'green'} onclick={handleToggleMute}>
										{#snippet children()}{muted ? '🔇 OFF' : '🔊 ON'}{/snippet}
									</CyberButton>
								</div>
								{#if !muted}
								<div class="setting-row">
									<span class="setting-label">Volume</span>
									<div class="volume-control">
										<input
											type="range"
											min="0"
											max="100"
											value={Math.round(volume * 100)}
											oninput={(e) => { volume = e.target.value / 100; setVolume(volume); }}
											class="volume-slider"
										/>
										<span class="volume-pct">{Math.round(volume * 100)}%</span>
									</div>
								</div>
								<div class="setting-row">
									<span class="setting-label">Music</span>
									<CyberButton small variant={isAmbientPlaying() ? 'green' : 'purple'} onclick={() => {
										if (isAmbientPlaying()) stopAmbient();
										else startAmbient();
									}}>
										{#snippet children()}{isAmbientPlaying() ? '♫ ON' : '♫ OFF'}{/snippet}
									</CyberButton>
								</div>
								{/if}
								<div class="setting-row">
									<span class="setting-label">Renderer</span>
									<CyberButton small variant="ghost" onclick={() => (usePixi = !usePixi)}>
										{#snippet children()}{usePixi ? 'WebGL' : 'SVG'}{/snippet}
									</CyberButton>
								</div>
								<div class="setting-row">
									<span class="setting-label">Theme</span>
									<div class="theme-btns">
										<button class="theme-btn" class:active={currentTheme === ''} onclick={() => setTheme('')}>Cyber</button>
										<button class="theme-btn" class:active={currentTheme === 'neon'} onclick={() => setTheme('neon')}>Neon</button>
										<button class="theme-btn" class:active={currentTheme === 'midnight'} onclick={() => setTheme('midnight')}>Night</button>
									</div>
								</div>
								<div class="setting-row">
									<span class="setting-label">Auto-save</span>
									<span class="setting-value">Every 30s</span>
								</div>
								{#if gameState.skillPoints > 0}
									<div class="setting-row">
										<span class="setting-label">SP → Cores</span>
										<CyberButton small variant="green" onclick={() => convertSkillPoints(gameState.skillPoints)}>
											{#snippet children()}Convert {gameState.skillPoints} SP{/snippet}
										</CyberButton>
									</div>
								{/if}
								<div class="divider"></div>
								<div class="setting-row">
									<span class="setting-label">Respec skills</span>
									<CyberButton small variant="purple" onclick={handleRespec}>
										{#snippet children()}{confirmRespec ? '⚠ CONFIRM?' : respecCost === 0 ? 'FREE' : `${respecCost} Cores`}{/snippet}
									</CyberButton>
								</div>
								<div class="divider"></div>
								<div class="setting-row danger">
									<span class="setting-label">Reset</span>
									<CyberButton small variant="red" onclick={handleReset}>
										{#snippet children()}{confirmReset ? '⚠ CONFIRM?' : 'WIPE SAVE'}{/snippet}
									</CyberButton>
								</div>
							</div>
						</div>

					{:else if tab === 'stats'}
						<div class="sub-panel">
							<button class="back-btn" onclick={() => (tab = 'main')}>← BACK</button>
							<div class="stats-grid">
								<div class="stat-row">
									<span class="stat-label">Time played</span>
									<span class="stat-value">{formatTime(gameState.stats.timePlayed)}</span>
								</div>
								<div class="stat-row">
									<span class="stat-label">Shapes placed</span>
									<span class="stat-value">{gameState.stats.totalShapesPlaced}</span>
								</div>
								<div class="stat-row">
									<span class="stat-label">Total energy</span>
									<span class="stat-value">{formatNumber(gameState.stats.totalEnergyEarned)}</span>
								</div>
								<div class="stat-row">
									<span class="stat-label">Prestige level</span>
									<span class="stat-value gold">P{gameState.prestige.level}</span>
								</div>
								<div class="stat-row">
									<span class="stat-label">Cores</span>
									<span class="stat-value gold">🔮 {gameState.prestige.currency}</span>
								</div>
								<div class="stat-row">
									<span class="stat-label">Cores passive</span>
									<span class="stat-value">+{(gameState.prestige.currency * 1).toFixed(0)}%</span>
								</div>
								<div class="stat-row">
									<span class="stat-label">Core shape</span>
									<span class="stat-value">{gameState.coreShape.type} ({gameState.coreShape.sides})</span>
								</div>
								<div class="stat-row">
									<span class="stat-label">Active nodes</span>
									<span class="stat-value">{gameState.nodes.length - 1}</span>
								</div>
								<div class="stat-row">
									<span class="stat-label">Achievements</span>
									<span class="stat-value">{(gameState.achievements || []).length}/{allAchievements.length}</span>
								</div>
								<div class="stat-row">
									<span class="stat-label">Challenges</span>
									<span class="stat-value">{(gameState.completedChallenges || []).length}/{CHALLENGE_DEFS.length}</span>
								</div>
								<div class="stat-row">
									<span class="stat-label">Combos found</span>
									<span class="stat-value">{(gameState.discoveredCombos || []).length}/?</span>
								</div>
								<div class="stat-row">
									<span class="stat-label">Pentagon bursts</span>
									<span class="stat-value">{gameState.stats.pentagonBursts || 0}</span>
								</div>
								<div class="stat-row">
									<span class="stat-label">Puzzles solved</span>
									<span class="stat-value">{gameState.solvedPuzzles?.length || 0}</span>
								</div>
							</div>
						</div>

					{:else if tab === 'info'}
						<div class="sub-panel">
							<button class="back-btn" onclick={() => (tab = 'main')}>← BACK</button>
							<div class="info-content">
								<img src="{base}/assets/ui/5%20Logo/Logo1.png" alt="Polysnaps" class="info-logo-img" />
								<div class="info-logo">POLYSNAPS</div>
								<p class="info-tagline">Snap. Flow. Grow.</p>
								<div class="info-divider"></div>
								<p class="info-text">
									Build a cascading network of shapes.
									Each shape generates resources that flow
									toward the core. Prestige to evolve your
									core and unlock new shape types.
								</p>
								<div class="info-divider"></div>
								<p class="info-credits">
									UI: Cyberpunk Pixel Art GUI by CraftPix
								</p>
								<p class="info-version">v0.1.0</p>
							</div>
						</div>
					{/if}
				</div>
			</CyberPanel>

			<div class="menu-decor left">
				<img src="{base}/assets/ui/9%20Other/1%20Decor/1.png" alt="" />
			</div>
			<div class="menu-decor right">
				<img src="{base}/assets/ui/9%20Other/1%20Decor/3.png" alt="" />
			</div>
		</div>
	</div>
{/if}

<style>
	.menu-overlay {
		position: fixed;
		inset: 0;
		background: rgba(5, 5, 15, 0.88);
		z-index: 200;
		display: flex;
		align-items: center;
		justify-content: center;
		animation: fade-in 0.15s ease-out;
		backdrop-filter: blur(6px);
	}

	.menu-container {
		position: relative;
		width: 380px;
		max-width: 92vw;
		animation: slide-in 0.2s ease-out;
	}

	.menu-body {
		padding: 14px;
		min-height: 200px;
	}

	.menu-buttons {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.save-row {
		display: flex;
		gap: 6px;
	}

	.save-row > :global(button) {
		flex: 1;
	}

	.menu-decor {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		image-rendering: pixelated;
		opacity: 0.6;
	}

	.menu-decor.left {
		right: 100%;
		margin-right: 8px;
	}

	.menu-decor.right {
		left: 100%;
		margin-left: 8px;
	}

	.menu-decor img {
		width: 28px;
		height: auto;
		image-rendering: pixelated;
	}

	.sub-panel {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.back-btn {
		align-self: flex-start;
		background: transparent;
		border: none;
		font-family: var(--font-pixel);
		font-size: 10px;
		color: var(--color-accent);
		cursor: pointer;
		padding: 6px 2px;
		transition: color 0.15s;
	}

	.back-btn:hover {
		color: #bbddff;
	}

	.settings-grid, .stats-grid {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.setting-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8px 12px;
		background: rgba(255,255,255,0.02);
		border: 1px solid #2a3058;
		border-radius: 4px;
	}

	.setting-row.danger {
		border-color: #4a2030;
	}

	.setting-label {
		font-family: var(--font-pixel);
		font-size: 10px;
		color: var(--color-text);
	}

	.setting-value {
		font-family: var(--font-pixel);
		font-size: 10px;
		color: var(--color-text-dim);
	}

	.volume-control {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.volume-slider {
		width: 100px;
		height: 8px;
		-webkit-appearance: none;
		appearance: none;
		background: #1a1f40;
		border-radius: 4px;
		border: 1px solid var(--color-border);
		outline: none;
	}

	.volume-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		width: 16px;
		height: 16px;
		border-radius: 3px;
		background: var(--color-accent);
		cursor: pointer;
		border: 2px solid #4a6090;
	}

	.volume-slider::-moz-range-thumb {
		width: 16px;
		height: 16px;
		border-radius: 3px;
		background: var(--color-accent);
		cursor: pointer;
		border: 2px solid #4a6090;
	}

	.volume-pct {
		font-family: var(--font-pixel);
		font-size: 9px;
		color: var(--color-text-dim);
		min-width: 32px;
		text-align: right;
	}

	.divider {
		height: 1px;
		background: var(--color-border);
		margin: 2px 0;
	}

	.stat-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 7px 10px;
		border-bottom: 1px solid #1c2248;
	}

	.stat-row:last-child {
		border-bottom: none;
	}

	.stat-label {
		font-family: var(--font-pixel);
		font-size: 10px;
		color: var(--color-text-dim);
	}

	.stat-value {
		font-family: var(--font-pixel);
		font-size: 11px;
		color: var(--color-text);
	}

	.stat-value.gold { color: var(--color-gold); }

	.info-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
		text-align: center;
		padding: 10px 0;
	}

	.info-logo-img {
		width: 64px;
		height: auto;
		image-rendering: pixelated;
		filter: drop-shadow(0 0 8px rgba(136, 170, 255, 0.4));
	}

	.info-logo {
		font-family: var(--font-pixel);
		font-size: 16px;
		color: var(--color-accent);
		text-shadow: 0 0 16px rgba(136, 170, 255, 0.5);
		letter-spacing: 4px;
	}

	.info-tagline {
		font-family: var(--font-pixel);
		font-size: 10px;
		color: var(--color-text-dim);
		font-style: italic;
	}

	.info-divider {
		width: 60%;
		height: 1px;
		background: var(--color-border);
	}

	.info-text {
		font-family: var(--font-pixel);
		font-size: 9px;
		color: var(--color-text-dim);
		line-height: 2;
		max-width: 280px;
	}

	.info-credits {
		font-family: var(--font-pixel);
		font-size: 8px;
		color: var(--color-text-dim);
		opacity: 0.7;
	}

	.info-version {
		font-family: var(--font-pixel);
		font-size: 8px;
		color: var(--color-text-dim);
		opacity: 0.5;
	}

	@keyframes fade-in {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	@keyframes slide-in {
		from {
			opacity: 0;
			transform: translateY(-10px) scale(0.97);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	.theme-btns {
		display: flex;
		gap: 4px;
	}

	.theme-btn {
		font-family: var(--font-pixel);
		font-size: 8px;
		color: var(--color-text-dim);
		background: rgba(255,255,255,0.03);
		border: 1px solid var(--color-border);
		border-radius: 3px;
		padding: 4px 8px;
		cursor: pointer;
		transition: border-color 0.15s, color 0.15s, background 0.15s;
	}

	.theme-btn:hover {
		border-color: var(--color-accent);
		color: var(--color-text);
	}

	.theme-btn.active {
		border-color: var(--color-accent);
		color: var(--color-accent);
		background: rgba(100,140,255,0.1);
	}
</style>
