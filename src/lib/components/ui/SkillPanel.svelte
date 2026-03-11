<script>
	import { gameState } from '$lib/game/state.svelte.js';
	import { SKILL_DEFS } from '$lib/game/skills.js';

	let { open = $bindable(false) } = $props();

	let totalPoints = $derived(
		SKILL_DEFS.reduce((sum, s) => sum + (gameState.skills[s.id] || 0), 0)
	);
</script>

<button class="skill-toggle game-panel" onclick={() => (open = true)}>
	<span class="toggle-icon">✦</span>
	<span class="toggle-label">SKILL TREE</span>
	<span class="toggle-points">{gameState.prestige.currency} pts</span>
</button>

<style>
	.skill-toggle {
		width: 100%;
		padding: 10px 12px;
		display: flex;
		align-items: center;
		gap: 8px;
		cursor: pointer;
		font-family: var(--font-pixel);
		color: var(--color-text);
	}

	.skill-toggle:hover {
		background: var(--color-surface-hover);
	}

	.skill-toggle:active {
		transform: translate(1px, 1px);
	}

	.toggle-icon {
		font-size: 12px;
		color: #aa44ff;
	}

	.toggle-label {
		font-size: 10px;
		color: #aa44ff;
		letter-spacing: 2px;
	}

	.toggle-points {
		font-size: 9px;
		color: var(--color-gold);
		margin-left: auto;
	}
</style>
