<script>
	import { onMount } from 'svelte';
	import { gameState, placeShape, canAffordShape, addResource, getNodeProduction, getNodeDepth, getBuffZones, getClickValue, performClick, getTierLevel, getNodeChildren, getEdgeResource, getNodeResource, getGeneratorCount, getAvailableShapes, getShapePlacementCost, getShapeResourceCosts, getFogState, getPuzzleSlots, getPentagonStorage, getPentagonCapacity, releasePentagonBurst, undoLastPlacement, getLastPlacement } from '$lib/game/state.svelte.js';
	import { RESOURCE_DEFS } from '$lib/game/state.svelte.js';
	import { buildGeometryTree, getOpenSlots, verticesToString, getPolygonPointsString, getCoreVertices, SHAPE_DEFS } from '$lib/game/shapes.js';
	import { isPointRevealed, FOG_CELL_SIZE, getRevealedCells } from '$lib/game/fog.js';
	import { getZoneBonus } from '$lib/game/buffzones.js';
	import { playClick, playError } from '$lib/game/audio.js';
	import { formatNumber } from '$lib/utils/format.js';

	const CORE_RADIUS = 50;
	const TIER_COLORS = ['#44aaff', '#44ff88', '#ffcc44', '#ff44aa', '#aa44ff', '#44ffff'];
	const MAX_FLOW_PATHS = 10;

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
	let selectedCosts = $derived(getShapeResourceCosts(selectedShape));
	let fogCells = $derived(getFogState());
	let puzzleSlots = $derived(getPuzzleSlots());
	let showUndo = $state(false);
	let panX = $state(0);
	let panY = $state(0);
	let zoom = $state(1);
	let isPanning = $state(false);
	let lastMouse = $state({ x: 0, y: 0 });

	let geometry = $derived(
		buildGeometryTree(gameState.nodes, gameState.coreShape.sides, CORE_RADIUS)
	);

	let allOpenSlots = $derived(
		getOpenSlots(gameState.nodes, gameState.coreShape.sides, CORE_RADIUS, selectedShape)
	);

	let maxPlacedDepth = $derived.by(() => {
		let maxD = 0;
		for (const n of gameState.nodes) {
			if (n.id === 'core') continue;
			let d = 0, cur = n;
			while (cur && cur.parentId) { d++; cur = gameState.nodes.find(nd => nd.id === cur.parentId); }
			if (d > maxD) maxD = d;
		}
		return maxD;
	});

	let openSlots = $derived(
		allOpenSlots.filter(s => s.layer <= maxPlacedDepth + 1)
	);

	let buffZones = $derived(getBuffZones());

	let fogRevealCoords = $derived.by(() => {
		const coords = [];
		for (const key of fogCells) {
			const parts = key.split(',');
			coords.push({
				x: Number(parts[0]) * FOG_CELL_SIZE,
				y: Number(parts[1]) * FOG_CELL_SIZE,
			});
		}
		return coords;
	});

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
			let resColor = getLayerColor(depth);
			let traceNode = leaf.node;
			while (traceNode && traceNode.parentId && traceNode.parentId !== 'core') {
				traceNode = gameState.nodes.find((n) => n.id === traceNode.parentId);
			}
			if (traceNode && traceNode.parentId === 'core') {
				const resKey = getEdgeResource(traceNode.edgeIndex);
				const resDef = RESOURCE_DEFS[resKey];
				if (resDef) resColor = resDef.color;
			}
			const segCount = points.length - 1;
			const dur = 1.2 + segCount * 0.5;

			return { id: leaf.node.id, path: pathStr, color: resColor, dur, depth };
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

	function triggerShake(intensity = 4) {
		shakeX = (Math.random() - 0.5) * intensity;
		shakeY = (Math.random() - 0.5) * intensity;
		setTimeout(() => { shakeX = 0; shakeY = 0; }, 120);
	}

	function haptic(ms = 15) {
		if (typeof navigator !== 'undefined' && navigator.vibrate) {
			navigator.vibrate(ms);
		}
	}

	let coreFlash = $state(false);

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
		triggerShake(result.isBurst ? 8 : 2);
		haptic(result.isBurst ? 40 : 10);

		const text = result.isBurst ? `⚡${formatNumber(result.value)}!` : `+${formatNumber(result.value)}`;
		const color = result.isBurst ? '#ffcc44' : '#88ccff';
		spawnFloatingNum(0, -15, text, color);

		if (result.isBurst) {
			coreFlash = true;
			setTimeout(() => (coreFlash = false), 300);
		}
	}

	function handleSlotClick(e, slot) {
		e.preventDefault();
		e.stopPropagation();
		if (canAffordShape(selectedShape)) {
			const ok = placeShape(slot.parentId, slot.edgeIndex, selectedShape);
			if (ok) {
				const depth = slot.layer || 1;
				spawnPlaceParticles(slot.center.x, slot.center.y, getLayerColor(depth));
				haptic(20);
				const prod = getNodeProduction(gameState.nodes[gameState.nodes.length - 1]?.id);
				if (prod > 0) {
					const resKey = slot.parentId === 'core' ? getEdgeResource(slot.edgeIndex) : null;
					const resDef = resKey ? RESOURCE_DEFS[resKey] : null;
					const prodColor = resDef ? resDef.color : getLayerColor(depth);
					spawnFloatingNum(slot.center.x, slot.center.y - 10, `+${formatNumber(prod)}/s`, prodColor);
				}
				showUndo = true;
				if (typeof window !== 'undefined') {
					setTimeout(() => { showUndo = false; }, 5000);
				}
			} else {
				playError();
			}
		} else {
			playError();
			haptic(5);
		}
	}

	function handlePentagonClick(e, geo) {
		e.preventDefault();
		e.stopPropagation();
		const stored = getPentagonStorage(geo.node.id);
		if (stored <= 0) return;
		const released = releasePentagonBurst(geo.node.id);
		if (released > 0) {
			const res = getNodeResource(geo.node.id);
			const resDef = RESOURCE_DEFS[res];
			spawnFloatingNum(geo.center.x, geo.center.y - 15, `${resDef.icon}+${formatNumber(released)}!`, resDef.color);
			spawnPlaceParticles(geo.center.x, geo.center.y, resDef.color);
			triggerShake();
		}
	}

	let isTouchDevice = $state(false);
	let lastTouchDist = $state(0);

	onMount(() => {
		isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
	});

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

	function handleTouchStart(e) {
		if (e.touches.length === 2) {
			e.preventDefault();
			isPanning = true;
			const dx = e.touches[0].clientX - e.touches[1].clientX;
			const dy = e.touches[0].clientY - e.touches[1].clientY;
			lastTouchDist = Math.sqrt(dx * dx + dy * dy);
			const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
			const my = (e.touches[0].clientY + e.touches[1].clientY) / 2;
			lastMouse = { x: mx, y: my };
		} else if (e.touches.length === 1) {
			isPanning = true;
			lastMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
		}
	}

	function handleTouchMove(e) {
		if (e.touches.length === 2) {
			e.preventDefault();
			const dx = e.touches[0].clientX - e.touches[1].clientX;
			const dy = e.touches[0].clientY - e.touches[1].clientY;
			const dist = Math.sqrt(dx * dx + dy * dy);
			if (lastTouchDist > 0) {
				const scale = dist / lastTouchDist;
				zoom = Math.max(0.3, Math.min(5, zoom * scale));
			}
			lastTouchDist = dist;
			const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
			const my = (e.touches[0].clientY + e.touches[1].clientY) / 2;
			panX += (mx - lastMouse.x) * 0.5 / zoom;
			panY += (my - lastMouse.y) * 0.5 / zoom;
			lastMouse = { x: mx, y: my };
		} else if (e.touches.length === 1 && isPanning) {
			const dx = e.touches[0].clientX - lastMouse.x;
			const dy = e.touches[0].clientY - lastMouse.y;
			if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
				panX += dx * 0.5 / zoom;
				panY += dy * 0.5 / zoom;
				lastMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
			}
		}
	}

	function handleTouchEnd(e) {
		if (e.touches.length < 2) {
			lastTouchDist = 0;
		}
		if (e.touches.length === 0) {
			isPanning = false;
		}
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
		const shapeDef = SHAPE_DEFS[geo.node.shape];

		let subtitle = '';
		if (shapeDef?.role === 'storage' && depth === 1) {
			const stored = getPentagonStorage(geo.node.id);
			const capacity = getPentagonCapacity(geo.node.id);
			subtitle = `${resDef.icon} Stored: ${formatNumber(stored)}/${formatNumber(capacity)} · TAP`;
		} else if (shapeDef?.role === 'synergy' && depth === 1) {
			subtitle = `${resDef.icon} Synergy +${((shapeDef.synergyBoost || 0.15) * 100).toFixed(0)}% all`;
		} else if (depth === 1) {
			subtitle = `${resDef.icon} ${resDef.name} · ${Math.round(genCount)} gens`;
		} else {
			const feedRate = Math.round(0.1 * tierLvl * 10) / 10;
			subtitle = `Feeds T${depth - 1} +${feedRate > 1 ? Math.round(feedRate) : feedRate}/s`;
		}

		hoveredNode = {
			x: geo.center.x,
			y: geo.center.y - 22,
			name: `${shapeDef?.name || 'Tier ' + depth}`,
			level: tierLvl,
			production: prod,
			zoneBonus,
			id: geo.node.id,
			color,
			subtitle,
			role: shapeDef?.role,
		};
	}

	function handleKeyboardShortcut(e) {
		if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
		const shapeKeys = ['triangle', 'square', 'pentagon', 'hexagon'];
		if (e.key >= '1' && e.key <= '4') {
			const idx = parseInt(e.key) - 1;
			if (idx < availableShapes.length) {
				selectedShape = availableShapes[idx].key;
			}
			e.preventDefault();
		}
		if (e.key === ' ' || e.key === 'Space') {
			e.preventDefault();
			handleCoreClick(e);
		}
	}
