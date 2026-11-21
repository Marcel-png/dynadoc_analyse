<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '@unocss/reset/tailwind.css';
	import 'uno.css';
	import '$lib/styles/global.css';
	import Toaster from '$lib/components/Toaster.svelte';
	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>DynaRecrut — Recrutement intelligent</title>
</svelte:head>

<a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[70] focus:bg-white focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg focus:text-sm focus:font-medium">
	Aller au contenu
</a>

{@render children()}

<Toaster />
