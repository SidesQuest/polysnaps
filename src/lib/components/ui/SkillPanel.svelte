<script>
	import { base } from '$app/paths';
	import { gameState } from '$lib/game/state.svelte.js';
	import CyberButton from './CyberButton.svelte';

	let { open = $bindable(false) } = $props();
</script>

<CyberButton variant="purple" onclick={() => (open = true)}>
	{#snippet children()}
		<img src="{base}/assets/ui/9%20Other/3%20Skill%20icons/Skillicon7_08.png" alt="" />
		SKILL TREE
		<span class="pts">🔮 {gameState.prestige.currency}</span>
	{/snippet}
</CyberButton>

<style>
	.pts {
		margin-left: auto;
		color: var(--color-gold);
		font-size: 8px;
		text-shadow: 0 0 6px rgba(255,221,85,0.3);
	}
</style>
