<script>
	import GameCanvas from '$lib/components/game/GameCanvas.svelte';
</script>

<svelte:head>
	<title>Polysnaps — Snap. Flow. Grow.</title>
</svelte:head>

<main class="game-container">
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
	}
</style>
