<script lang="ts">
  import { onDestroy } from 'svelte';

  let { open = false, src = '', poster = '' }: { open: boolean; src: string; poster?: string } = $props();
  let videoEl: HTMLVideoElement | null = $state(null);

  $effect(() => {
    if (videoEl) {
      if (open) {
        videoEl.currentTime = 0;
        const p = videoEl.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } else {
        videoEl.pause();
        try { videoEl.currentTime = 0; } catch(e) {}
      }
    }
  });

  function close() {
    open = false;
  }

  onDestroy(() => {
    if (videoEl) {
      try { videoEl.pause(); } catch(e) {}
    }
  });
</script>

{#if open}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onclick={close} role="dialog" tabindex="-1">
    <div class="max-w-3xl w-full mx-4" onclick={(e) => e.stopPropagation()} role="document">
      <div class="bg-white rounded-lg overflow-hidden">
        <div class="relative">
          <video bind:this={videoEl} src={src} poster={poster} controls playsinline class="w-full h-auto bg-black"></video>
          <button aria-label="Fermer" class="absolute top-3 right-3 bg-white/90 rounded-full p-2 shadow" onclick={close}>
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}