</script>

<svelte:window onkeydown={handleKeyboardShortcut} />

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
	ontouchstart={handleTouchStart}
	ontouchmove={handleTouchMove}
	ontouchend={handleTouchEnd}
	role="img"
>
	<defs>
		{#each TIER_COLORS as color, i}
			<radialGradient id="shape-fill-{i}" cx="50%" cy="50%" r="60%">
				<stop offset="0%" stop-color="{color}" stop-opacity="0.03" />
				<stop offset="100%" stop-color="{color}" stop-opacity="0.12" />
			</radialGradient>
			<radialGradient id="shape-fill-bright-{i}" cx="50%" cy="50%" r="60%">
				<stop offset="0%" stop-color="{color}" stop-opacity="0.06" />
				<stop offset="100%" stop-color="{color}" stop-opacity="0.18" />
			</radialGradient>
		{/each}
	</defs>

	{#each buffZones as zone}
		{@const hexPoints = Array.from({length: 6}, (_, i) => {
			const a = (i * Math.PI * 2) / 6 - Math.PI / 6;
			return `${zone.x + zone.radius * Math.cos(a)},${zone.y + zone.radius * Math.sin(a)}`;
		}).join(' ')}
		<polygon
			points={hexPoints}
			fill="{zone.color}08"
			stroke={zone.color}
			stroke-width="0.8"
			stroke-dasharray="8 6"
			opacity="0.25"
			class="buff-zone"
		/>
		<text x={zone.x} y={zone.y + 4} class="zone-label-name" fill={zone.color}>
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

	{#each connectionLines as cl (cl.id)}
		<line
			x1={cl.x1} y1={cl.y1} x2={cl.x2} y2={cl.y2}
			stroke={cl.color}
			stroke-width="0.8"
			opacity="0.2"
		/>
	{/each}

	{#each flowPaths as fp (fp.id)}
		<circle r="4" fill={fp.color} opacity="0.3" class="flow-particle">
			<animateMotion dur="{fp.dur}s" repeatCount="indefinite" path={fp.path} />
			<animate attributeName="opacity" values="0.3;1;1;0.3" dur="{fp.dur}s" repeatCount="indefinite" />
			<animate attributeName="r" values="3;4;3" dur="{fp.dur}s" repeatCount="indefinite" />
		</circle>
		<circle r="2.5" fill={fp.color} opacity="0.2" class="flow-particle">
			<animateMotion dur="{fp.dur}s" begin="{fp.dur * 0.4}s" repeatCount="indefinite" path={fp.path} />
			<animate attributeName="opacity" values="0.2;0.9;0.9;0.2" dur="{fp.dur}s" begin="{fp.dur * 0.4}s" repeatCount="indefinite" />
		</circle>
	{/each}

	{#if canAffordShape(selectedShape)}
		{#each openSlots as slot}
			{@const slotResKey = slot.parentId === 'core' ? getEdgeResource(slot.edgeIndex) : null}
			{@const slotRes = slotResKey ? RESOURCE_DEFS[slotResKey] : null}
			{@const isCore = slot.parentId === 'core'}
			<g class="slot-group" class:core-slot={isCore}>
				<polygon
					points={verticesToString(slot.vertices)}
					class="empty-slot affordable"
					onclick={(e) => handleSlotClick(e, slot)}
					onkeydown={(e) => e.key === 'Enter' && handleSlotClick(e, slot)}
					role="button"
					tabindex="0"
				/>
				{#if slotRes}
					<text
						x={slot.center.x}
						y={slot.center.y + 3}
						class="slot-resource-hint"
						fill={slotRes.color}
					>{slotRes.icon}</text>
				{:else}
					<circle cx={slot.center.x} cy={slot.center.y} r="3" class="slot-dot" />
				{/if}
			</g>
		{/each}
	{/if}

	{#each geometry as geo}
		{#if geo.isCore}
		<g class="core" class:pulse={pulseCore}>
			{#each clickRipples as rid (rid)}
				<circle cx="0" cy="0" r="10" class="click-ripple" />
			{/each}
			
			{#if gameState.prestige.level >= 2}
				<circle cx="0" cy="0" r={CORE_RADIUS + 15} class="core-aura" style="stroke: {gameState.prestige.level >= 3 ? '#aa44ff' : '#44aaff'};" />
			{/if}
			
			<polygon
				points={verticesToString(geo.vertices)}
				class="core-polygon"
				class:core-p1={gameState.prestige.level >= 1}
				class:core-p2={gameState.prestige.level >= 2}
				class:core-p3={gameState.prestige.level >= 3}
				onclick={handleCoreClick}
				onkeydown={(e) => e.key === 'Enter' && handleCoreClick(e)}
				role="button"
				tabindex="0"
			/>
			<polygon
				points={getPolygonPointsString(gameState.coreShape.sides, CORE_RADIUS - 10)}
				class="core-inner"
				class:core-inner-glow={gameState.prestige.level >= 1}
			/>
			<text y="4" class="core-text">TAP</text>
			{#if coreFlash}
				<circle cx="0" cy="0" r="60" class="core-burst-flash" />
			{/if}
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
			{@const roleIcon = shapeDef?.role === 'multiplier' ? '×' : shapeDef?.role === 'storage' ? '▣' : shapeDef?.role === 'synergy' ? '✦' : ''}
			{@const isPentagon = shapeDef?.role === 'storage' && depth === 1}
			{@const isHexSynergy = shapeDef?.role === 'synergy' && depth === 1}
			{@const pentStored = isPentagon ? getPentagonStorage(geo.node.id) : 0}
			{@const pentCap = isPentagon ? getPentagonCapacity(geo.node.id) : 1}
			{@const pentPct = isPentagon ? Math.min(1, pentStored / pentCap) : 0}
			<polygon
				points={verticesToString(geo.vertices)}
				class="placed-shape"
				class:in-zone={inZone}
				class:pentagon-full={isPentagon && pentPct > 0.9}
				class:pentagon-clickable={isPentagon && pentStored > 0}
				class:hex-synergy={isHexSynergy}
				style="stroke: {color}; fill: url(#shape-fill-{(depth - 1) % TIER_COLORS.length});"
				onclick={isPentagon ? (e) => handlePentagonClick(e, geo) : undefined}
				onmouseenter={() => handleShapeHover(geo)}
				onmouseleave={() => (hoveredNode = null)}
				role={isPentagon ? 'button' : 'img'}
				tabindex={isPentagon ? '0' : undefined}
				onkeydown={isPentagon ? (e) => e.key === 'Enter' && handlePentagonClick(e, geo) : undefined}
			/>
			{#if isPentagon && pentPct > 0}
				<rect
					x={geo.center.x - 12}
					y={geo.center.y + 6}
					width={24}
					height={3}
					rx="1"
					fill="rgba(0,0,0,0.5)"
					stroke={color}
					stroke-width="0.5"
					class="storage-bar-bg"
				/>
				<rect
					x={geo.center.x - 12}
					y={geo.center.y + 6}
					width={24 * pentPct}
					height={3}
					rx="1"
					fill={color}
					opacity={pentPct > 0.9 ? 1 : 0.6}
					class="storage-bar-fill"
				/>
			{/if}
			<text
				x={geo.center.x}
				y={geo.center.y + (roleIcon ? 0 : 3)}
				class="shape-level"
				style="fill: {color};"
			>
				{tierLvl}
			</text>
			{#if roleIcon}
				<text x={geo.center.x} y={geo.center.y + (isPentagon ? 14 : 7)} class="shape-role" style="fill: {color};">{roleIcon}</text>
			{/if}
		{/if}
	{/each}

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
	>{isTouchDevice ? 'pinch to zoom · drag to pan' : 'scroll to zoom · shift+drag to pan'}</text>
</svg>

{#if hoveredNode}
	<div class="html-tooltip" style="--tt-color: {hoveredNode.color};">
		<div class="tt-row">
			<span class="tt-name" style="color: {hoveredNode.color};">{hoveredNode.name}</span>
			<span class="tt-level">Lv.{hoveredNode.level}</span>
		</div>
		{#if hoveredNode.production > 0}
			<span class="tt-prod">+{formatNumber(hoveredNode.production)}/s</span>
		{/if}
		<span class="tt-sub">{hoveredNode.subtitle}</span>
		{#if hoveredNode.zoneBonus > 1}
			<span class="tt-zone">Zone: {hoveredNode.zoneBonus}×</span>
		{/if}
	</div>
{/if}

{#if availableShapes.length > 1}
	<div class="shape-selector">
		{#each availableShapes as shape}
			{@const costs = getShapeResourceCosts(shape.key)}
			{@const costEntries = Object.entries(costs).filter(([,v]) => v > 0)}
			{@const affordable = canAffordShape(shape.key)}
			<button
				class="shape-btn"
				class:active={selectedShape === shape.key}
				class:affordable
				onclick={() => (selectedShape = shape.key)}
				title="{shape.name}: {shape.description}"
			>
				<span class="shape-icon">{shape.sides === 3 ? '△' : shape.sides === 4 ? '□' : shape.sides === 5 ? '⬠' : '⬡'}</span>
				<span class="shape-label">{shape.name}</span>
				<span class="shape-cost">
					{#each costEntries as [res, amt]}
						<span style="color: {RESOURCE_DEFS[res]?.color || '#888'};">{RESOURCE_DEFS[res]?.icon}{formatNumber(amt)}</span>
					{/each}
				</span>
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

	.zone-label-name {
		font-family: var(--font-pixel);
		font-size: 5px;
		text-anchor: middle;
		pointer-events: none;
		opacity: 0.35;
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
		fill: var(--color-text);
		font-family: var(--font-pixel);
		font-size: 10px;
		text-anchor: middle;
		pointer-events: none;
		opacity: 0.8;
		animation: core-text-pulse 2s ease-in-out infinite alternate;
	}

	@keyframes core-text-pulse {
		0% { opacity: 0.6; }
		100% { opacity: 1; }
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

	.core-aura {
		fill: none;
		stroke-width: 1;
		opacity: 0.2;
		pointer-events: none;
		animation: core-aura-pulse 3s ease-in-out infinite;
	}

	@keyframes core-aura-pulse {
		0%, 100% { opacity: 0.1; r: attr(r); }
		50% { opacity: 0.3; }
	}

	.core-polygon.core-p1 {
		filter: drop-shadow(0 0 4px rgba(68, 170, 255, 0.3));
	}

	.core-polygon.core-p2 {
		filter: drop-shadow(0 0 8px rgba(68, 170, 255, 0.4));
		stroke-width: 3;
	}

	.core-polygon.core-p3 {
		filter: drop-shadow(0 0 12px rgba(170, 68, 255, 0.5));
		stroke-width: 3;
		stroke: #aa66ff;
	}

	.core-inner-glow {
		opacity: 0.25;
		animation: core-inner-pulse 2s ease-in-out infinite alternate;
	}

	@keyframes core-inner-pulse {
		0% { opacity: 0.15; }
		100% { opacity: 0.35; }
	}

	.core:not(.pulse) .core-polygon {
		animation: core-idle-pulse 3s ease-in-out infinite;
	}

	@keyframes core-idle-pulse {
		0%, 100% { filter: brightness(1); }
		50% { filter: brightness(1.15); }
	}

	.placed-shape {
		stroke-width: 1.8;
		cursor: default;
		transition: filter 0.3s;
	}

	.placed-shape:hover {
		filter: brightness(1.3);
	}

	.placed-shape.in-zone {
		filter: brightness(1.1);
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

	.slot-group {
		opacity: 0.2;
		transition: opacity 0.2s;
	}

	.slot-group:hover {
		opacity: 1;
	}

	.slot-group.core-slot {
		opacity: 0.5;
	}

	.slot-group.core-slot:hover {
		opacity: 1;
	}

	.empty-slot {
		fill: transparent;
		stroke: var(--color-gold);
		stroke-width: 0.8;
		stroke-dasharray: 4 5;
		cursor: pointer;
		outline: none;
		transition: fill 0.15s, stroke-width 0.15s;
	}

	.slot-group:hover .empty-slot {
		fill: rgba(255, 221, 85, 0.08);
		stroke-width: 1.5;
		stroke-dasharray: 5 3;
	}

	.slot-dot {
		fill: var(--color-gold);
		opacity: 0.5;
		pointer-events: none;
	}

	.slot-resource-hint {
		font-size: 7px;
		text-anchor: middle;
		pointer-events: none;
		opacity: 0.6;
	}

	.html-tooltip {
		position: absolute;
		bottom: 80px;
		left: 50%;
		transform: translateX(-50%);
		background: rgba(10, 10, 25, 0.95);
		border: 2px solid var(--tt-color);
		border-radius: 6px;
		padding: 10px 16px;
		display: flex;
		flex-direction: column;
		gap: 4px;
		font-family: var(--font-pixel);
		pointer-events: none;
		z-index: 5;
		min-width: 180px;
		box-shadow: 0 4px 16px rgba(0,0,0,0.5), 0 0 8px color-mix(in srgb, var(--tt-color) 20%, transparent);
		animation: tt-slide-in 0.15s ease-out;
	}

	.tt-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
	}

	.tt-name {
		font-size: 11px;
		letter-spacing: 1px;
	}

	.tt-level {
		font-size: 10px;
		color: var(--color-text-dim);
	}

	.tt-prod {
		font-size: 10px;
		color: var(--color-green);
	}

	.tt-sub {
		font-size: 9px;
		color: var(--color-text-dim);
		line-height: 1.4;
	}

	.tt-zone {
		font-size: 9px;
		color: var(--color-gold);
	}

	@keyframes tt-slide-in {
		from { opacity: 0; transform: translateX(-50%) translateY(4px); }
		to { opacity: 1; transform: translateX(-50%) translateY(0); }
	}

	.controls-hint {
		font-family: var(--font-pixel);
		font-size: 5px;
		fill: var(--color-text);
		opacity: 0.45;
	}

	.click-ripple {
		fill: none;
		stroke: var(--color-accent);
		stroke-width: 2.5;
		pointer-events: none;
		animation: ripple-expand 0.6s ease-out forwards;
	}

	.core-burst-flash {
		fill: rgba(255, 221, 85, 0.3);
		pointer-events: none;
		animation: burst-flash 0.3s ease-out forwards;
	}

	@keyframes burst-flash {
		0% { opacity: 1; r: 30; }
		100% { opacity: 0; r: 100; }
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
		font-size: 10px;
		text-anchor: middle;
		pointer-events: none;
		animation: float-up 1s ease-out forwards;
		filter: drop-shadow(0 0 3px currentColor);
	}

	@keyframes float-up {
		0% {
			opacity: 1;
			transform: translateY(0) scale(1.2);
		}
		15% {
			transform: translateY(-5px) scale(1);
		}
		70% { opacity: 1; }
		100% {
			opacity: 0;
			transform: translateY(-35px) scale(0.8);
		}
	}

	.place-particle {
		pointer-events: none;
	}

	.pentagon-clickable {
		cursor: pointer;
	}

	.pentagon-clickable:hover {
		filter: brightness(1.3);
	}

	.pentagon-full {
		animation: pentagon-pulse 1s ease-in-out infinite alternate;
	}

	@keyframes pentagon-pulse {
		0% { filter: brightness(1); }
		100% { filter: brightness(1.4); }
	}

	.storage-bar-bg, .storage-bar-fill {
		pointer-events: none;
	}

	.hex-synergy {
		animation: hex-glow 2s ease-in-out infinite alternate;
		filter: drop-shadow(0 0 3px rgba(170, 68, 255, 0.4));
	}

	@keyframes hex-glow {
		0% { filter: drop-shadow(0 0 2px rgba(170, 68, 255, 0.3)) brightness(1); }
		100% { filter: drop-shadow(0 0 6px rgba(170, 68, 255, 0.6)) brightness(1.15); }
	}

	.buff-zone {
		animation: zone-glow 3s ease-in-out infinite alternate;
	}

	@keyframes zone-glow {
		0% { opacity: 0.2; }
		100% { opacity: 0.3; }
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
		bottom: 14px;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		gap: 8px;
		background: rgba(14, 16, 36, 0.97);
		border: 2px solid var(--color-border);
		border-radius: 8px;
		padding: 10px 14px;
		backdrop-filter: blur(8px);
		box-shadow: 0 4px 20px rgba(0,0,0,0.5);
	}

	.shape-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 5px;
		padding: 10px 16px;
		background: transparent;
		border: 2px solid var(--color-border);
		border-radius: 6px;
		cursor: pointer;
		font-family: var(--font-pixel);
		color: var(--color-text-dim);
		outline: none;
		opacity: 0.5;
		transition: border-color 0.15s, opacity 0.15s, background 0.15s;
		min-width: 44px;
		min-height: 44px;
	}

	.shape-btn.affordable {
		opacity: 0.85;
	}

	.shape-btn.active {
		border-color: var(--color-gold);
		color: var(--color-gold);
		background: rgba(255, 221, 85, 0.1);
		opacity: 1;
		box-shadow: 0 0 8px rgba(255, 221, 85, 0.2);
	}

	.shape-btn:hover {
		border-color: var(--color-accent);
		background: rgba(100, 140, 255, 0.06);
		opacity: 1;
	}

	.shape-icon {
		font-size: 22px;
	}

	.shape-label {
		font-size: 9px;
		letter-spacing: 1px;
	}

	.shape-cost {
		font-size: 9px;
		display: flex;
		gap: 6px;
	}

	@media (max-width: 768px) {
		.shape-selector {
			bottom: 10px;
			padding: 8px 10px;
			gap: 6px;
			max-width: 96vw;
			overflow-x: auto;
		}

		.shape-btn {
			padding: 8px 12px;
			min-width: 60px;
		}

		.shape-icon {
			font-size: 18px;
		}

		.shape-label {
			font-size: 8px;
		}

		.shape-cost {
			font-size: 8px;
		}
	}
</style>
