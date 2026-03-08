<script>
	import { gameState, placeShape, canAffordShape, getNodeProduction, getNodeDepth } from '$lib/game/state.svelte.js';
	import { buildGeometryTree, getOpenSlots, verticesToString, getPolygonPointsString } from '$lib/game/shapes.js';

	const CORE_RADIUS = 50;

	let pulseCore = $state(false);

	let geometry = $derived(
		buildGeometryTree(gameState.nodes, gameState.coreShape.sides, CORE_RADIUS)
	);

	let openSlots = $derived(
		getOpenSlots(gameState.nodes, gameState.coreShape.sides, CORE_RADIUS)
	);

	let maxSlotLayer = $derived(
		Math.max(1, ...openSlots.map((s) => s.layer))
	);

	let bounds = $derived.by(() => {
		let minX = -80, maxX = 80, minY = -80, maxY = 80;
		for (const g of geometry) {
			for (const v of g.vertices) {
				minX = Math.min(minX, v.x);
				maxX = Math.max(maxX, v.x);
				minY = Math.min(minY, v.y);
				maxY = Math.max(maxY, v.y);
			}
		}
		for (const s of openSlots) {
			for (const v of s.vertices) {
				minX = Math.min(minX, v.x);
				maxX = Math.max(maxX, v.x);
				minY = Math.min(minY, v.y);
				maxY = Math.max(maxY, v.y);
			}
		}
		const pad = 40;
		return {
			x: minX - pad,
			y: minY - pad,
			w: maxX - minX + pad * 2,
			h: maxY - minY + pad * 2
		};
	});

	let flowParticles = $derived(
		geometry
			.filter((g) => !g.isCore && g.parentCenter)
			.map((g) => ({
				x1: g.center.x,
				y1: g.center.y,
				x2: g.parentCenter.x,
				y2: g.parentCenter.y,
				id: g.node.id
			}))
	);

	let fogCircles = $derived(
		geometry.map((g) => ({
			cx: g.center.x,
			cy: g.center.y,
			r: g.isCore ? 90 : 60 + (g.node.level * 5)
		}))
	);

	function handleCoreClick(e) {
		e.preventDefault();
		e.stopPropagation();
		pulseCore = true;
		setTimeout(() => (pulseCore = false), 150);
		gameState.resources.energy += 1;
		gameState.stats.totalEnergyEarned += 1;
	}

	function handleSlotClick(e, slot) {
		e.preventDefault();
		e.stopPropagation();
		if (canAffordShape()) {
			placeShape(slot.parentId, slot.edgeIndex);
		}
	}

	function getLayerColor(layer) {
		const colors = ['#44aaff', '#44ff88', '#ffcc44', '#ff44aa', '#aa44ff', '#44ffff'];
		return colors[(layer - 1) % colors.length];
	}

	function getLayerGlow(layer) {
		const color = getLayerColor(layer);
		return `drop-shadow(0 0 4px ${color}66)`;
	}
</script>

<svg
	viewBox="{bounds.x} {bounds.y} {bounds.w} {bounds.h}"
	class="shape-network"
	xmlns="http://www.w3.org/2000/svg"
	preserveAspectRatio="xMidYMid meet"
