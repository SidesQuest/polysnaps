<script>
	import { onMount } from 'svelte';
	import { gameState, placeShape, canAffordShape, addResource, getNodeProduction, getNodeDepth, getBuffZones, getClickValue, getTierLevel } from '$lib/game/state.svelte.js';
	import { buildGeometryTree, getOpenSlots, verticesToString, getPolygonPointsString } from '$lib/game/shapes.js';
	import { getZoneBonus } from '$lib/game/buffzones.js';
	import { playClick } from '$lib/game/audio.js';
	import { formatNumber } from '$lib/utils/format.js';

	const CORE_RADIUS = 50;
	let svgEl = $state(null);

	onMount(() => {
		if (svgEl) {
			svgEl.addEventListener('wheel', handleWheel, { passive: false });
			return () => svgEl.removeEventListener('wheel', handleWheel);
		}
	});

	let pulseCore = $state(false);
	let hoveredNode = $state(null);
	let panX = $state(0);
	let panY = $state(0);
	let zoom = $state(1);
	let isPanning = $state(false);
	let lastMouse = $state({ x: 0, y: 0 });

	let geometry = $derived(
		buildGeometryTree(gameState.nodes, gameState.coreShape.sides, CORE_RADIUS)
	);

	let openSlots = $derived(
		getOpenSlots(gameState.nodes, gameState.coreShape.sides, CORE_RADIUS)
	);

	let buffZones = $derived(getBuffZones());

	let bounds = $derived.by(() => {
		let minX = -100, maxX = 100, minY = -100, maxY = 100;
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
		const pad = 60;
		return {
			x: minX - pad,
			y: minY - pad,
			w: maxX - minX + pad * 2,
			h: maxY - minY + pad * 2
		};
	});

	let viewBox = $derived.by(() => {
		const cx = (bounds.x + bounds.w / 2) - panX;
		const cy = (bounds.y + bounds.h / 2) - panY;
		const w = bounds.w / zoom;
		const h = bounds.h / zoom;
		return `${cx - w / 2} ${cy - h / 2} ${w} ${h}`;
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
		geometry.map((g) => {
			const depth = g.isCore ? 0 : getNodeDepth(g.node.id);
			const tierLvl = g.isCore ? 1 : getTierLevel(depth);
			return {
				cx: g.center.x,
				cy: g.center.y,
				r: g.isCore ? 100 : 65 + (tierLvl * 8)
			};
		})
	);

	function handleCoreClick(e) {
		e.preventDefault();
		e.stopPropagation();
		pulseCore = true;
		setTimeout(() => (pulseCore = false), 150);
		addResource('energy', getClickValue());
		playClick();
	}

	function handleSlotClick(e, slot) {
		e.preventDefault();
		e.stopPropagation();
		if (canAffordShape()) {
			placeShape(slot.parentId, slot.edgeIndex);
		}
	}

	function handleWheel(e) {
		e.preventDefault();
		const delta = e.deltaY > 0 ? 0.9 : 1.1;
		zoom = Math.max(0.3, Math.min(5, zoom * delta));
	}

	function handleMouseDown(e) {
		if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
			isPanning = true;
			lastMouse = { x: e.clientX, y: e.clientY };
			e.preventDefault();
		}
	}

	function handleMouseMove(e) {
		if (isPanning) {
			const dx = e.clientX - lastMouse.x;
			const dy = e.clientY - lastMouse.y;
			panX += dx * 0.5 / zoom;
			panY += dy * 0.5 / zoom;
			lastMouse = { x: e.clientX, y: e.clientY };
		}
	}

	function handleMouseUp() {
		isPanning = false;
	}

	function getLayerColor(layer) {
		const colors = ['#44aaff', '#44ff88', '#ffcc44', '#ff44aa', '#aa44ff', '#44ffff'];
		return colors[(layer - 1) % colors.length];
	}

	function getLayerGlow(layer) {
		const color = getLayerColor(layer);
		return `drop-shadow(0 0 2px ${color})`;
	}

	function handleShapeHover(geo) {
		const prod = getNodeProduction(geo.node.id);
		const depth = getNodeDepth(geo.node.id);
		const tierLvl = getTierLevel(depth);
		const zoneBonus = getZoneBonus(geo.center, buffZones);
		hoveredNode = {
			x: geo.center.x,
			y: geo.center.y - 20,
			name: `Tier ${depth}`,
			level: tierLvl,
			production: prod,
			zoneBonus,
			id: geo.node.id
		};
	}
