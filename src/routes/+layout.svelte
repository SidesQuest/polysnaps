<script>
	import { base } from '$app/paths';
	import '../app.css';
	import { getTheme } from '$lib/game/theme.svelte.js';
	let { children } = $props();
	let theme = $derived(getTheme());
</script>

<svelte:head>
	{@html `<style>
		@font-face { font-family: "CyberpunkCraftpix"; src: url("${base}/assets/ui/10%20Font/CyberpunkCraftpixPixel.otf") format("opentype"); font-display: swap; }
		:root { --cursor-default: url("${base}/assets/ui/8%20Cursors/1.png") 2 2, auto; --cursor-pointer: url("${base}/assets/ui/8%20Cursors/2.png") 2 2, pointer; }
	</style>`}
</svelte:head>

<div class="app {theme ? `theme-${theme}` : ''}">
	{@render children()}
</div>
<div id="crt-layer"></div>

<style>
	.app {
		width: 100%;
		height: 100vh;
		overflow: hidden;
	}

	@supports (animation: crt-flicker 1s) {
		.app {
			text-shadow: 0.6px 0 rgba(255, 0, 0, 0.12), -0.6px 0 rgba(0, 255, 255, 0.12);
		}
	}
</style>
