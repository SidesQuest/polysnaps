<script>
	import { base } from '$app/paths';
	import GameCanvas from '$lib/components/game/GameCanvas.svelte';
</script>

<svelte:head>
	<title>Polysnaps — Snap. Flow. Grow.</title>
</svelte:head>

<main class="game-container">
	<div class="bg-layer bg-far" style="background-image: url('{base}/assets/tilesets/2%20Background/1.png');"></div>
	<div class="bg-layer bg-mid" style="background-image: url('{base}/assets/tilesets/2%20Background/3.png');"></div>
	<GameCanvas />
</main>

<style>
	.game-container {
		width: 100%;
		height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-bg);
		position: relative;
		overflow: hidden;
	}

	.bg-layer {
		position: absolute;
		inset: -20px;
		background-size: 576px 324px;
		background-repeat: repeat;
		image-rendering: pixelated;
		pointer-events: none;
	}

	.bg-far {
		opacity: 0.07;
		animation: bg-drift-slow 120s linear infinite;
	}

	.bg-mid {
		opacity: 0.04;
		animation: bg-drift-fast 80s linear infinite reverse;
		mix-blend-mode: screen;
	}

	@keyframes bg-drift-slow {
		0% { transform: translate(0, 0); }
		100% { transform: translate(-576px, -324px); }
	}

	@keyframes bg-drift-fast {
		0% { transform: translate(0, 0); }
		100% { transform: translate(-576px, -324px); }
	}
</style>
