<script>
	import { gameState, unlockSkill } from '$lib/game/state.svelte.js';
	import { SKILL_DEFS, canUnlockSkill, getSkillCost, getSkillConnections, getVisibility } from '$lib/game/skills.js';

	let { onclose } = $props();

	let hoveredSkill = $state(null);
	let panX = $state(0);
	let panY = $state(0);
	let isPanning = $state(false);
	let lastMouse = $state({ x: 0, y: 0 });
	let dragMoved = $state(false);

	const GRID = 120;
	const NODE_R = 30;

	let visibility = $derived(getVisibility(gameState.skills));
	let connections = getSkillConnections();

	let totalPoints = $derived(
		SKILL_DEFS.reduce((sum, s) => sum + (gameState.skills[s.id] || 0), 0)
	);

	function nodeX(def) { return 300 + def.x * GRID; }
	function nodeY(def) { return 80 + def.y * GRID; }

	function handleUnlock(skillId) {
		if (dragMoved) return;
		if (canUnlockSkill(gameState.skills, skillId)) {
			const cost = getSkillCost(gameState.skills, skillId);
			if (gameState.prestige.currency >= cost) {
				unlockSkill(skillId);
			}
		}
	}

	function handleCanvasMouseDown(e) {
		if (e.target.closest('.skill-node-g')) return;
		isPanning = true;
		dragMoved = false;
		lastMouse = { x: e.clientX, y: e.clientY };
	}

	function handleCanvasMouseMove(e) {
		if (isPanning) {
			const dx = e.clientX - lastMouse.x;
			const dy = e.clientY - lastMouse.y;
			if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragMoved = true;
			panX += dx;
			panY += dy;
			lastMouse = { x: e.clientX, y: e.clientY };
		}
	}

	function handleCanvasMouseUp() {
		isPanning = false;
	}
</script>