</script>

<svg
	bind:this={svgEl}
	{viewBox}
	class="shape-network"
	xmlns="http://www.w3.org/2000/svg"
	preserveAspectRatio="xMidYMid meet"
	onmousedown={handleMouseDown}
	onmousemove={handleMouseMove}
	onmouseup={handleMouseUp}
	onmouseleave={handleMouseUp}
	role="img"
>
	<defs>
		<mask id="fog-mask">
			<rect x={bounds.x - 200} y={bounds.y - 200} width={bounds.w + 400} height={bounds.h + 400} fill="black" />
			{#each fogCircles as fog}
				<radialGradient id="fog-grad-{fog.cx.toFixed(0)}-{fog.cy.toFixed(0)}" cx="50%" cy="50%" r="50%">
					<stop offset="0%" stop-color="white" stop-opacity="1" />
					<stop offset="70%" stop-color="white" stop-opacity="0.8" />
					<stop offset="100%" stop-color="white" stop-opacity="0" />
				</radialGradient>
				<circle
					cx={fog.cx} cy={fog.cy} r={fog.r}
					fill="url(#fog-grad-{fog.cx.toFixed(0)}-{fog.cy.toFixed(0)})"
				/>
			{/each}
		</mask>
	</defs>

	<rect
		x={bounds.x - 200} y={bounds.y - 200}
		width={bounds.w + 400} height={bounds.h + 400}
		fill="rgba(8, 8, 20, 0.7)"
		mask="url(#fog-mask)"
		class="fog-overlay"
	/>

	{#each buffZones as zone}
		<circle
			cx={zone.x} cy={zone.y} r={zone.radius}
			fill="{zone.color}08"
			stroke={zone.color}
			stroke-width="0.8"
			stroke-dasharray="6 4"
			opacity="0.4"
			class="buff-zone"
		/>
		<text
			x={zone.x} y={zone.y - zone.radius - 5}
			class="zone-label"
			fill={zone.color}
		>
			{zone.icon} {zone.name}
		</text>
		<text
			x={zone.x} y={zone.y + 3}
			class="zone-desc"
			fill={zone.color}
		>
			{zone.description}
		</text>
	{/each}

	{#each flowParticles as flow (flow.id)}
		<line
			x1={flow.x1} y1={flow.y1}
			x2={flow.x2} y2={flow.y2}
			class="flow-line"
		/>
		<circle r="1.5" class="flow-particle">
			<animateMotion
				dur="{1.2 + Math.random() * 0.8}s"
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
			{@const tierLvl = getTierLevel(depth)}
			{@const inZone = getZoneBonus(geo.center, buffZones) > 1}
			<polygon
				points={verticesToString(geo.vertices)}
				class="placed-shape"
				class:in-zone={inZone}
				style="stroke: {color}; filter: {getLayerGlow(depth)};"
				onmouseenter={() => handleShapeHover(geo)}
				onmouseleave={() => (hoveredNode = null)}
			/>
			<text
				x={geo.center.x}
				y={geo.center.y + 3}
				class="shape-level"
				style="fill: {color};"
			>
				{tierLvl}
			</text>
		{/if}
	{/each}

	{#if hoveredNode}
		<g class="tooltip" transform="translate({hoveredNode.x}, {hoveredNode.y})">
			<rect
				x="-55" y="-28" width="110" height="32"
				fill="var(--color-bg)" stroke="var(--color-accent)" stroke-width="1.5"
			/>
			<text x="0" y="-16" class="tooltip-title">{hoveredNode.name} Lv.{hoveredNode.level}</text>
			<text x="0" y="-6" class="tooltip-prod">{formatNumber(hoveredNode.production)}/s</text>
			{#if hoveredNode.zoneBonus > 1}
				<text x="0" y="2" class="tooltip-zone">Zone: {hoveredNode.zoneBonus}x</text>
			{/if}
		</g>
	{/if}

	<text
		x={bounds.x + 8} y={bounds.y + 14}
		class="controls-hint"
	>scroll to zoom · shift+drag to pan</text>
</svg>

<style>
	.shape-network {
		width: 100%;
		height: 100%;
		max-width: 100%;
		max-height: 100%;
		cursor: grab;
		shape-rendering: crispEdges;
	}

	.shape-network:active {
		cursor: grabbing;
	}

	.fog-overlay {
		pointer-events: none;
	}

	.buff-zone {
		pointer-events: none;
		animation: zone-pulse 4s ease-in-out infinite;
	}

	.zone-label {
		font-family: var(--font-pixel);
		font-size: 5px;
		text-anchor: middle;
		pointer-events: none;
	}

	.zone-desc {
		font-family: var(--font-pixel);
		font-size: 4px;
		text-anchor: middle;
		pointer-events: none;
		opacity: 0.6;
	}

	.flow-line {
		stroke: var(--color-accent);
		stroke-width: 1;
		opacity: 0.1;
		stroke-dasharray: 2 4;
	}

	.flow-particle {
		fill: var(--color-accent);
		opacity: 0.8;
	}

	.core {
		transition: transform 0.1s;
	}

	.core.pulse {
		animation: core-pulse 0.15s ease-out;
	}

	.core-polygon {
		fill: var(--color-bg);
		stroke: var(--color-accent);
		stroke-width: 3;
		cursor: pointer;
		outline: none;
	}

	.core-polygon:hover {
		fill: rgba(85, 187, 255, 0.08);
		stroke-width: 4;
	}

	.core-polygon:focus-visible {
		stroke: var(--color-gold);
		stroke-width: 4;
	}

	.core-inner {
		fill: none;
		stroke: var(--color-accent);
		stroke-width: 1;
		opacity: 0.2;
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
		fill: var(--color-bg);
		stroke-width: 2;
		cursor: default;
	}

	.placed-shape.in-zone {
		fill: rgba(20, 20, 50, 0.95);
	}

	.shape-level {
		font-family: var(--font-pixel);
		font-size: 6px;
		text-anchor: middle;
		pointer-events: none;
	}

	.empty-slot {
		fill: transparent;
		stroke: var(--color-border);
		stroke-width: 1.5;
		stroke-dasharray: 4 4;
		opacity: 0.35;
		cursor: not-allowed;
		outline: none;
	}

	.empty-slot.affordable {
		stroke: var(--color-gold);
		opacity: 0.6;
		cursor: pointer;
		animation: slot-blink 1.5s steps(2) infinite;
	}

	.empty-slot.affordable:hover {
		opacity: 1;
		fill: rgba(255, 221, 85, 0.1);
	}

	.slot-plus {
		fill: var(--color-text-dim);
		font-family: var(--font-pixel);
		font-size: 8px;
		text-anchor: middle;
		pointer-events: none;
		opacity: 0.25;
	}

	.slot-plus.affordable {
		fill: var(--color-gold);
		opacity: 0.7;
	}

	.tooltip {
		pointer-events: none;
	}

	.tooltip-title {
		font-family: var(--font-pixel);
		font-size: 5px;
		fill: var(--color-text);
		text-anchor: middle;
	}

	.tooltip-prod {
		font-family: var(--font-pixel);
		font-size: 4.5px;
		fill: var(--color-green);
		text-anchor: middle;
	}

	.tooltip-zone {
		font-family: var(--font-pixel);
		font-size: 4px;
		fill: var(--color-gold);
		text-anchor: middle;
	}

	.controls-hint {
		font-family: var(--font-pixel);
		font-size: 4px;
		fill: var(--color-text-dim);
		opacity: 0.3;
	}

	@keyframes core-pulse {
		0% { transform: scale(1); }
		50% { transform: scale(1.05); }
		100% { transform: scale(1); }
	}

	@keyframes slot-blink {
		0%, 100% { opacity: 0.4; }
		50% { opacity: 0.8; }
	}

	@keyframes zone-pulse {
		0%, 100% { opacity: 0.3; }
		50% { opacity: 0.5; }
	}
</style>
