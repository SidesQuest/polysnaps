<script>
	import '../app.css';
	let { children } = $props();
</script>

<div class="app">
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
