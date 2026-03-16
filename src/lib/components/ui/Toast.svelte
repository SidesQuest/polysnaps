<script>
	import { getToasts } from '$lib/game/toast.svelte.js';

	let toasts = $derived(getToasts());

	const TYPE_STYLES = {
		achievement: { icon: '🏆', color: '#ffdd55', big: true },
		combo: { icon: '🔗', color: '#55ff99', big: false },
		challenge: { icon: '⚔', color: '#ff44aa', big: true },
		info: { icon: '◆', color: '#88aaff', big: false },
	};
</script>

{#if toasts.length > 0}
	<div class="toast-container">
		{#each toasts as toast (toast.id)}
			{@const style = TYPE_STYLES[toast.type] || TYPE_STYLES.info}
			<div class="toast" class:toast-big={style.big} style="--toast-color: {style.color};">
				<span class="toast-icon" class:toast-icon-big={style.big}>{style.icon}</span>
				<span class="toast-msg">{toast.message}</span>
			</div>
		{/each}
	</div>
{/if}

<style>
	.toast-container {
		position: fixed;
		top: 60px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 300;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		pointer-events: none;
	}

	.toast {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 16px;
		background: rgba(11, 11, 25, 0.95);
		border: 2px solid var(--toast-color);
		border-radius: 3px;
		box-shadow:
			0 0 12px color-mix(in srgb, var(--toast-color) 30%, transparent),
			inset 0 0 8px color-mix(in srgb, var(--toast-color) 5%, transparent);
		animation: toast-in 0.3s ease-out, toast-out 0.4s ease-in 3s forwards;
		pointer-events: auto;
	}

	.toast-icon {
		font-size: 14px;
		flex-shrink: 0;
	}

	.toast-msg {
		font-family: var(--font-pixel);
		font-size: 8px;
		color: var(--toast-color);
		text-shadow: 0 0 6px color-mix(in srgb, var(--toast-color) 30%, transparent);
		white-space: nowrap;
	}

	.toast-big {
		padding: 12px 20px;
		animation: toast-big-in 0.4s ease-out, toast-out 0.4s ease-in 3s forwards;
		border-width: 3px;
	}

	.toast-big .toast-msg {
		font-size: 10px;
	}

	.toast-icon-big {
		font-size: 20px;
		animation: icon-bounce 0.5s ease-out;
	}

	@keyframes toast-in {
		from {
			opacity: 0;
			transform: translateY(-12px) scale(0.9);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	@keyframes toast-big-in {
		0% {
			opacity: 0;
			transform: translateY(-20px) scale(0.7);
		}
		60% {
			opacity: 1;
			transform: translateY(2px) scale(1.05);
		}
		100% {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	@keyframes icon-bounce {
		0% { transform: scale(0.5) rotate(-20deg); }
		50% { transform: scale(1.3) rotate(5deg); }
		100% { transform: scale(1) rotate(0deg); }
	}

	@keyframes toast-out {
		from { opacity: 1; }
		to { opacity: 0; transform: translateY(-8px); }
	}
</style>
