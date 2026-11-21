<script lang="ts">
	import Modal from './Modal.svelte';
	import Icon from './Icon.svelte';

	let { open = $bindable(false), src = '', poster = '' }: { open?: boolean; src: string; poster?: string } = $props();

	let videoEl = $state<HTMLVideoElement | null>(null);
	let failed = $state(false);

	$effect(() => {
		if (!videoEl) return;
		if (open) {
			videoEl.currentTime = 0;
			videoEl.play().catch(() => {});
		}
	});

	function onClose() {
		videoEl?.pause();
	}
</script>

<Modal bind:open size="xl" labelledby="video-title" onclose={onClose}>
	<div class="flex items-center justify-between px-5 py-3 border-b border-slate-100">
		<h2 id="video-title" class="font-semibold text-slate-900 flex items-center gap-2">
			<Icon name="play" class="w-5 h-5 text-indigo-600" />
			Démo de DynaRecrut
		</h2>
		<button type="button" class="btn-icon" aria-label="Fermer la vidéo" onclick={() => { open = false; onClose(); }}>
			<Icon name="x" class="w-5 h-5" />
		</button>
	</div>
	<div class="bg-slate-950 rounded-b-2xl overflow-hidden aspect-video flex items-center justify-center">
		{#if failed}
			<div class="text-center text-white/70 p-8">
				<Icon name="alert" class="w-10 h-10 mx-auto mb-3 text-white/40" />
				<p class="font-medium text-white">Vidéo indisponible</p>
				<p class="text-sm mt-1">Le fichier de démonstration n’a pas pu être chargé.</p>
			</div>
		{:else}
			<!-- svelte-ignore a11y_media_has_caption -->
			<video bind:this={videoEl} {src} {poster} controls playsinline class="w-full h-full" onerror={() => (failed = true)}></video>
		{/if}
	</div>
</Modal>
