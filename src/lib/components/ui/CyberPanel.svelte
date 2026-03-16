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
		background: var(--color-surface);
		border: 2px solid var(--color-border);
		border-radius: var(--panel-radius);
		overflow: hidden;
		box-shadow:
			inset 1px 1px 0 #2a2f55,
			inset -1px -1px 0 #12163a,
			0 4px 16px rgba(0, 0, 0, 0.5);
	}

	.cp[data-accent='cyan'] { border-color: #3a5580; }
	.cp[data-accent='red'] { border-color: #5a2a3a; }
	.cp[data-accent='gold'] { border-color: #6a5a2a; }
	.cp[data-accent='green'] { border-color: #2a6a3a; }

	.cp-scanlines {
		position: absolute;
		inset: 0;
		pointer-events: none;
		background: repeating-linear-gradient(
			135deg,
			transparent,
			transparent 8px,
			rgba(100, 120, 180, 0.012) 8px,
			rgba(100, 120, 180, 0.012) 9px
		);
	}

	.cp-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 10px 14px;
		background: linear-gradient(180deg, #252a58 0%, #1e2248 100%);
		border-bottom: 2px solid var(--color-border);
	}

	.cp-title {
		font-family: var(--font-pixel);
		font-size: 11px;
		color: #9ac0ff;
		letter-spacing: 2px;
		text-shadow: 0 0 10px rgba(136, 170, 255, 0.4);
	}

	.cp[data-accent='red'] .cp-title { color: #ff8888; text-shadow: 0 0 10px rgba(255,100,100,0.4); }
	.cp[data-accent='gold'] .cp-title { color: #ffd644; text-shadow: 0 0 10px rgba(255,221,85,0.4); }
	.cp[data-accent='green'] .cp-title { color: #66ffaa; text-shadow: 0 0 10px rgba(85,255,153,0.4); }

	.cp-close {
		width: 32px;
		height: 32px;
		background: #c33;
		border: 2px solid #944;
		border-radius: 4px;
		color: #fff;
		font-family: var(--font-pixel);
		font-size: 11px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		line-height: 1;
		padding: 0;
		transition: background 0.1s, transform 0.1s;
	}

	.cp-close:hover {
		background: #e55;
		border-color: #b44;
	}

	.cp-close:active {
		background: #a22;
		transform: scale(0.95);
	}

	.cp-body {
		position: relative;
		z-index: 1;
	}
</style>
