<script>
	import { onMount, onDestroy } from 'svelte';
	import { PixiRenderer } from '$lib/game/pixi-renderer.js';
	import { gameState, placeShape, canAffordShape, performClick, getNodeProduction, getNodeDepth, getBuffZones, getTierLevel, getEdgeResource, getNodeResource, getGeneratorCount, getShapePlacementCost, getPuzzleSlots, getFogState } from '$lib/game/state.svelte.js';
	import { RESOURCE_DEFS } from '$lib/game/state.svelte.js';
	import { buildGeometryTree, getOpenSlots, getCoreVertices, SHAPE_DEFS } from '$lib/game/shapes.js';
	import { getZoneBonus } from '$lib/game/buffzones.js';
	import { isPointRevealed } from '$lib/game/fog.js';
	import { playClick } from '$lib/game/audio.js';
	import { formatNumber } from '$lib/utils/format.js';

	const CORE_RADIUS = 50;

	let canvasEl = $state(null);
	let renderer = null;
	let selectedShape = $state('triangle');
	let hoveredNode = $state(null);
	let animFrame = null;

	let geometry = $derived(
		buildGeometryTree(gameState.nodes, gameState.coreShape.sides, CORE_RADIUS)
	);
	let openSlots = $derived(
		getOpenSlots(gameState.nodes, gameState.coreShape.sides, CORE_RADIUS)
	);
	let buffZones = $derived(getBuffZones());
	let puzzleSlots = $derived(getPuzzleSlots());
	let fogCells = $derived(getFogState());
	let coreVertices = $derived(getCoreVertices(gameState.coreShape.sides, CORE_RADIUS));

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

	let connectionLines = $derived(
		geometry
			.filter((g) => !g.isCore && g.parentCenter)
			.map((g) => {
				const depth = getNodeDepth(g.node.id);
				const TIER_COLORS = ['#44aaff', '#44ff88', '#ffcc44', '#ff44aa', '#aa44ff', '#44ffff'];
				return {
					x1: g.center.x, y1: g.center.y,
					x2: g.parentCenter.x, y2: g.parentCenter.y,
					color: TIER_COLORS[(depth - 1) % TIER_COLORS.length],
					id: g.node.id
				};
			})
	);

	let geoWithDepth = $derived(
		geometry.map((g) => ({
			...g,
			depth: g.isCore ? 0 : getNodeDepth(g.node.id),
		}))
	);

	onMount(async () => {
		if (!canvasEl) return;

		renderer = new PixiRenderer();
		await renderer.init(canvasEl);

		renderer.onCoreClick = () => {
			const result = performClick();
			playClick();
			const text = result.isBurst ? `⚡${formatNumber(result.value)}!` : `+${formatNumber(result.value)}`;
			const color = result.isBurst ? '#ffcc44' : '#44aaff';
			renderer.spawnClickParticles(0, 0, color);
			renderer.spawnFloatingText(0, -15, text, color);
		};

		renderer.onSlotClick = (slot) => {
			const cost = getShapePlacementCost(selectedShape);
			if (gameState.resources.energy >= cost) {
				const ok = placeShape(slot.parentId, slot.edgeIndex, selectedShape);
				if (ok) {
					const depth = slot.layer || 1;
					const TIER_COLORS = ['#44aaff', '#44ff88', '#ffcc44', '#ff44aa', '#aa44ff', '#44ffff'];
					renderer.spawnClickParticles(
						slot.center.x, slot.center.y,
						TIER_COLORS[(depth - 1) % TIER_COLORS.length],
						6
					);
				}
			}
		};

		renderer.onShapeHover = (geo) => {
			const prod = getNodeProduction(geo.node.id);
			const depth = geo.depth;
			const tierLvl = getTierLevel(depth);
			const TIER_COLORS = ['#44aaff', '#44ff88', '#ffcc44', '#ff44aa', '#aa44ff', '#44ffff'];
			hoveredNode = {
				x: geo.center.x, y: geo.center.y,
				name: `Tier ${depth}`, level: tierLvl,
				production: prod,
				color: TIER_COLORS[(depth - 1) % TIER_COLORS.length],
			};
		};

		renderer.onShapeLeave = () => { hoveredNode = null; };

		const resizeObs = new ResizeObserver(() => {
			if (canvasEl && renderer) {
				renderer.resize(canvasEl.clientWidth, canvasEl.clientHeight);
			}
		});
		resizeObs.observe(canvasEl.parentElement);

		function loop() {
			renderer.renderFrame({
				geometry: geoWithDepth,
				openSlots,
				buffZones,
				connectionLines,
				canAfford: canAffordShape(),
				coreVertices,
				coreEdgeMids,
				puzzleSlots,
				solvedPuzzles: gameState.solvedPuzzles,
				fogCells,
			});
			animFrame = requestAnimationFrame(loop);
		}
		animFrame = requestAnimationFrame(loop);

		return () => {
			resizeObs.disconnect();
			if (animFrame) cancelAnimationFrame(animFrame);
			renderer.destroy();
		};
	});
</script>

<div class="pixi-wrapper">
	<canvas bind:this={canvasEl} class="pixi-canvas"></canvas>

	{#if hoveredNode}
		<div
			class="pixi-tooltip"
			style="left: 50%; top: 50%; transform: translate(-50%, -50%)"
		>
			<span class="tt-title" style="color: {hoveredNode.color}">{hoveredNode.name} Lv.{hoveredNode.level}</span>
			{#if hoveredNode.production > 0}
				<span class="tt-prod">{formatNumber(hoveredNode.production)}/s</span>
			{/if}
		</div>
	{/if}
</div>

<style>
	.pixi-wrapper {
		width: 100%;
		height: 100%;
		position: relative;
	}

	.pixi-canvas {
		width: 100%;
		height: 100%;
		display: block;
	}

	.pixi-tooltip {
		position: absolute;
		background: rgba(11, 11, 25, 0.95);
		border: 1px solid var(--color-border);
		border-radius: 4px;
		padding: 6px 10px;
		display: flex;
		flex-direction: column;
		gap: 2px;
		pointer-events: none;
		font-family: var(--font-pixel);
	}

	.tt-title {
		font-size: 8px;
	}

	.tt-prod {
		font-size: 7px;
		color: var(--color-green);
	}
</style>
