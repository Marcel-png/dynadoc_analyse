<script lang="ts">
	import type { Snippet } from 'svelte';
	import { tick } from 'svelte';

	let {
		open = $bindable(false),
		labelledby,
		size = 'md',
		align = 'center',
		onclose,
		children
	}: {
		open?: boolean;
		labelledby?: string;
		size?: 'sm' | 'md' | 'lg' | 'xl';
		align?: 'center' | 'top';
		onclose?: () => void;
		children: Snippet;
	} = $props();

	const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-4xl' };

	let panel = $state<HTMLDivElement | null>(null);
	let previouslyFocused: HTMLElement | null = null;

	function close() {
		open = false;
		onclose?.();
	}

	function focusables(): HTMLElement[] {
		if (!panel) return [];
		return Array.from(
			panel.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select, textarea, video, [tabindex]:not([tabindex="-1"])')
		);
	}

	function onKeydown(e: KeyboardEvent) {
		if (!open) return;
		if (e.key === 'Escape') {
			e.preventDefault();
			close();
		} else if (e.key === 'Tab') {
			// Piège du focus à l'intérieur de la modale
			const els = focusables();
			if (els.length === 0) return;
			const first = els[0];
			const last = els[els.length - 1];
			if (e.shiftKey && document.activeElement === first) {
				e.preventDefault();
				last.focus();
			} else if (!e.shiftKey && document.activeElement === last) {
				e.preventDefault();
				first.focus();
			}
		}
	}

	$effect(() => {
		if (!open) return;
		previouslyFocused = document.activeElement as HTMLElement | null;
		const prevOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		tick().then(() => {
			const target = panel?.querySelector<HTMLElement>('[data-autofocus]') ?? focusables()[0] ?? panel;
			target?.focus();
		});
		return () => {
			document.body.style.overflow = prevOverflow;
			previouslyFocused?.focus?.();
		};
	});
</script>

<svelte:window onkeydown={onKeydown} />

{#if open}
	<div class="fixed inset-0 z-50 overflow-y-auto">
		<!-- Fond cliquable : purement décoratif pour les lecteurs d'écran, Échap ferme aussi -->
		<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
		<div class="anim-fade fixed inset-0 bg-slate-900/50 backdrop-blur-sm" aria-hidden="true" onclick={close}></div>
		<div class="relative min-h-full flex justify-center p-4 sm:p-6 pointer-events-none {align === 'top' ? 'items-start sm:pt-16' : 'items-center'}">
			<div
				bind:this={panel}
				class="anim-pop pointer-events-auto relative w-full {widths[size]} bg-white rounded-2xl shadow-2xl shadow-slate-900/20 outline-none"
				role="dialog"
				aria-modal="true"
				aria-labelledby={labelledby}
				tabindex="-1"
			>
				{@render children()}
			</div>
		</div>
	</div>
{/if}
