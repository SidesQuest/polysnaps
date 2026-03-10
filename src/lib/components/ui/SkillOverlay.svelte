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

	const NODE_R = 22;
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
			<span class="header-sub">{totalPoints} invested · 🔮 {gameState.prestige.currency} prestige</span>
		</div>
		<div class="header-right">
			<div class="branch-tags">
				{#each visibleBranches as branch}
					<span class="branch-tag" style="color: {branch.color}; border-color: {branch.color}33;">
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
			{#each [140, 280, 420, 560] as ringR}
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
				{@const branchDef = def.branch >= 0 ? BRANCH_DEFS.find(b => b.id === def.branch) : null}
				{@const nodeColor = branchDef ? branchDef.color : '#44aaff'}
				{#if p && vis}
					<g
						class="skill-node-g"
						transform="translate({p.x}, {p.y})"
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
							<circle r={NODE_R} class="node-bg"
								class:node-unlocked={level > 0}
								class:node-maxed={maxed}
								style={level > 0 ? `stroke: ${nodeColor};` : ''}
							/>
							{#if level > 0}
								<circle r={NODE_R + 4} class="node-glow" style="stroke: {nodeColor};" />
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
							{/if}
						{#if level > 0}
							<text y={NODE_R + 12} class="node-level" fill={nodeColor}>{level}/{def.maxLevel}</text>
						{:else}
							<text y={NODE_R + 12} class="node-cost" fill={getCostColor(def.costType)}>
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
		background: rgba(5, 5, 15, 0.98);
		display: flex;
		flex-direction: column;
		animation: overlay-in 0.15s steps(3);
	}

	.skill-header {
		padding: 0.8rem 1.2rem;
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

	.header-right {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.branch-tags {
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
	}

	.branch-tag {
		font-family: var(--font-pixel);
		font-size: 0.4rem;
		padding: 2px 6px;
		border: 1px solid;
		border-radius: 3px;
		opacity: 0.7;
	}

	.header-title {
		font-size: 0.8rem;
		color: #aa44ff;
		letter-spacing: 5px;
		font-family: var(--font-pixel);
	}

	.header-sub {
		font-size: 0.45rem;
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
		stroke: rgba(51, 51, 90, 0.12);
		stroke-width: 1;
		pointer-events: none;
	}

	.branch-line {
		stroke-width: 1;
		opacity: 0.06;
		pointer-events: none;
	}

	.branch-label {
		font-family: var(--font-pixel);
		font-size: 8px;
		text-anchor: middle;
		opacity: 0.4;
		pointer-events: none;
	}

	.skill-edge {
		stroke: var(--color-border);
		stroke-width: 2;
		opacity: 0.25;
		pointer-events: none;
	}

	.skill-edge.active {
		stroke: #aa44ff;
		opacity: 0.6;
	}

	.skill-edge.foggy {
		opacity: 0.06;
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
		stroke-width: 2.5;
	}

	.foggy-bg {
		fill: rgba(10, 10, 20, 0.5);
		stroke: rgba(80, 80, 120, 0.15);
		stroke-dasharray: 4 4;
	}

	.node-bg.node-unlocked {
		fill: rgba(170, 68, 255, 0.08);
	}

	.node-bg.node-maxed {
		stroke: var(--color-gold) !important;
		fill: rgba(255, 221, 85, 0.06);
	}

	.skill-node-g.can-unlock .node-bg {
		animation: node-blink 1.5s steps(2) infinite;
	}

	.node-glow {
		fill: none;
		stroke-width: 2;
		opacity: 0.2;
		pointer-events: none;
	}

	.node-frame,
	.node-icon-img {
		image-rendering: pixelated;
		pointer-events: none;
	}

	.foggy-icon {
		font-size: 14px;
		fill: var(--color-text-dim);
		text-anchor: middle;
		opacity: 0.25;
		pointer-events: none;
		font-family: var(--font-pixel);
	}

	.node-level {
		font-family: var(--font-pixel);
		font-size: 7px;
		text-anchor: middle;
		pointer-events: none;
	}

	.node-cost {
		font-family: var(--font-pixel);
		font-size: 7px;
		text-anchor: middle;
		pointer-events: none;
	}

	.skill-tooltip {
		position: fixed;
		bottom: 1.5rem;
		left: 50%;
		transform: translateX(-50%);
		background: var(--color-surface);
		border: 1px solid #aa44ff;
		border-radius: 6px;
		padding: 12px 16px;
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 240px;
		max-width: 320px;
		animation: tt-in 0.1s ease-out;
		z-index: 10010;
		font-family: var(--font-pixel);
	}

	.tt-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.tt-header-text {
		display: flex;
		flex-direction: column;
		gap: 2px;
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

	.tt-branch {
		font-size: 0.4rem;
	}

	.tt-desc {
		font-size: 0.45rem;
		color: var(--color-text-dim);
	}

	.tt-effect {
		font-size: 0.45rem;
		color: var(--color-green);
	}

	.tt-level {
		font-size: 0.45rem;
	}

	.tt-cost {
		font-size: 0.5rem;
		color: var(--color-text-dim);
	}

	.tt-cost.affordable {
		color: var(--color-text);
	}

	.tt-maxed {
		font-size: 0.5rem;
		color: var(--color-gold);
		letter-spacing: 3px;
	}

	.tt-req {
		font-size: 0.4rem;
		color: var(--color-red);
	}

	.tt-unlock {
		font-size: 0.4rem;
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
		0%, 100% { stroke-opacity: 0.4; }
		50% { stroke-opacity: 1; }
	}
</style>
