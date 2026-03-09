<script>
	import { gameState, unlockSkill } from '$lib/game/state.svelte.js';
	import { SKILL_DEFS, canUnlockSkill, getSkillCost, getSkillConnections, getVisibility } from '$lib/game/skills.js';

	let { open = $bindable(false) } = $props();

	let hoveredSkill = $state(null);
	let panX = $state(0);
	let panY = $state(0);
	let isPanning = $state(false);
	let lastMouse = $state({ x: 0, y: 0 });
	let dragMoved = $state(false);

	const GRID = 110;
	const NODE_R = 28;

	let visibility = $derived(getVisibility(gameState.skills));
	let connections = getSkillConnections();

	let totalPoints = $derived(
		SKILL_DEFS.reduce((sum, s) => sum + (gameState.skills[s.id] || 0), 0)
	);

	function nodeX(def) { return def.x * GRID; }
	function nodeY(def) { return def.y * GRID; }

	function handleUnlock(skillId) {
		if (dragMoved) return;
		if (canUnlockSkill(gameState.skills, skillId)) {
			const cost = getSkillCost(gameState.skills, skillId);
			if (gameState.prestige.currency >= cost) {
				unlockSkill(skillId);
			}
		}
	}

	function handleMouseDown(e) {
		isPanning = true;
		dragMoved = false;
		lastMouse = { x: e.clientX, y: e.clientY };
	}

	function handleMouseMove(e) {
		if (isPanning) {
			const dx = e.clientX - lastMouse.x;
			const dy = e.clientY - lastMouse.y;
			if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragMoved = true;
			panX += dx;
			panY += dy;
			lastMouse = { x: e.clientX, y: e.clientY };
		}
	}

	function handleMouseUp() {
		isPanning = false;
	}
</script>

<button class="skill-toggle" onclick={() => (open = true)}>
	<span class="toggle-icon">🔮</span>
	<span class="toggle-label">SKILLS</span>
	<span class="toggle-points">{gameState.prestige.currency} pts</span>
</button>

<style>
	.skill-toggle {
		width: 100%;
		padding: 0.5rem 0.7rem;
		display: flex;
		align-items: center;
		gap: 0.4rem;
		background: var(--color-bg);
		border: 2px solid var(--color-border);
		cursor: pointer;
		font-family: var(--font-pixel);
		box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.4);
		color: var(--color-text);
	}

	.skill-toggle:hover {
		border-color: #aa44ff;
		background: rgba(170, 68, 255, 0.06);
	}

	.skill-toggle:active {
		transform: translate(2px, 2px);
		box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.4);
	}

	.toggle-icon {
		font-size: 0.75rem;
	}

	.toggle-label {
		font-size: 0.55rem;
		color: #aa44ff;
		letter-spacing: 2px;
	}

	.toggle-points {
		font-size: 0.5rem;
		color: var(--color-gold);
		margin-left: auto;
	}
</style>
