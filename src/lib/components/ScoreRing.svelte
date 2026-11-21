<script lang="ts">
	import { scoreTone } from '$lib/utils/score';

	let { value, size = 56, stroke = 3.5, label = true }: { value: number; size?: number; stroke?: number; label?: boolean } = $props();

	const tone = $derived(scoreTone(value));
	const pct = $derived(Math.max(0, Math.min(100, value)));
</script>

<div class="relative flex-shrink-0" style="width:{size}px;height:{size}px" role="img" aria-label="Score {value} % ({tone.label})">
	<svg class="w-full h-full -rotate-90" viewBox="0 0 36 36">
		<circle cx="18" cy="18" r="15.915" fill="none" class="stroke-slate-100" stroke-width={stroke} />
		<circle
			cx="18"
			cy="18"
			r="15.915"
			fill="none"
			class="{tone.ring} transition-[stroke-dasharray] duration-700 ease-out"
			stroke-width={stroke}
			stroke-dasharray="{pct} 100"
			stroke-linecap="round"
		/>
	</svg>
	{#if label}
		<span class="absolute inset-0 flex items-center justify-center font-bold tabular {tone.text}" style="font-size:{Math.round(size * 0.26)}px">
			{value}<span class="text-[0.6em] font-semibold">%</span>
		</span>
	{/if}
</div>
