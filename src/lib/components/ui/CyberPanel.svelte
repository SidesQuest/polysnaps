<script>
	let { title = '', closable = false, onclose = null, accent = 'cyan', children } = $props();
</script>

<div class="cp" class:has-title={!!title} data-accent={accent}>
	{#if title}
		<div class="cp-header">
			<span class="cp-title">{title}</span>
			{#if closable && onclose}
				<button class="cp-close" onclick={onclose}>✕</button>
			{/if}
		</div>
	{/if}
	<div class="cp-body">
		{@render children()}
	</div>
	<div class="cp-scanlines"></div>
</div>

<style>
	.cp {
		position: relative;
		background: #191d38;
		border: 3px solid #3a3f6a;
		border-radius: 3px;
		overflow: hidden;
		box-shadow:
			inset 1px 1px 0 #2a2f55,
			inset -1px -1px 0 #14183a,
			0 2px 8px rgba(0, 0, 0, 0.5);
	}

	.cp[data-accent='cyan'] { border-color: #3a4a6a; }
	.cp[data-accent='red'] { border-color: #5a2a3a; }
	.cp[data-accent='gold'] { border-color: #5a4a2a; }
	.cp[data-accent='green'] { border-color: #2a5a3a; }

	.cp-scanlines {
		position: absolute;
		inset: 0;
		pointer-events: none;
		background: repeating-linear-gradient(
			135deg,
			transparent,
			transparent 8px,
			rgba(100, 120, 180, 0.015) 8px,
			rgba(100, 120, 180, 0.015) 9px
		);
	}

	.cp-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8px 12px;
		background: linear-gradient(180deg, #222750 0%, #1c2040 100%);
		border-bottom: 2px solid #3a3f6a;
	}

	.cp-title {
		font-family: var(--font-pixel);
		font-size: 10px;
		color: #8af;
		letter-spacing: 2px;
		text-shadow: 0 0 8px rgba(136, 170, 255, 0.3);
	}

	.cp[data-accent='red'] .cp-title { color: #f66; text-shadow: 0 0 8px rgba(255,100,100,0.3); }
	.cp[data-accent='gold'] .cp-title { color: #fd5; text-shadow: 0 0 8px rgba(255,221,85,0.3); }
	.cp[data-accent='green'] .cp-title { color: #5f9; text-shadow: 0 0 8px rgba(85,255,153,0.3); }

	.cp-close {
		width: 20px;
		height: 20px;
		background: #c33;
		border: 2px solid #822;
		border-radius: 2px;
		color: #fff;
		font-family: var(--font-pixel);
		font-size: 8px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		line-height: 1;
		padding: 0;
		image-rendering: pixelated;
	}

	.cp-close:hover {
		background: #e44;
		border-color: #a33;
	}

	.cp-close:active {
		background: #911;
		transform: translate(1px, 1px);
	}

	.cp-body {
		position: relative;
		z-index: 1;
	}
</style>
