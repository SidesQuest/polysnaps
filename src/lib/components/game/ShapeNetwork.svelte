<script>
	import { onMount } from 'svelte';
	import { gameState, placeShape, canAffordShape, addResource, getNodeProduction, getNodeDepth, getBuffZones, getClickValue, performClick, getTierLevel, getNodeChildren, getEdgeResource, getNodeResource, getGeneratorCount, getAvailableShapes, getShapePlacementCost, getNextShapeCost, getFogState, getPuzzleSlots } from '$lib/game/state.svelte.js';
	import { RESOURCE_DEFS } from '$lib/game/state.svelte.js';
	import { buildGeometryTree, getOpenSlots, verticesToString, getPolygonPointsString, getCoreVertices, SHAPE_DEFS } from '$lib/game/shapes.js';
	import { isPointRevealed, FOG_CELL_SIZE } from '$lib/game/fog.js';
	import { getZoneBonus } from '$lib/game/buffzones.js';
	import { playClick } from '$lib/game/audio.js';
	import { formatNumber } from '$lib/utils/format.js';

	const CORE_RADIUS = 50;
	const TIER_COLORS = ['#44aaff', '#44ff88', '#ffcc44', '#ff44aa', '#aa44ff', '#44ffff'];
	const MAX_FLOW_PATHS = 15;

	let svgEl = $state(null);

	onMount(() => {
		if (svgEl) {
			svgEl.addEventListener('wheel', handleWheel, { passive: false });
			return () => svgEl.removeEventListener('wheel', handleWheel);
		}
	});

	let pulseCore = $state(false);
	let clickRipples = $state([]);
	let floatingNums = $state([]);
	let placeParticles = $state([]);
	let shakeX = $state(0);
	let shakeY = $state(0);
	let rippleId = 0;
	let floatId = 0;
	let particleId = 0;
	let hoveredNode = $state(null);
	let selectedShape = $state('triangle');
	let availableShapes = $derived(getAvailableShapes());
	let selectedCost = $derived(getShapePlacementCost(selectedShape));
	let fogCells = $derived(getFogState());
	let puzzleSlots = $derived(getPuzzleSlots());
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

	let geoMap = $derived.by(() => {
		const m = new Map();
		for (const g of geometry) {
			if (!g.isCore) m.set(g.node.id, g);
		}
		return m;
	});

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

	let connectionLines = $derived(
		geometry
			.filter((g) => !g.isCore && g.parentCenter)
			.map((g) => {
				const depth = getNodeDepth(g.node.id);
				return {
					x1: g.center.x, y1: g.center.y,
					x2: g.parentCenter.x, y2: g.parentCenter.y,
					color: getLayerColor(depth),
					id: g.node.id
				};
			})
	);

	let flowPaths = $derived.by(() => {
		const nonCore = geometry.filter((g) => !g.isCore);
		const leafNodes = nonCore.filter((g) => {
			const children = getNodeChildren(g.node.id);
			return children.length === 0;
		});

		const sampled = leafNodes.length <= MAX_FLOW_PATHS
			? leafNodes
			: leafNodes.filter((_, i) => i % Math.ceil(leafNodes.length / MAX_FLOW_PATHS) === 0);

		return sampled.map((leaf) => {
			const points = [{ x: leaf.center.x, y: leaf.center.y }];
			let current = leaf;
			while (current && current.parentCenter) {
				points.push({ x: current.parentCenter.x, y: current.parentCenter.y });
				const parentNode = gameState.nodes.find((n) => n.id === current.node.parentId);
				if (!parentNode || parentNode.id === 'core') {
					points.push({ x: 0, y: 0 });
					break;
				}
				current = geoMap.get(parentNode.id);
				if (!current) break;
			}

			const pathStr = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
			const depth = getNodeDepth(leaf.node.id);
			const color = getLayerColor(depth);
			const segCount = points.length - 1;
			const dur = 1.2 + segCount * 0.5;

			return { id: leaf.node.id, path: pathStr, color, dur, depth };
		});
	});

	let coreEdgeMids = $derived.by(() => {
		const sides = gameState.coreShape.sides;
		const verts = getCoreVertices(sides, CORE_RADIUS);
		const mids = [];
		for (let i = 0; i < sides; i++) {
			const v1 = verts[i];
			const v2 = verts[(i + 1) % sides];
			const mx = (v1.x + v2.x) / 2;
			const my = (v1.y + v2.y) / 2;
			const resKey = getEdgeResource(i);
			const res = RESOURCE_DEFS[resKey];
			const len = Math.sqrt(mx * mx + my * my) || 1;
			const nx = mx / len;
			const ny = my / len;
			const offset = 18;
			mids.push({
				x: mx + nx * offset,
				y: my + ny * offset,
				icon: res.icon,
				color: res.color,
				edgeX1: v1.x, edgeY1: v1.y,
				edgeX2: v2.x, edgeY2: v2.y,
			});
		}
		return mids;
	});

	function getLayerColor(depth) {
		return TIER_COLORS[(depth - 1) % TIER_COLORS.length];
	}

	function spawnFloatingNum(x, y, text, color) {
		const id = ++floatId;
		const ox = (Math.random() - 0.5) * 20;
		floatingNums = [...floatingNums, { id, x: x + ox, y, text, color }];
		setTimeout(() => {
			floatingNums = floatingNums.filter((f) => f.id !== id);
		}, 900);
	}

	function spawnPlaceParticles(cx, cy, color) {
		const count = 6;
		const ids = [];
		for (let i = 0; i < count; i++) {
			const id = ++particleId;
			const angle = (i / count) * Math.PI * 2;
			ids.push({ id, cx, cy, tx: cx + Math.cos(angle) * 25, ty: cy + Math.sin(angle) * 25, color });
		}
		placeParticles = [...placeParticles, ...ids];
		setTimeout(() => {
			const idSet = new Set(ids.map((p) => p.id));
			placeParticles = placeParticles.filter((p) => !idSet.has(p.id));
		}, 500);
	}

	function triggerShake() {
		shakeX = (Math.random() - 0.5) * 4;
		shakeY = (Math.random() - 0.5) * 4;
		setTimeout(() => { shakeX = 0; shakeY = 0; }, 100);
	}

	function handleCoreClick(e) {
		e.preventDefault();
		e.stopPropagation();
		pulseCore = true;
		setTimeout(() => (pulseCore = false), 200);

		const id = ++rippleId;
		clickRipples = [...clickRipples, id];
		setTimeout(() => {
			clickRipples = clickRipples.filter((r) => r !== id);
		}, 600);

		const result = performClick();
		playClick();

		const text = result.isBurst ? `⚡${formatNumber(result.value)}!` : `+${formatNumber(result.value)}`;
		const color = result.isBurst ? '#ffcc44' : '#44aaff';
		spawnFloatingNum(0, -15, text, color);
		if (result.isBurst) triggerShake();
	}

	function handleSlotClick(e, slot) {
		e.preventDefault();
		e.stopPropagation();
		if (gameState.resources.energy >= selectedCost) {
			const ok = placeShape(slot.parentId, slot.edgeIndex, selectedShape);
			if (ok) {
				const depth = slot.layer || 1;
				spawnPlaceParticles(slot.center.x, slot.center.y, getLayerColor(depth));
			}
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

	function handleShapeHover(geo) {
		const prod = getNodeProduction(geo.node.id);
		const depth = getNodeDepth(geo.node.id);
		const tierLvl = getTierLevel(depth);
		const zoneBonus = getZoneBonus(geo.center, buffZones);
		const color = getLayerColor(depth);
		const resKey = getNodeResource(geo.node.id);
		const resDef = RESOURCE_DEFS[resKey];
		const genCount = getGeneratorCount(geo.node.id);

		let subtitle = '';
		if (depth === 1) {
			subtitle = `${resDef.icon} ${resDef.name} · ${genCount.toFixed(1)} gens`;
		} else {
			const feedRate = (0.1 * tierLvl).toFixed(1);
			subtitle = `Feeds T${depth - 1} +${feedRate}/s`;
		}

		hoveredNode = {
			x: geo.center.x,
			y: geo.center.y - 22,
			name: `Tier ${depth}`,
			level: tierLvl,
			production: prod,
			zoneBonus,
			id: geo.node.id,
			color,
			subtitle,
		};
	}
</script>

<svg
	bind:this={svgEl}
	{viewBox}
	class="shape-network"
	xmlns="http://www.w3.org/2000/svg"
	preserveAspectRatio="xMidYMid meet"
	style="transform: translate({shakeX}px, {shakeY}px)"
	onmousedown={handleMouseDown}
	onmousemove={handleMouseMove}
	onmouseup={handleMouseUp}
	onmouseleave={handleMouseUp}
	role="img"
>
	{#each buffZones as zone}
		<circle
			cx={zone.x} cy={zone.y} r={zone.radius}
			fill="{zone.color}08"
			stroke={zone.color}
			stroke-width="0.5"
			stroke-dasharray="4 6"
			opacity="0.3"
			class="buff-zone"
		/>
		<text x={zone.x} y={zone.y - zone.radius - 5} class="zone-label" fill={zone.color}>
			{zone.icon} {zone.name}
		</text>
	{/each}

	{#each puzzleSlots as ps (ps.id)}
		{@const visible = isPointRevealed(ps.x, ps.y, fogCells)}
		{@const solved = gameState.solvedPuzzles.includes(ps.id)}
		{#if visible}
			<g class="puzzle-slot" class:solved class:rare={ps.isRare}>
				<circle cx={ps.x} cy={ps.y} r="12" class="puzzle-ring" />
				<text x={ps.x} y={ps.y + 1} class="puzzle-shape">
					{ps.requiredShape === 'triangle' ? '△' : ps.requiredShape === 'square' ? '□' : ps.requiredShape === 'pentagon' ? '⬠' : '⬡'}
				</text>
				{#if solved}
					<text x={ps.x} y={ps.y + 10} class="puzzle-solved">✓</text>
				{:else if ps.isRare}
					<text x={ps.x} y={ps.y - 14} class="puzzle-rare-tag">★</text>
				{/if}
			</g>
		{/if}
	{/each}

	<defs>
		<radialGradient id="fog-edge" cx="50%" cy="50%" r="50%">
			<stop offset="0%" stop-color="transparent" />
			<stop offset="70%" stop-color="transparent" />
			<stop offset="100%" stop-color="rgba(5,5,15,0.85)" />
		</radialGradient>
	</defs>

	{#each connectionLines as cl (cl.id)}
		<line
			x1={cl.x1} y1={cl.y1} x2={cl.x2} y2={cl.y2}
			stroke={cl.color}
			stroke-width="0.8"
			opacity="0.2"
		/>
	{/each}

	{#each flowPaths as fp (fp.id)}
		<circle r="3.5" fill={fp.color} opacity="0" class="flow-particle">
			<animateMotion dur="{fp.dur}s" repeatCount="indefinite" path={fp.path} />
			<animate attributeName="opacity" values="0.1;1;1;0.1" dur="{fp.dur}s" repeatCount="indefinite" />
			<animate attributeName="r" values="2.5;3.5;2.5" dur="{fp.dur}s" repeatCount="indefinite" />
		</circle>
		<circle r="2" fill={fp.color} opacity="0" class="flow-particle">
			<animateMotion dur="{fp.dur}s" begin="{fp.dur * 0.4}s" repeatCount="indefinite" path={fp.path} />
			<animate attributeName="opacity" values="0.1;0.8;0.8;0.1" dur="{fp.dur}s" begin="{fp.dur * 0.4}s" repeatCount="indefinite" />
		</circle>
	{/each}

	{#each openSlots as slot}
		{@const slotResKey = slot.parentId === 'core' ? getEdgeResource(slot.edgeIndex) : null}
		{@const slotRes = slotResKey ? RESOURCE_DEFS[slotResKey] : null}
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
			y={slot.center.y + (slotRes ? -1 : 2)}
			class="slot-plus"
			class:affordable={canAffordShape()}
		>+</text>
		{#if slotRes}
			<text
				x={slot.center.x}
				y={slot.center.y + 8}
				class="slot-resource-hint"
				fill={slotRes.color}
			>{slotRes.icon}</text>
		{/if}
	{/each}

	{#each geometry as geo}
		{#if geo.isCore}
			<g class="core" class:pulse={pulseCore}>
				{#each clickRipples as rid (rid)}
					<circle cx="0" cy="0" r="10" class="click-ripple" />
				{/each}
				<polygon
					points={verticesToString(geo.vertices)}
					class="core-polygon"
					onclick={handleCoreClick}
					onkeydown={(e) => e.key === 'Enter' && handleCoreClick(e)}
					role="button"
					tabindex="0"
				/>
				<polygon
					points={getPolygonPointsString(gameState.coreShape.sides, CORE_RADIUS - 10)}
					class="core-inner"
				/>
			<text y="4" class="core-text">TAP</text>
			{#each coreEdgeMids as em}
				<line
					x1={em.edgeX1} y1={em.edgeY1}
					x2={em.edgeX2} y2={em.edgeY2}
					stroke={em.color} stroke-width="2" opacity="0.3"
					class="core-edge-tint"
				/>
				<text x={em.x} y={em.y + 4} class="core-resource-icon" fill={em.color}>{em.icon}</text>
			{/each}
			</g>
		{:else}
			{@const depth = getNodeDepth(geo.node.id)}
			{@const color = getLayerColor(depth)}
			{@const tierLvl = getTierLevel(depth)}
			{@const inZone = getZoneBonus(geo.center, buffZones) > 1}
			{@const shapeDef = SHAPE_DEFS[geo.node.shape]}
			{@const roleIcon = shapeDef?.role === 'multiplier' ? '×' : shapeDef?.role === 'storage' ? '▣' : shapeDef?.role === 'converter' ? '⟳' : ''}
			<polygon
				points={verticesToString(geo.vertices)}
				class="placed-shape"
				class:in-zone={inZone}
				style="stroke: {color};"
				onmouseenter={() => handleShapeHover(geo)}
				onmouseleave={() => (hoveredNode = null)}
				role="img"
			/>
			<text
				x={geo.center.x}
				y={geo.center.y + (roleIcon ? 0 : 3)}
				class="shape-level"
				style="fill: {color};"
			>
				{tierLvl}
			</text>
			{#if roleIcon}
				<text x={geo.center.x} y={geo.center.y + 7} class="shape-role" style="fill: {color};">{roleIcon}</text>
			{/if}
		{/if}
	{/each}

	{#if hoveredNode}
		<g class="tooltip" transform="translate({hoveredNode.x}, {hoveredNode.y})">
			<rect
				x="-60" y="-30" width="120" height="40" rx="3"
				fill="rgba(11,11,25,0.95)" stroke={hoveredNode.color} stroke-width="1"
			/>
			<text x="0" y="-19" class="tooltip-title" fill={hoveredNode.color}>{hoveredNode.name} Lv.{hoveredNode.level}</text>
			{#if hoveredNode.production > 0}
				<text x="0" y="-9" class="tooltip-prod">{formatNumber(hoveredNode.production)}/s</text>
			{/if}
			<text x="0" y="1" class="tooltip-subtitle">{hoveredNode.subtitle}</text>
			{#if hoveredNode.zoneBonus > 1}
				<text x="0" y="9" class="tooltip-zone">Zone: {hoveredNode.zoneBonus}x</text>
			{/if}
		</g>
	{/if}

	{#each floatingNums as fn (fn.id)}
		<text
			x={fn.x} y={fn.y}
			class="floating-num"
			fill={fn.color}
		>{fn.text}</text>
	{/each}

	{#each placeParticles as pp (pp.id)}
		<circle cx={pp.cx} cy={pp.cy} r="2" fill={pp.color} class="place-particle">
			<animate attributeName="cx" from={pp.cx} to={pp.tx} dur="0.4s" fill="freeze" />
			<animate attributeName="cy" from={pp.cy} to={pp.ty} dur="0.4s" fill="freeze" />
			<animate attributeName="opacity" from="1" to="0" dur="0.4s" fill="freeze" />
			<animate attributeName="r" from="2.5" to="0.5" dur="0.4s" fill="freeze" />
		</circle>
	{/each}

	<text
		x={bounds.x + 8} y={bounds.y + 14}
		class="controls-hint"
	>scroll to zoom · shift+drag to pan</text>
</svg>

{#if availableShapes.length > 1}
	<div class="shape-selector">
		{#each availableShapes as shape}
			<button
				class="shape-btn"
				class:active={selectedShape === shape.key}
				onclick={() => (selectedShape = shape.key)}
				title="{shape.name}: {shape.description}"
			>
				<span class="shape-icon">{shape.sides === 3 ? '△' : shape.sides === 4 ? '□' : shape.sides === 5 ? '⬠' : '⬡'}</span>
				<span class="shape-cost">{formatNumber(getShapePlacementCost(shape.key))}</span>
			</button>
		{/each}
	</div>
{/if}

<style>
	.shape-network {
		width: 100%;
		height: 100%;
		max-width: 100%;
		max-height: 100%;
		cursor: grab;
		shape-rendering: geometricPrecision;
	}

	.shape-network:active {
		cursor: grabbing;
	}

	.buff-zone {
		pointer-events: none;
	}

	.zone-label {
		font-family: var(--font-pixel);
		font-size: 5px;
		text-anchor: middle;
		pointer-events: none;
	}

	.flow-particle {
		pointer-events: none;
	}

	.core {
		transition: transform 0.1s;
	}

	.core.pulse {
		animation: core-pulse 0.15s ease-out;
	}

	.core-polygon {
		fill: rgba(11, 11, 25, 0.9);
		stroke: var(--color-accent);
		stroke-width: 2.5;
		cursor: pointer;
		outline: none;
	}

	.core-polygon:hover {
		fill: rgba(85, 187, 255, 0.08);
		stroke-width: 3;
	}

	.core-polygon:focus-visible {
		stroke: var(--color-gold);
		stroke-width: 3;
	}

	.core-inner {
		fill: none;
		stroke: var(--color-accent);
		stroke-width: 0.8;
		opacity: 0.15;
		pointer-events: none;
	}

	.core-text {
		fill: var(--color-text-dim);
		font-family: var(--font-pixel);
		font-size: 9px;
		text-anchor: middle;
		pointer-events: none;
	}

	.core-resource-icon {
		font-size: 10px;
		text-anchor: middle;
		pointer-events: none;
		opacity: 0.9;
	}

	.core-edge-tint {
		pointer-events: none;
	}

	.placed-shape {
		fill: rgba(11, 11, 25, 0.8);
		stroke-width: 1.8;
		cursor: default;
	}

	.placed-shape.in-zone {
		fill: rgba(20, 20, 50, 0.8);
	}

	.shape-level {
		font-family: var(--font-pixel);
		font-size: 6px;
		text-anchor: middle;
		pointer-events: none;
	}

	.shape-role {
		font-family: var(--font-pixel);
		font-size: 5px;
		text-anchor: middle;
		pointer-events: none;
		opacity: 0.6;
	}

	.empty-slot {
		fill: transparent;
		stroke: var(--color-border);
		stroke-width: 1;
		stroke-dasharray: 3 5;
		opacity: 0.15;
		cursor: not-allowed;
		outline: none;
	}

	.empty-slot.affordable {
		stroke: var(--color-gold);
		opacity: 0.25;
		cursor: pointer;
	}

	.empty-slot.affordable:hover {
		opacity: 1;
		fill: rgba(255, 221, 85, 0.08);
		animation: slot-blink 0.6s steps(2) infinite;
	}

	.slot-plus {
		fill: var(--color-text-dim);
		font-family: var(--font-pixel);
		font-size: 7px;
		text-anchor: middle;
		pointer-events: none;
		opacity: 0.15;
	}

	.slot-plus.affordable {
		fill: var(--color-gold);
		opacity: 0.5;
	}

	.slot-resource-hint {
		font-size: 6px;
		text-anchor: middle;
		pointer-events: none;
		opacity: 0.35;
	}

	.tooltip {
		pointer-events: none;
	}

	.tooltip-title {
		font-family: var(--font-pixel);
		font-size: 5px;
		text-anchor: middle;
	}

	.tooltip-prod {
		font-family: var(--font-pixel);
		font-size: 4.5px;
		fill: var(--color-green);
		text-anchor: middle;
	}

	.tooltip-subtitle {
		font-family: var(--font-pixel);
		font-size: 4px;
		fill: var(--color-text-dim);
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

	.click-ripple {
		fill: none;
		stroke: var(--color-accent);
		stroke-width: 2;
		pointer-events: none;
		animation: ripple-expand 0.6s ease-out forwards;
	}

	@keyframes core-pulse {
		0% { transform: scale(1); }
		40% { transform: scale(1.1); }
		100% { transform: scale(1); }
	}

	@keyframes ripple-expand {
		0% {
			r: 15;
			stroke-width: 3;
			opacity: 0.8;
		}
		100% {
			r: 80;
			stroke-width: 0.5;
			opacity: 0;
		}
	}

	@keyframes slot-blink {
		0%, 100% { opacity: 0.5; }
		50% { opacity: 1; }
	}

	.floating-num {
		font-family: var(--font-pixel);
		font-size: 8px;
		text-anchor: middle;
		pointer-events: none;
		animation: float-up 0.9s ease-out forwards;
	}

	@keyframes float-up {
		0% {
			opacity: 1;
			transform: translateY(0);
		}
		70% { opacity: 1; }
		100% {
			opacity: 0;
			transform: translateY(-30px);
		}
	}

	.place-particle {
		pointer-events: none;
	}

	.placed-shape {
		transition: filter 0.3s;
	}

	.buff-zone {
		animation: zone-glow 3s ease-in-out infinite alternate;
	}

	@keyframes zone-glow {
		0% { opacity: 0.2; }
		100% { opacity: 0.4; }
	}

	.puzzle-slot {
		pointer-events: none;
	}

	.puzzle-ring {
		fill: rgba(255, 221, 85, 0.05);
		stroke: var(--color-gold);
		stroke-width: 1;
		stroke-dasharray: 3 3;
		opacity: 0.5;
	}

	.puzzle-slot.solved .puzzle-ring {
		stroke: var(--color-green);
		fill: rgba(85, 255, 153, 0.05);
		stroke-dasharray: none;
		opacity: 0.3;
	}

	.puzzle-slot.rare .puzzle-ring {
		stroke: #ff44aa;
		fill: rgba(255, 68, 170, 0.05);
	}

	.puzzle-shape {
		font-size: 8px;
		text-anchor: middle;
		fill: var(--color-gold);
		opacity: 0.6;
	}

	.puzzle-solved {
		font-size: 5px;
		text-anchor: middle;
		fill: var(--color-green);
	}

	.puzzle-rare-tag {
		font-size: 5px;
		text-anchor: middle;
		fill: #ff44aa;
	}

	.shape-selector {
		position: absolute;
		bottom: 8px;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		gap: 4px;
		background: rgba(11, 11, 25, 0.9);
		border: 1px solid var(--color-border);
		border-radius: 4px;
		padding: 4px 6px;
	}

	.shape-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		padding: 4px 8px;
		background: transparent;
		border: 1px solid var(--color-border);
		border-radius: 3px;
		cursor: pointer;
		font-family: var(--font-pixel);
		color: var(--color-text-dim);
		outline: none;
	}

	.shape-btn.active {
		border-color: var(--color-gold);
		color: var(--color-gold);
		background: rgba(255, 221, 85, 0.08);
	}

	.shape-btn:hover {
		border-color: var(--color-accent);
	}

	.shape-icon {
		font-size: 14px;
	}

	.shape-cost {
		font-size: 6px;
	}
</style>
