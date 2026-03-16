<script>
	import { gameState } from '$lib/game/state.svelte.js';

	const STORAGE_KEY = 'polysnaps_tutorial_done';
	let dismissed = $state(typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY) === '1');
	let step = $state(0);

	const steps = [
		{
			text: 'Tap the core to earn energy',
			icon: '👆',
			anchor: 'center',
		},
		{
			text: 'Use energy to place shapes on edges',
			icon: '🔷',
			anchor: 'center',
		},
		{
			text: 'Shapes generate resources that flow to the core',
			icon: '⚡',
			anchor: 'center',
		},
		{
			text: 'Prestige to evolve your core and unlock new shapes',
			icon: '🔮',
			anchor: 'right',
		},
	];

	let visible = $derived(!dismissed && gameState.stats.totalShapesPlaced < 3);

	function next() {
		if (step < steps.length - 1) {
			step++;
		} else {
			dismiss();
		}
	}

	function dismiss() {
		dismissed = true;
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem(STORAGE_KEY, '1');
		}
	}
</script>

{#if visible}
	<div class="tutorial-overlay">
		<div class="tutorial-box" class:right={steps[step].anchor === 'right'}>
			<div class="tutorial-step-row">
				<span class="tutorial-icon">{steps[step].icon}</span>
				<span class="tutorial-text">{steps[step].text}</span>
			</div>
			<div class="tutorial-controls">
				<span class="tutorial-progress">{step + 1}/{steps.length}</span>
				<div class="tutorial-btns">
					<button class="tutorial-skip" onclick={dismiss}>skip</button>
					<button class="tutorial-next" onclick={next}>
						{step === steps.length - 1 ? 'got it!' : 'next →'}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.tutorial-overlay {
		position: fixed;
		bottom: 100px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 150;
		pointer-events: none;
	}

	.tutorial-box {
		pointer-events: auto;
		background: rgba(11, 11, 25, 0.95);
		border: 2px solid var(--color-accent);
		border-radius: 3px;
		padding: 12px 16px;
		min-width: 260px;
		max-width: 320px;
		box-shadow:
			0 0 16px rgba(136, 170, 255, 0.2),
			inset 0 0 8px rgba(136, 170, 255, 0.03);
		animation: tut-bounce 0.3s ease-out;
	}

	.tutorial-step-row {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 10px;
	}

	.tutorial-icon {
		font-size: 20px;
		flex-shrink: 0;
	}

	.tutorial-text {
		font-family: var(--font-pixel);
		font-size: 8px;
		color: var(--color-text);
		line-height: 1.6;
	}

	.tutorial-controls {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.tutorial-progress {
		font-family: var(--font-pixel);
		font-size: 7px;
		color: var(--color-text-dim);
	}

	.tutorial-btns {
		display: flex;
		gap: 8px;
	}

	.tutorial-skip {
		font-family: var(--font-pixel);
		font-size: 7px;
		color: var(--color-text-dim);
		background: transparent;
		border: none;
		cursor: pointer;
		padding: 4px 6px;
	}

	.tutorial-skip:hover {
		color: var(--color-text);
		text-decoration: underline;
	}

	.tutorial-next {
		font-family: var(--font-pixel);
		font-size: 7px;
		color: var(--color-accent);
		background: rgba(136, 170, 255, 0.08);
		border: 1px solid var(--color-accent);
		border-radius: 2px;
		cursor: pointer;
		padding: 4px 10px;
	}

	.tutorial-next:hover {
		background: rgba(136, 170, 255, 0.15);
	}

	.tutorial-next:active {
		transform: translateY(1px);
	}

	@keyframes tut-bounce {
		0% { opacity: 0; transform: translateY(8px); }
		70% { transform: translateY(-2px); }
		100% { opacity: 1; transform: translateY(0); }
	}
</style>
