<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from './Icon.svelte';

	let { back, actions }: { back?: { href: string; label: string }; actions?: Snippet } = $props();
</script>

<header class="bg-white/80 backdrop-blur-md border-b border-slate-200/70 sticky top-0 z-40">
	<div class="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
		<div class="flex items-center gap-2 min-w-0">
			{#if back}
				<a href={back.href} class="btn-icon -ml-2" aria-label={back.label} title={back.label}>
					<Icon name="arrowLeft" class="w-5 h-5" />
				</a>
			{/if}
			<a href="/" class="flex items-center gap-2.5 min-w-0 rounded-lg" aria-label="DynaRecrut — tableau de bord">
				<span class="w-9 h-9 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-200 flex-shrink-0">
					<Icon name="doc" class="w-5 h-5 text-white" />
				</span>
				<span class="font-bold text-slate-900 tracking-tight hidden sm:block">DynaRecrut</span>
			</a>
		</div>
		{#if actions}
			<div class="flex items-center gap-2">{@render actions()}</div>
		{/if}
	</div>
</header>
