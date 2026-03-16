<script>
	let { variant = 'red', disabled = false, onclick = null, small = false, children } = $props();
</script>

<button
	class="cb"
	class:small
	data-variant={variant}
	{disabled}
	{onclick}
>
	{@render children()}
</button>

<style>
	.cb {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 8px 14px;
		font-family: var(--font-pixel);
		font-size: 9px;
		color: #fff;
		cursor: pointer;
		border: 2px solid;
		border-radius: 2px;
		image-rendering: pixelated;
		transition: filter 0.1s;
		text-shadow: 1px 1px 0 rgba(0,0,0,0.5);
	}

	.cb.small {
		padding: 5px 10px;
		font-size: 8px;
		gap: 6px;
	}

	.cb[data-variant='red'] {
		background: linear-gradient(180deg, #d43 0%, #b22 100%);
		border-color: #822;
		box-shadow: inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 0 #611;
	}

	.cb[data-variant='red']:hover:not(:disabled) {
		background: linear-gradient(180deg, #e54 0%, #c33 100%);
		filter: brightness(1.1);
	}

	.cb[data-variant='red']:active:not(:disabled) {
		background: linear-gradient(180deg, #a11 0%, #911 100%);
		box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);
		transform: translateY(1px);
	}

	.cb[data-variant='green'] {
		background: linear-gradient(180deg, #3a5 0%, #293 100%);
		border-color: #172;
		box-shadow: inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 0 #061;
	}

	.cb[data-variant='green']:hover:not(:disabled) {
		background: linear-gradient(180deg, #4b6 0%, #3a4 100%);
		filter: brightness(1.1);
	}

	.cb[data-variant='green']:active:not(:disabled) {
		background: linear-gradient(180deg, #183 0%, #172 100%);
		box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);
		transform: translateY(1px);
	}

	.cb[data-variant='purple'] {
		background: linear-gradient(180deg, #3a2850 0%, #2a1840 100%);
		border-color: #1a1030;
		box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 2px 0 #0a0820;
		color: #aaa;
	}

	.cb[data-variant='purple']:hover:not(:disabled) {
		background: linear-gradient(180deg, #4a3860 0%, #3a2850 100%);
		color: #ccc;
	}

	.cb[data-variant='purple']:active:not(:disabled) {
		background: linear-gradient(180deg, #2a1840 0%, #1a1030 100%);
		box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);
		transform: translateY(1px);
	}

	.cb[data-variant='ghost'] {
		background: transparent;
		border-color: #3a3f6a;
		box-shadow: none;
		color: #8af;
	}

	.cb[data-variant='ghost']:hover:not(:disabled) {
		background: rgba(136, 170, 255, 0.08);
		border-color: #5a6f9a;
	}

	.cb[data-variant='ghost']:active:not(:disabled) {
		background: rgba(136, 170, 255, 0.04);
		transform: translateY(1px);
	}

	.cb:disabled {
		opacity: 0.35;
		cursor: not-allowed;
		filter: saturate(0.3);
	}

	.cb > :global(img) {
		width: 16px;
		height: 16px;
		image-rendering: pixelated;
	}
</style>
