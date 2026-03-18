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
		padding: 10px 16px;
		font-family: var(--font-pixel);
		font-size: 10px;
		color: #fff;
		cursor: pointer;
		border: 2px solid;
		border-radius: 4px;
		image-rendering: pixelated;
		transition: filter 0.12s, transform 0.08s, background 0.12s;
		text-shadow: 1px 1px 0 rgba(0,0,0,0.5);
		min-height: 40px;
	}

	.cb.small {
		padding: 6px 12px;
		font-size: 9px;
		gap: 6px;
		min-height: 34px;
	}

	.cb[data-variant='red'] {
		background: linear-gradient(180deg, #d43 0%, #b22 100%);
		border-color: #922;
		box-shadow: inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 0 #611;
	}

	.cb[data-variant='red']:hover:not(:disabled) {
		background: linear-gradient(180deg, #e65 0%, #d44 100%);
		filter: brightness(1.1);
	}

	.cb[data-variant='red']:active:not(:disabled) {
		background: linear-gradient(180deg, #a11 0%, #911 100%);
		box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);
		transform: translateY(1px);
	}

	.cb[data-variant='green'] {
		background: linear-gradient(180deg, #3b6 0%, #2a5 100%);
		border-color: #183;
		box-shadow: inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 0 #061;
	}

	.cb[data-variant='green']:hover:not(:disabled) {
		background: linear-gradient(180deg, #4c7 0%, #3b6 100%);
		filter: brightness(1.1);
	}

	.cb[data-variant='green']:active:not(:disabled) {
		background: linear-gradient(180deg, #194 0%, #183 100%);
		box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);
		transform: translateY(1px);
	}

	.cb[data-variant='purple'] {
		background: linear-gradient(180deg, #3a2850 0%, #2a1840 100%);
		border-color: #241538;
		box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 2px 0 #0a0820;
		color: #ccaaee;
	}

	.cb[data-variant='purple']:hover:not(:disabled) {
		background: linear-gradient(180deg, #4b3868 0%, #3a2858 100%);
		color: #eeddff;
	}

	.cb[data-variant='purple']:active:not(:disabled) {
		background: linear-gradient(180deg, #2a1840 0%, #1a1030 100%);
		box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);
		transform: translateY(1px);
	}

	.cb[data-variant='ghost'] {
		background: rgba(100, 140, 255, 0.06);
		border-color: #3a4570;
		box-shadow: none;
		color: #9ac0ff;
	}

	.cb[data-variant='ghost']:hover:not(:disabled) {
		background: rgba(136, 170, 255, 0.12);
		border-color: #5a70a0;
		color: #b8d4ff;
	}

	.cb[data-variant='ghost']:active:not(:disabled) {
		background: rgba(136, 170, 255, 0.06);
		transform: translateY(1px);
	}

	.cb:disabled {
		opacity: 0.35;
		cursor: not-allowed;
		filter: saturate(0.3);
	}

	.cb > :global(img) {
		width: 18px;
		height: 18px;
		image-rendering: pixelated;
	}
</style>
