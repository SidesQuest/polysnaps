<script>
	import { gameState, unlockSkill, canAffordSkill } from '$lib/game/state.svelte.js';
	import { RESOURCE_DEFS } from '$lib/game/state.svelte.js';
	import {
		SKILL_DEFS, BRANCH_DEFS,
		canUnlockSkill, getSkillCost, getSkillConnections,
		getVisibility, getVisibleSkills, getSkillPosition,
		getSkillDef,
	} from '$lib/game/skills.js';

	let { onclose } = $props();

	let hoveredSkill = $state(null);
	let panX = $state(0);
	let panY = $state(0);
	let zoom = $state(1);
	let isPanning = $state(false);
	let lastMouse = $state({ x: 0, y: 0 });
	let dragMoved = $state(false);
	let svgEl = $state(null);

	const NODE_R = 28;
	const NODE_W = 52;
	const NODE_H = 52;
	const prestige = $derived(gameState.prestige.level);

	let visibility = $derived(getVisibility(gameState.skills, prestige));
	let connections = $derived(getSkillConnections(prestige));
	let visibleSkills = $derived(getVisibleSkills(prestige));

	let totalPoints = $derived(
		SKILL_DEFS.reduce((sum, s) => sum + (gameState.skills[s.id] || 0), 0)
	);

	let visibleBranches = $derived(
		BRANCH_DEFS.filter(b => prestige >= b.minPrestige)
	);

	function pos(def) {
		return getSkillPosition(def, prestige);
	}

	function getCostIcon(costType) {
		if (costType === 'prestige') return '🔮';
		const res = RESOURCE_DEFS[costType];
		return res ? res.icon : '?';
	}

	function getCostColor(costType) {
		if (costType === 'prestige') return '#aa44ff';
		const res = RESOURCE_DEFS[costType];
		return res ? res.color : '#888';
	}

	function handleUnlock(skillId) {
		if (dragMoved) return;
		if (canUnlockSkill(gameState.skills, skillId, prestige) && canAffordSkill(skillId)) {
			unlockSkill(skillId);
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

	function handleWheel(e) {
		e.preventDefault();
		const delta = e.deltaY > 0 ? 0.9 : 1.1;
		zoom = Math.max(0.3, Math.min(3, zoom * delta));
	}

	function mountSvg(el) {
		svgEl = el;
		el.addEventListener('wheel', handleWheel, { passive: false });
		return {
			destroy() {
				el.removeEventListener('wheel', handleWheel);
			}
		};
	}
</script>

<div class="skill-overlay">
	<div class="skill-header">
		<div class="header-left">
			<span class="header-title">SKILL TREE</span>
			<span class="header-sub">{totalPoints} invested · 🔮 {gameState.prestige.currency} Cores</span>
		</div>
		<div class="header-right">
			<div class="branch-tags">
				{#each visibleBranches as branch}
					<span class="branch-tag" style="color: {branch.color}; border-color: {branch.color}44;">
						{branch.icon} {branch.name}
					</span>
				{/each}
			</div>
			<button class="close-btn" onclick={onclose}>✕</button>
		</div>
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
			use:mountSvg
			viewBox="-700 -700 1400 1400"
			style="transform: translate({panX}px, {panY}px) scale({zoom});"
		>
			{#each [140, 280, 420, 560, 700] as ringR}
				<circle cx="0" cy="0" r={ringR} class="ring-guide" />
			{/each}

			{#each visibleBranches as branch, i}
				{@const angle = (2 * Math.PI * i) / visibleBranches.length - Math.PI / 2}
				{@const lx = 590 * Math.cos(angle)}
				{@const ly = 590 * Math.sin(angle)}
				<line x1="0" y1="0" x2={lx} y2={ly} class="branch-line" stroke={branch.color} />
				<text
					x={620 * Math.cos(angle)}
					y={620 * Math.sin(angle) + 4}
					class="branch-label"
					fill={branch.color}
				>{branch.icon} {branch.name}</text>
			{/each}

			{#each connections as conn}
				{@const fromPos = pos(conn.from)}
				{@const toPos = pos(conn.to)}
				{@const fromVis = visibility[conn.from.id]}
				{@const toVis = visibility[conn.to.id]}
				{@const bothActive = (gameState.skills[conn.from.id] || 0) > 0 && (gameState.skills[conn.to.id] || 0) > 0}
				{#if fromPos && toPos && fromVis && toVis}
					<line
						x1={fromPos.x} y1={fromPos.y}
						x2={toPos.x} y2={toPos.y}
						class="skill-edge"
						class:active={bothActive}
						class:foggy={fromVis === 'foggy' || toVis === 'foggy'}
					/>
				{/if}
			{/each}

			{#each visibleSkills as def}
				{@const p = pos(def)}
				{@const vis = visibility[def.id]}
				{@const level = gameState.skills[def.id] || 0}
				{@const cost = getSkillCost(gameState.skills, def.id)}
				{@const canDo = canUnlockSkill(gameState.skills, def.id, prestige) && canAffordSkill(def.id)}
				{@const maxed = level >= def.maxLevel}
				{@const isRepeatable = def.repeatable}
				{@const branchDef = def.branch >= 0 ? BRANCH_DEFS.find(b => b.id === def.branch) : null}
				{@const nodeColor = branchDef ? branchDef.color : '#44aaff'}
				{#if p && vis}
					<g
						class="skill-node-g"
						transform="translate({p.x}, {p.y})"
						class:can-unlock={canDo && !maxed}
						class:maxed
						class:repeatable={isRepeatable}
						class:foggy={vis === 'foggy'}
						onclick={() => handleUnlock(def.id)}
						onkeydown={(e) => e.key === 'Enter' && handleUnlock(def.id)}
						onmouseenter={() => (hoveredSkill = def.id)}
						onmouseleave={() => (hoveredSkill = null)}
						role="button"
						tabindex="0"
					>
						{#if vis === 'foggy'}
							<rect x={-NODE_W/2} y={-NODE_H/2} width={NODE_W} height={NODE_H} rx="4" class="node-bg foggy-bg" />
							<text y="5" class="foggy-icon">?</text>
						{:else}
							<rect x={-NODE_W/2} y={-NODE_H/2} width={NODE_W} height={NODE_H} rx="4" class="node-bg"
								class:node-unlocked={level > 0}
								class:node-maxed={maxed}
								class:node-locked={level === 0 && !canDo && !maxed}
								style={level > 0 ? `stroke: ${nodeColor};` : canDo && !maxed ? `stroke: ${nodeColor}; stroke-width: 3;` : ''}
							/>
							{#if level > 0}
								<rect x={-NODE_W/2 - 3} y={-NODE_H/2 - 3} width={NODE_W + 6} height={NODE_H + 6} rx="6" class="node-glow" style="stroke: {nodeColor};" />
							{/if}
						{#if def.iconPath}
							<image
								x={-16} y={-18}
								width="32" height="32"
								href={def.iconPath}
								class="node-icon-img"
							/>
						{/if}
						{#if level > 0}
							<text y={NODE_H/2 + 14} class="node-level" fill={nodeColor}>{level}/{def.maxLevel}</text>
						{:else}
							<text y={NODE_H/2 + 14} class="node-cost" fill={getCostColor(def.costType)} class:cost-affordable={canDo}>
								{getCostIcon(def.costType)}{cost}
							</text>
						{/if}
						{/if}
					</g>
				{/if}
			{/each}
		</svg>
	</div>

	{#if hoveredSkill}
		{@const def = getSkillDef(hoveredSkill)}
		{@const vis = visibility[hoveredSkill]}
		{@const level = gameState.skills[hoveredSkill] || 0}
		{@const cost = getSkillCost(gameState.skills, hoveredSkill)}
		{@const canDo = canUnlockSkill(gameState.skills, hoveredSkill, prestige) && canAffordSkill(hoveredSkill)}
		{@const branchDef = def.branch >= 0 ? BRANCH_DEFS.find(b => b.id === def.branch) : null}
		{@const totalEffect = (def.effect.value * Math.max(level, 1) * 100).toFixed(0)}
		{#if def && vis !== 'foggy'}
			<div class="skill-tooltip" style="border-color: {branchDef?.color || '#44aaff'};">
				<div class="tt-header">
					{#if def.iconPath}
						<img src={def.iconPath} alt="" class="tt-icon-img" />
					{/if}
					<div class="tt-header-text">
						<span class="tt-name">{def.name}</span>
						{#if branchDef}
							<span class="tt-branch" style="color: {branchDef.color};">{branchDef.icon} {branchDef.name}</span>
						{/if}
					</div>
				</div>
				<span class="tt-desc">{def.description}</span>
				{#if level > 0}
					<span class="tt-effect">Total: +{totalEffect}%</span>
				{/if}
				<span class="tt-level" style="color: {branchDef?.color || '#aa44ff'};">
					Level {level} / {def.maxLevel}
				</span>
				{#if level < def.maxLevel}
					<span class="tt-cost" class:affordable={canDo}>
						Next: <span style="color: {getCostColor(def.costType)};">{getCostIcon(def.costType)} {cost}</span>
					</span>
				{:else}
					<span class="tt-maxed">MAXED</span>
				{/if}
				{#if def.requires}
					{@const reqDef = getSkillDef(def.requires)}
					{#if reqDef && !(gameState.skills[def.requires])}
						<span class="tt-req">Requires: {reqDef.name}</span>
					{/if}
				{/if}
				{#if def.unlocks}
					<span class="tt-unlock">Unlocks: {def.unlocks.replace(/_/g, ' ')}</span>
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
		background-color: rgba(8, 8, 20, 0.98);
		background-image:
			radial-gradient(circle, rgba(100, 60, 180, 0.06) 1px, transparent 1px),
			radial-gradient(ellipse at 30% 40%, rgba(100, 40, 200, 0.08) 0%, transparent 50%),
			radial-gradient(ellipse at 70% 60%, rgba(40, 100, 200, 0.06) 0%, transparent 50%);
		background-size: 20px 20px, 100% 100%, 100% 100%;
		display: flex;
		flex-direction: column;
		animation: overlay-in 0.15s steps(3);
	}

	.skill-header {
		padding: 0.8rem 1.2rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 1px solid rgba(100, 60, 180, 0.3);
		flex-shrink: 0;
		background: rgba(15, 12, 30, 0.7);
	}

	.header-left {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: 1.2rem;
	}

	.branch-tags {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}

	.branch-tag {
		font-family: var(--font-pixel);
		font-size: 10px;
		padding: 5px 12px;
		border: 1px solid;
		border-radius: 4px;
		opacity: 0.85;
	}

	.header-title {
		font-size: 18px;
		color: #bb66ff;
		letter-spacing: 5px;
		font-family: var(--font-pixel);
		text-shadow: 0 0 16px rgba(170, 68, 255, 0.5);
	}

	.header-sub {
		font-size: 11px;
		color: var(--color-text-dim);
		font-family: var(--font-pixel);
	}

	.close-btn {
		background: var(--color-surface);
		border: 2px solid var(--color-border);
		border-radius: 6px;
		color: var(--color-text-dim);
		font-size: 16px;
		cursor: pointer;
		padding: 10px 16px;
		font-family: var(--font-pixel);
		min-width: 44px;
		min-height: 44px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: color 0.15s, border-color 0.15s;
	}

	.close-btn:hover {
		color: var(--color-red);
		border-color: var(--color-red);
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
		overflow: visible;
		shape-rendering: crispEdges;
		transform-origin: center center;
	}

	.ring-guide {
		fill: none;
		stroke: rgba(100, 60, 180, 0.12);
		stroke-width: 1;
		pointer-events: none;
	}

	.branch-line {
		stroke-width: 1;
		opacity: 0.1;
		pointer-events: none;
	}

	.branch-label {
		font-family: var(--font-pixel);
		font-size: 11px;
		text-anchor: middle;
		opacity: 0.6;
		pointer-events: none;
	}

	.skill-edge {
		stroke: var(--color-border);
		stroke-width: 2;
		opacity: 0.3;
		pointer-events: none;
	}

	.skill-edge.active {
		stroke: #aa44ff;
		opacity: 0.65;
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
		opacity: 0.12;
	}

	.skill-node-g.foggy:hover {
		filter: none;
	}

	.node-bg {
		fill: var(--color-bg);
		stroke: var(--color-border);
		stroke-width: 2;
	}

	.foggy-bg {
		fill: rgba(10, 10, 20, 0.5);
		stroke: rgba(80, 80, 120, 0.15);
		stroke-dasharray: 4 4;
	}

	.node-bg.node-unlocked {
		fill: rgba(170, 68, 255, 0.12);
		stroke-width: 2.5;
	}

	.node-bg.node-maxed {
		stroke: var(--color-gold) !important;
		fill: rgba(255, 221, 85, 0.1);
		stroke-width: 2.5;
	}

	.node-bg.node-locked {
		fill: rgba(10, 10, 20, 0.7);
		stroke: rgba(60, 60, 90, 0.4);
		stroke-width: 1.5;
	}

	.skill-node-g.repeatable .node-bg {
		stroke-dasharray: 4 3;
	}

	.skill-node-g.repeatable.maxed .node-bg {
		stroke-dasharray: none;
	}

	.skill-node-g.can-unlock .node-bg {
		animation: node-blink 1.5s ease-in-out infinite;
		filter: drop-shadow(0 0 6px rgba(170, 68, 255, 0.5));
	}

	.node-glow {
		fill: none;
		stroke-width: 2;
		opacity: 0.25;
		pointer-events: none;
	}

	.node-icon-img {
		image-rendering: pixelated;
		pointer-events: none;
	}

	.foggy-icon {
		font-size: 14px;
		fill: var(--color-text-dim);
		text-anchor: middle;
		opacity: 0.3;
		pointer-events: none;
		font-family: var(--font-pixel);
	}

	.node-level {
		font-family: var(--font-pixel);
		font-size: 9px;
		text-anchor: middle;
		pointer-events: none;
	}

	.node-cost {
		font-family: var(--font-pixel);
		font-size: 9px;
		text-anchor: middle;
		pointer-events: none;
		opacity: 0.55;
	}

	.node-cost.cost-affordable {
		opacity: 1;
		font-size: 10px;
	}

	.skill-tooltip {
		position: fixed;
		bottom: 1.5rem;
		left: 50%;
		transform: translateX(-50%);
		background: var(--color-surface);
		border: 2px solid #aa44ff;
		border-radius: 8px;
		padding: 14px 18px;
		display: flex;
		flex-direction: column;
		gap: 6px;
		min-width: 260px;
		max-width: 360px;
		animation: tt-in 0.1s ease-out;
		z-index: 10010;
		font-family: var(--font-pixel);
		box-shadow: 0 8px 24px rgba(0,0,0,0.5);
	}

	.tt-header {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}

	.tt-header-text {
		display: flex;
		flex-direction: column;
		gap: 3px;
	}

	.tt-icon-img {
		width: 32px;
		height: 32px;
		image-rendering: pixelated;
	}

	.tt-name {
		font-size: 11px;
		color: var(--color-text);
	}

	.tt-branch {
		font-size: 9px;
	}

	.tt-desc {
		font-size: 9px;
		color: var(--color-text-dim);
		line-height: 1.5;
	}

	.tt-effect {
		font-size: 10px;
		color: var(--color-green);
	}

	.tt-level {
		font-size: 10px;
	}

	.tt-cost {
		font-size: 10px;
		color: var(--color-text-dim);
	}

	.tt-cost.affordable {
		color: var(--color-text);
	}

	.tt-maxed {
		font-size: 11px;
		color: var(--color-gold);
		letter-spacing: 3px;
	}

	.tt-req {
		font-size: 9px;
		color: var(--color-red);
	}

	.tt-unlock {
		font-size: 9px;
		color: var(--color-green);
		text-transform: uppercase;
		letter-spacing: 1px;
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
		0%, 100% { stroke-opacity: 0.6; filter: drop-shadow(0 0 4px rgba(170, 68, 255, 0.4)); }
		50% { stroke-opacity: 1; filter: drop-shadow(0 0 10px rgba(170, 68, 255, 0.7)); }
	}

	@media (max-width: 768px) {
		.skill-header {
			padding: 0.6rem 0.8rem;
			flex-direction: column;
			gap: 8px;
		}

		.header-right {
			width: 100%;
			justify-content: space-between;
		}

		.branch-tags {
			flex-wrap: wrap;
			gap: 4px;
		}

		.branch-tag {
			font-size: 8px;
			padding: 3px 8px;
		}

		.skill-tooltip {
			bottom: 0.5rem;
			max-width: 90vw;
		}
	}
</style>
