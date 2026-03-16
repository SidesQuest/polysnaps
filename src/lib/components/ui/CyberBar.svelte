<script>
	let { value = 0, max = 100, color = 'cyan', label = '', showPct = false } = $props();
	let pct = $derived(Math.min(100, Math.max(0, (value / max) * 100)));
</script>

<div class="bar" data-color={color}>
	{#if label}
		<span class="bar-label">{label}</span>
	{/if}
	<div class="bar-track">
		<div class="bar-fill" style="width: {pct}%"></div>
		<div class="bar-shine"></div>
	</div>
	{#if showPct}
		<span class="bar-pct">{pct.toFixed(0)}%</span>
	{/if}
</div>

<style>
	.bar {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
	}

	.bar-label {
		font-family: var(--font-pixel);
		font-size: 9px;
		color: var(--color-text-dim);
		white-space: nowrap;
		min-width: 30px;
	}

	.bar-track {
		flex: 1;
		height: 14px;
		background: #0c0e1c;
		border: 2px solid #2a3058;
		border-radius: 3px;
		position: relative;
		overflow: hidden;
	}

	.bar-fill {
		height: 100%;
		border-radius: 1px;
		transition: width 0.3s;
	}

	.bar[data-color='cyan'] .bar-fill {
		background: linear-gradient(180deg, #4cf 0%, #28a 100%);
		box-shadow: 0 0 6px rgba(68, 204, 255, 0.5);
	}

	.bar[data-color='red'] .bar-fill {
		background: linear-gradient(180deg, #f64 0%, #c32 100%);
		box-shadow: 0 0 6px rgba(255, 100, 50, 0.5);
	}

	.bar[data-color='green'] .bar-fill {
		background: linear-gradient(180deg, #5f8 0%, #3a6 100%);
		box-shadow: 0 0 6px rgba(85, 255, 130, 0.5);
	}

	.bar[data-color='gold'] .bar-fill {
		background: linear-gradient(180deg, #fd5 0%, #ca3 100%);
		box-shadow: 0 0 6px rgba(255, 221, 85, 0.5);
	}

	.bar[data-color='purple'] .bar-fill {
		background: linear-gradient(180deg, #a5f 0%, #73c 100%);
		box-shadow: 0 0 6px rgba(170, 85, 255, 0.5);
	}

	.bar-shine {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 40%;
		background: linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 100%);
		pointer-events: none;
	}

	.bar-pct {
		font-family: var(--font-pixel);
		font-size: 9px;
		color: var(--color-text);
		min-width: 32px;
		text-align: right;
	}
</style>
