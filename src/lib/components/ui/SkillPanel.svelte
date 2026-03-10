<script>
	import { gameState } from '$lib/game/state.svelte.js';
	import { SKILL_DEFS } from '$lib/game/skills.js';

	let { open = $bindable(false) } = $props();

	let totalPoints = $derived(
		SKILL_DEFS.reduce((sum, s) => sum + (gameState.skills[s.id] || 0), 0)
	);
</script>

<button class="skill-toggle game-panel" onclick={() => (open = true)}>
	<span class="toggle-label">SKILLS</span>
	<span class="toggle-points">{gameState.prestige.currency} pts</span>
</button>

<style>
	.skill-toggle {
		width: 100%;
		padding: 8px 10px;
		display: flex;
		align-items: center;
		gap: 6px;
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

	.toggle-label {
		font-size: 8px;
		color: #aa44ff;
		letter-spacing: 2px;
	}

	.toggle-points {
		font-size: 7px;
		color: var(--color-gold);
		margin-left: auto;
	}
</style>