>
	<defs>
		<mask id="fog-mask">
			<rect x={bounds.x} y={bounds.y} width={bounds.w} height={bounds.h} fill="black" />
			{#each fogCircles as fog}
				<circle cx={fog.cx} cy={fog.cy} r={fog.r} fill="white" />
			{/each}
		</mask>
	</defs>

	<rect
		x={bounds.x} y={bounds.y}
		width={bounds.w} height={bounds.h}
		fill="rgba(15, 15, 35, 0.6)"
		mask="url(#fog-mask)"
		class="fog-overlay"
	/>

	{#each flowParticles as flow (flow.id)}
		<line
			x1={flow.x1} y1={flow.y1}
			x2={flow.x2} y2={flow.y2}
			class="flow-line"
		/>
		<circle r="2" class="flow-particle">
			<animateMotion
				dur="{1.5 + Math.random()}s"
				repeatCount="indefinite"
				path="M{flow.x1},{flow.y1} L{flow.x2},{flow.y2}"
			/>
		</circle>
	{/each}

	{#each openSlots as slot}
		<polygon
			points={verticesToString(slot.vertices)}
			class="empty-slot"
			class:affordable={canAffordShape()}
			class:next-layer={slot.layer <= maxSlotLayer}
			onclick={(e) => handleSlotClick(e, slot)}
			onkeydown={(e) => e.key === 'Enter' && handleSlotClick(e, slot)}
			role="button"
			tabindex="0"
		/>
		<text
			x={slot.center.x}
			y={slot.center.y + 2}
			class="slot-plus"
			class:affordable={canAffordShape()}
		>+</text>
	{/each}

	{#each geometry as geo}
		{#if geo.isCore}
			<g class="core" class:pulse={pulseCore}>
				<polygon
					points={verticesToString(geo.vertices)}
					class="core-polygon"
					onclick={handleCoreClick}
					onkeydown={(e) => e.key === 'Enter' && handleCoreClick(e)}
					role="button"
					tabindex="0"
				/>
				<polygon
					points={getPolygonPointsString(gameState.coreShape.sides, CORE_RADIUS - 8)}
					class="core-inner"
				/>
				<text y="4" class="core-text">TAP</text>
			</g>
		{:else}
			{@const depth = getNodeDepth(geo.node.id)}
			{@const color = getLayerColor(depth)}
			<polygon
				points={verticesToString(geo.vertices)}
				class="placed-shape"
				style="stroke: {color}; filter: {getLayerGlow(depth)};"
			/>
			<text
				x={geo.center.x}
				y={geo.center.y + 3}
				class="shape-level"
				style="fill: {color};"
			>
				{geo.node.level}
			</text>
		{/if}
	{/each}
</svg>


<style>
	.shape-network {
		width: 100%;
		height: 100%;
		max-width: 100%;
		max-height: 100%;
	}

	.fog-overlay {
		pointer-events: none;
	}

	.flow-line {
		stroke: var(--color-accent);
		stroke-width: 0.5;
		opacity: 0.15;
	}

	.flow-particle {
		fill: var(--color-accent);
		opacity: 0.7;
	}

	.core {
		transition: transform 0.1s;
	}

	.core.pulse {
		animation: core-pulse 0.15s ease-out;
	}

	.core-polygon {
		fill: var(--color-surface);
		stroke: var(--color-accent);
		stroke-width: 2;
		cursor: pointer;
		filter: drop-shadow(0 0 10px var(--color-accent-glow));
		transition: filter 0.2s;
	}

	.core-polygon:hover {
		filter: drop-shadow(0 0 20px var(--color-accent));
	}

	.core-inner {
		fill: none;
		stroke: var(--color-accent);
		stroke-width: 0.5;
		opacity: 0.3;
		pointer-events: none;
	}

	.core-text {
		fill: var(--color-text-dim);
		font-family: var(--font-pixel);
		font-size: 8px;
		text-anchor: middle;
		pointer-events: none;
	}

	.placed-shape {
		fill: var(--color-surface);
		stroke-width: 1.5;
		transition: filter 0.3s;
	}

	.shape-level {
		font-family: var(--font-pixel);
		font-size: 6px;
		text-anchor: middle;
		pointer-events: none;
	}

	.empty-slot {
		fill: transparent;
		stroke: var(--color-text-dim);
		stroke-width: 0.8;
		stroke-dasharray: 3 3;
		opacity: 0.15;
		cursor: not-allowed;
		transition: all 0.2s;
	}

	.empty-slot.affordable {
		stroke: var(--color-gold);
		opacity: 0.4;
		cursor: pointer;
		animation: slot-glow 2s ease-in-out infinite;
	}

	.empty-slot.affordable:hover {
		opacity: 0.9;
		fill: rgba(255, 204, 68, 0.08);
	}

	.slot-plus {
		fill: var(--color-text-dim);
		font-family: var(--font-pixel);
		font-size: 6px;
		text-anchor: middle;
		pointer-events: none;
		opacity: 0.2;
	}

	.slot-plus.affordable {
		fill: var(--color-gold);
		opacity: 0.5;
	}

	@keyframes core-pulse {
		0% { transform: scale(1); }
		50% { transform: scale(1.05); }
		100% { transform: scale(1); }
	}

	@keyframes slot-glow {
		0%, 100% { opacity: 0.25; }
		50% { opacity: 0.5; }
	}
</style>
