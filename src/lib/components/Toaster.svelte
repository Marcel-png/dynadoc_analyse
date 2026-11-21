<script lang="ts">
	import { toasts, dismissToast } from '$lib/stores/toast.svelte';
	import Icon from './Icon.svelte';
</script>

<div class="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-2 pointer-events-none w-full max-w-sm px-4" aria-live="polite" role="status">
	{#each toasts as t (t.id)}
		<div class="anim-slide pointer-events-auto w-full flex items-center gap-3 rounded-xl bg-slate-900 text-white px-4 py-3 shadow-xl shadow-slate-900/20 text-sm">
			<span class="flex-shrink-0 {t.kind === 'error' ? 'text-rose-400' : t.kind === 'info' ? 'text-sky-400' : 'text-emerald-400'}">
				<Icon name={t.kind === 'error' ? 'alert' : 'checkCircle'} class="w-5 h-5" />
			</span>
			<span class="flex-1">{t.message}</span>
			<button type="button" class="text-white/50 hover:text-white transition-colors" aria-label="Fermer la notification" onclick={() => dismissToast(t.id)}>
				<Icon name="x" class="w-4 h-4" />
			</button>
		</div>
	{/each}
</div>