<div class="skill-overlay">
	<div class="skill-header">
		<div class="header-left">
			<span class="header-title">SKILL TREE</span>
			<span class="header-sub">{totalPoints} invested · 🔮 {gameState.prestige.currency} available</span>
		</div>
		<button class="close-btn" onclick={onclose}>✕</button>
	</div>

	<div
		class="skill-canvas"
		onmousedown={handleCanvasMouseDown}
		onmousemove={handleCanvasMouseMove}
		onmouseup={handleCanvasMouseUp}
		onmouseleave={handleCanvasMouseUp}
		role="presentation"
	>
		<svg
			class="skill-svg"
			style="transform: translate({panX}px, {panY}px);"
			viewBox="0 0 700 600"
		>
			{#each connections as conn}
				{@const fromVis = visibility[conn.from.id]}
				{@const toVis = visibility[conn.to.id]}
				{@const bothActive = (gameState.skills[conn.from.id] || 0) > 0 && (gameState.skills[conn.to.id] || 0) > 0}
				{@const anyVisible = fromVis && toVis}
				{#if anyVisible}
					<line
						x1={nodeX(conn.from)} y1={nodeY(conn.from)}
						x2={nodeX(conn.to)} y2={nodeY(conn.to)}
						class="skill-edge"
						class:active={bothActive}
						class:foggy={fromVis === 'foggy' || toVis === 'foggy'}
					/>
				{/if}
			{/each}

			{#each SKILL_DEFS as def}
				{@const vis = visibility[def.id]}
				{@const level = gameState.skills[def.id] || 0}
				{@const cost = getSkillCost(gameState.skills, def.id)}
				{@const canDo = canUnlockSkill(gameState.skills, def.id) && gameState.prestige.currency >= cost}
				{@const maxed = level >= def.maxLevel}
				{#if vis}
					<g
						class="skill-node-g"
						transform="translate({nodeX(def)}, {nodeY(def)})"
						class:can-unlock={canDo && !maxed}
						class:maxed
						class:foggy={vis === 'foggy'}
						onclick={() => handleUnlock(def.id)}
						onkeydown={(e) => e.key === 'Enter' && handleUnlock(def.id)}
						onmouseenter={() => (hoveredSkill = def.id)}
						onmouseleave={() => (hoveredSkill = null)}
						role="button"
						tabindex="0"
					>
					{#if vis === 'foggy'}
						<circle r={NODE_R} class="node-bg foggy-bg" />
						<text y="5" class="foggy-icon">?</text>
					{:else}
						<circle r={NODE_R} class="node-bg" class:node-unlocked={level > 0} class:node-maxed={maxed} />
						{#if level > 0}
							<circle r={NODE_R + 4} class="node-glow" />
						{/if}
						{#if def.iconFrame}
							<image
								x={-NODE_R + 2} y={-NODE_R + 2}
								width={(NODE_R - 2) * 2} height={(NODE_R - 2) * 2}
								href={def.iconFrame}
								class="node-frame"
							/>
						{/if}
						{#if def.iconPath}
							<image
								x={-NODE_R + 6} y={-NODE_R + 6}
								width={(NODE_R - 6) * 2} height={(NODE_R - 6) * 2}
								href={def.iconPath}
								class="node-icon-img"
							/>
						{:else}
							<text y="-2" class="node-icon">{def.icon}</text>
						{/if}
						{#if level > 0}
							<text y={NODE_R + 14} class="node-level">{level}/{def.maxLevel}</text>
						{:else}
							<text y={NODE_R + 14} class="node-cost">🔮{cost}</text>
						{/if}
					{/if}
					</g>
				{/if}
			{/each}
		</svg>
	</div>

	{#if hoveredSkill}
		{@const def = SKILL_DEFS.find((s) => s.id === hoveredSkill)}
		{@const vis = visibility[hoveredSkill]}
		{@const level = gameState.skills[hoveredSkill] || 0}
		{@const cost = getSkillCost(gameState.skills, hoveredSkill)}
		{@const canDo = canUnlockSkill(gameState.skills, hoveredSkill) && gameState.prestige.currency >= cost}
		{#if def && vis !== 'foggy'}
			<div class="skill-tooltip">
			<div class="tt-header">
				{#if def.iconPath}
					<img src={def.iconPath} alt="" class="tt-icon-img" />
				{:else}
					<span class="tt-icon">{def.icon}</span>
				{/if}
				<span class="tt-name">{def.name}</span>
			</div>
				<span class="tt-desc">{def.description}</span>
				<span class="tt-level">Level {level} / {def.maxLevel}</span>
				{#if level < def.maxLevel}
					<span class="tt-cost" class:affordable={canDo}>
						Next: 🔮 {cost}
					</span>
				{:else}
					<span class="tt-maxed">MAXED</span>
				{/if}
				{#if def.requires}
					{@const reqDef = SKILL_DEFS.find((s) => s.id === def.requires)}
					{#if reqDef && !(gameState.skills[def.requires])}
						<span class="tt-req">Requires: {reqDef.name}</span>
					{/if}
				{/if}
			</div>
		{/if}
	{/if}
</div>

<style>
	.skill-overlay {
		position: fixed;
		inset: 0;
		z-index: 10000;
		background:
			repeating-linear-gradient(
				0deg,
				transparent,
				transparent 39px,
				rgba(51, 51, 90, 0.04) 39px,
				rgba(51, 51, 90, 0.04) 40px
			),
			repeating-linear-gradient(
				90deg,
				transparent,
				transparent 39px,
				rgba(51, 51, 90, 0.04) 39px,
				rgba(51, 51, 90, 0.04) 40px
			),
			rgba(5, 5, 15, 0.98);
		display: flex;
		flex-direction: column;
		animation: overlay-in 0.15s steps(3);
	}

	.skill-header {
		padding: 1rem 1.5rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 1px solid rgba(51, 51, 90, 0.5);
		flex-shrink: 0;
		background: rgba(22, 22, 46, 0.6);
	}

	.header-left {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.header-title {
		font-size: 0.8rem;
		color: #aa44ff;
		letter-spacing: 5px;
		font-family: var(--font-pixel);
	}

	.header-sub {
		font-size: 0.5rem;
		color: var(--color-text-dim);
		font-family: var(--font-pixel);
	}

	.close-btn {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 4px;
		color: var(--color-text-dim);
		font-size: 1rem;
		cursor: pointer;
		padding: 6px 10px;
		font-family: var(--font-pixel);
	}

	.close-btn:hover {
		color: var(--color-red);
		filter: brightness(1.3);
	}

	.close-btn:active {
		transform: translate(1px, 1px);
	}

	.skill-canvas {
		flex: 1;
		overflow: hidden;
		cursor: grab;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.skill-canvas:active {
		cursor: grabbing;
	}

	.skill-svg {
		width: 100%;
		height: 100%;
		max-width: 700px;
		max-height: 600px;
		overflow: visible;
		shape-rendering: crispEdges;
	}

	.skill-edge {
		stroke: var(--color-border);
		stroke-width: 2;
		opacity: 0.3;
	}

	.skill-edge.active {
		stroke: #aa44ff;
		opacity: 0.7;
	}

	.skill-edge.foggy {
		opacity: 0.08;
		stroke-dasharray: 4 6;
	}

	.skill-node-g {
		cursor: pointer;
	}

	.skill-node-g:hover {
		filter: brightness(1.3);
	}

	.skill-node-g.foggy {
		cursor: default;
		opacity: 0.15;
	}

	.skill-node-g.foggy:hover {
		filter: none;
	}

	.node-bg {
		fill: var(--color-bg);
		stroke: var(--color-border);
		stroke-width: 3;
	}

	.foggy-bg {
		fill: rgba(10, 10, 20, 0.5);
		stroke: rgba(80, 80, 120, 0.15);
		stroke-dasharray: 4 4;
	}

	.node-bg.node-unlocked {
		stroke: #aa44ff;
		fill: rgba(170, 68, 255, 0.12);
	}

	.node-bg.node-maxed {
		stroke: var(--color-gold);
		fill: rgba(255, 221, 85, 0.08);
	}

	.skill-node-g.can-unlock .node-bg {
		stroke: #aa44ff;
		animation: node-blink 1.5s steps(2) infinite;
	}

	.node-glow {
		fill: none;
		stroke: #aa44ff;
		stroke-width: 2;
		opacity: 0.2;
		pointer-events: none;
	}

	.node-icon {
		font-size: 20px;
		text-anchor: middle;
		pointer-events: none;
	}

	.node-frame,
	.node-icon-img {
		image-rendering: pixelated;
		pointer-events: none;
	}

	.foggy-icon {
		font-size: 16px;
		fill: var(--color-text-dim);
		text-anchor: middle;
		opacity: 0.25;
		pointer-events: none;
		font-family: var(--font-pixel);
	}

	.node-level {
		font-family: var(--font-pixel);
		font-size: 8px;
		fill: #aa44ff;
		text-anchor: middle;
		pointer-events: none;
	}

	.node-cost {
		font-family: var(--font-pixel);
		font-size: 7px;
		fill: var(--color-text-dim);
		text-anchor: middle;
		pointer-events: none;
	}

	.skill-tooltip {
		position: fixed;
		bottom: 2rem;
		left: 50%;
		transform: translateX(-50%);
		background: var(--color-surface);
		border: 1px solid #aa44ff;
		border-radius: 6px;
		padding: 12px 16px;
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 220px;
		animation: tt-in 0.1s ease-out;
		z-index: 10010;
		font-family: var(--font-pixel);
	}

	.tt-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.tt-icon {
		font-size: 1rem;
	}

	.tt-icon-img {
		width: 28px;
		height: 28px;
		image-rendering: pixelated;
	}

	.tt-name {
		font-size: 0.6rem;
		color: var(--color-text);
	}

	.tt-desc {
		font-size: 0.5rem;
		color: var(--color-text-dim);
	}

	.tt-level {
		font-size: 0.5rem;
		color: #aa44ff;
	}

	.tt-cost {
		font-size: 0.55rem;
		color: var(--color-text-dim);
	}

	.tt-cost.affordable {
		color: var(--color-gold);
	}

	.tt-maxed {
		font-size: 0.55rem;
		color: var(--color-gold);
		letter-spacing: 3px;
	}

	.tt-req {
		font-size: 0.45rem;
		color: var(--color-red);
	}

	@keyframes overlay-in {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	@keyframes tt-in {
		from { opacity: 0; transform: translateX(-50%) translateY(4px); }
		to { opacity: 1; transform: translateX(-50%) translateY(0); }
	}

	@keyframes node-blink {
		0%, 100% { stroke-opacity: 0.4; }
		50% { stroke-opacity: 1; }
	}
</style>
