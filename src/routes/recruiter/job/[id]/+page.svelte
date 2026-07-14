<script lang="ts">
	import { getJob, getApplications } from '$lib/stores/jobs';
	import VideoModal from '$lib/components/VideoModal.svelte';
	import { page } from '$app/stores';
	import type { CandidateApplication } from '$lib/types';

	let job = $state<ReturnType<typeof getJob>>(undefined);
	let applications = $state<CandidateApplication[]>([]);
	let sortBy = $state<'match' | 'date'>('match');
	let filterMin = $state(0);
	let selectedApp = $state<CandidateApplication | null>(null);
	let showVideo = $state(false);
	const demoVideo = '/demo.mp4';

	$effect(() => {
		const id = $page.params.id as string;
		job = getJob(id);
		applications = getApplications(id);
	});

	let sortedApps = $derived.by(() => {
		let apps = [...applications];
		if (filterMin > 0) {
			apps = apps.filter(a => a.overallMatch >= filterMin);
		}
		if (sortBy === 'match') {
			apps.sort((a, b) => b.overallMatch - a.overallMatch);
		} else {
			apps.sort((a, b) => b.appliedAt - a.appliedAt);
		}
		return apps;
	});

	function getMatchColor(pct: number): string {
		if (pct >= 80) return 'text-emerald-600';
		if (pct >= 60) return 'text-blue-600';
		if (pct >= 40) return 'text-amber-600';
		return 'text-red-500';
	}

	function getMatchRing(pct: number): string {
		if (pct >= 80) return 'stroke-emerald-500';
		if (pct >= 60) return 'stroke-blue-500';
		if (pct >= 40) return 'stroke-amber-500';
		return 'stroke-red-400';
	}

	function getMatchBg(pct: number): string {
		if (pct >= 80) return 'bg-emerald-500';
		if (pct >= 60) return 'bg-blue-500';
		if (pct >= 40) return 'bg-amber-500';
		return 'bg-red-400';
	}

	function closeModal() {
		selectedApp = null;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') closeModal();
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
	<div class="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-40">
		<div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
					<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
				</div>
				<div>
					<h1 class="text-xl font-bold text-slate-900">DynaRecrut</h1>
					<p class="text-xs text-slate-400">{job?.title || 'Détail offre'}</p>
				</div>
			</div>
			<a href="/" class="text-sm text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1">
				<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
				Tableau de bord
			</a>
		</div>
	</div>

	<div class="max-w-7xl mx-auto px-6 py-8">
		{#if job}
			<div class="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm mb-6">
				<div class="flex items-start justify-between">
					<div class="flex-1">
						<div class="flex items-center gap-3 mb-2">
							<h2 class="text-2xl font-bold text-slate-900">{job.title}</h2>
							<span class="px-2.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-medium">{job.criteria.length} groupe{(job.criteria.length > 1 ? 's' : '')}</span>
							{#if job.deadline}
								<span class="px-2.5 py-0.5 rounded-full text-xs font-medium {Date.now() > job.deadline ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}">
									{Date.now() > job.deadline ? 'Expirée' : new Date(job.deadline).toLocaleDateString('fr-FR')}
								</span>
							{/if}
						</div>
						<div class="flex items-center gap-4 text-sm text-slate-400">
							<span class="flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>{job.company}</span>
							<span class="flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>Créé le {new Date(job.createdAt).toLocaleDateString('fr-FR')}</span>
						</div>
						{#if job.description}
							<p class="text-sm text-slate-500 mt-3">{job.description}</p>
						{/if}
					</div>
					<div class="bg-slate-50 rounded-xl p-4 ml-6 flex-shrink-0">
						<p class="text-[10px] text-slate-400 uppercase tracking-wider font-medium mb-1.5">Lien de candidature</p>
						<div class="flex items-center gap-2">
							<input type="text" readonly value={window.location.origin + '/apply/' + job.slug} class="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs w-64" />
						</div>
					</div>
				</div>

				<div class="flex flex-wrap gap-2 mt-5 pt-5 border-t border-slate-100">
					{#each job.criteria as group}
						<div class="bg-slate-50 rounded-lg px-3 py-2 text-xs">
							<span class="font-medium text-slate-700">{group.name}</span>
							<div class="flex gap-1 mt-1">
								{#each group.keywords.slice(0, 4) as kw}
									<span class="bg-white text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">{kw.text}</span>
								{/each}
								{#if group.keywords.length > 4}
									<span class="text-slate-400">+{group.keywords.length - 4}</span>
								{/if}
							</div>
						</div>
					{/each}
					<div class="mt-3">
						<button onclick={() => showVideo = true} class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700 transition-shadow shadow-sm">
							<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 12l-6 4V8l6 4z"/></svg>
							Voir la démo
						</button>
					</div>
				</div>
			</div>

			<div class="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm mb-6">
				<div class="flex items-center gap-4">
					<div class="flex items-center gap-2">
						<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>
						<select value={sortBy} onchange={(e) => sortBy = (e.target as HTMLSelectElement).value as 'match' | 'date'} class="border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white">
							<option value="match">Trier par score</option>
							<option value="date">Trier par date</option>
						</select>
					</div>
					<div class="flex items-center gap-2">
						<select value={filterMin} onchange={(e) => filterMin = Number((e.target as HTMLSelectElement).value)} class="border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white">
							<option value={0}>Tous les scores</option>
							<option value={80}>80% minimum</option>
							<option value={60}>60% minimum</option>
							<option value={40}>40% minimum</option>
						</select>
					</div>
					<div class="text-sm text-slate-400 ml-auto">
						<span class="font-semibold text-slate-600">{sortedApps.length}</span> candidature{(sortedApps.length > 1 ? 's' : '')}
					</div>
				</div>
			</div>

			{#if sortedApps.length === 0}
				<div class="text-center py-20">
					<div class="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
						<svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
					</div>
					<h3 class="text-lg font-semibold text-slate-700 mb-1">Aucune candidature</h3>
					<p class="text-sm text-slate-400">Partagez le lien de candidature pour recevoir des CV</p>
				</div>
			{:else}
				<div class="space-y-3">
					{#each sortedApps as app}
						<button onclick={() => selectedApp = app} class="w-full text-left bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-200">
							<div class="flex items-center gap-5">
								<div class="relative w-16 h-16 flex-shrink-0">
									<svg class="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
										<circle cx="18" cy="18" r="15.5" fill="none" class="stroke-slate-100" stroke-width="3"/>
										<circle cx="18" cy="18" r="15.5" fill="none" class={getMatchRing(app.overallMatch)} stroke-width="3" stroke-dasharray={`${app.overallMatch}, 100`} stroke-linecap="round"/>
									</svg>
									<div class="absolute inset-0 flex items-center justify-center">
										<span class="text-lg font-bold {getMatchColor(app.overallMatch)}">{app.overallMatch}%</span>
									</div>
								</div>
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-2 mb-1">
										<h4 class="font-semibold text-slate-900">{app.candidateName || 'Candidat'}</h4>
										<span class="text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">{app.cvFileName}</span>
									</div>
									<p class="text-sm text-slate-500">{app.email}</p>
									<div class="flex flex-wrap gap-1.5 mt-2">
										{#each app.matchResults as mr}
											<span class="text-[10px] px-2 py-0.5 rounded-full font-medium {mr.matchPercentage >= 100 ? 'bg-emerald-50 text-emerald-700' : mr.matchPercentage >= 50 ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-500'}">
												{mr.groupName}: {mr.matchPercentage}%
											</span>
										{/each}
									</div>
								</div>
								<div class="text-[10px] text-slate-400 flex-shrink-0 text-right">
									{new Date(app.appliedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
									<br/>
									{new Date(app.appliedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
								</div>
							</div>
						</button>
					{/each}
				</div>
			{/if}
		{/if}
	</div>
</div>

{#if selectedApp}
	<div class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start justify-center z-50 overflow-y-auto py-8" onclick={closeModal} onkeydown={handleKeydown} role="dialog" aria-modal="true" tabindex="-1">
		<div class="bg-white rounded-2xl max-w-3xl w-full mx-4 shadow-2xl" onclick={(e) => e.stopPropagation()} role="document">
			<div class="p-6 border-b border-slate-100">
				<div class="flex justify-between items-start">
					<div>
						<h2 class="text-xl font-bold text-slate-900">{selectedApp.candidateName || 'Candidat'}</h2>
						<p class="text-slate-500 text-sm">{selectedApp.email}</p>
						<p class="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
							<svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
							{selectedApp.cvFileName} · {new Date(selectedApp.appliedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
						</p>
					</div>
					<div class="text-center">
						<div class="relative w-20 h-20">
							<svg class="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
								<circle cx="18" cy="18" r="15.5" fill="none" class="stroke-slate-100" stroke-width="3"/>
								<circle cx="18" cy="18" r="15.5" fill="none" class={getMatchRing(selectedApp.overallMatch)} stroke-width="3" stroke-dasharray={`${selectedApp.overallMatch}, 100`} stroke-linecap="round"/>
							</svg>
							<div class="absolute inset-0 flex items-center justify-center">
								<span class="text-2xl font-bold {getMatchColor(selectedApp.overallMatch)}">{selectedApp.overallMatch}%</span>
							</div>
						</div>
						<p class="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-medium">Score global</p>
					</div>
				</div>
			</div>

			<div class="p-6 space-y-4 max-h-[55vh] overflow-y-auto">
				{#each selectedApp.matchResults as mr}
					<div class="border border-slate-100 rounded-xl p-4">
						<div class="flex justify-between items-center mb-3">
							<h4 class="font-semibold text-slate-900 text-sm">{mr.groupName}</h4>
							<div class="flex items-center gap-3">
								<div class="w-28 h-2 bg-slate-100 rounded-full overflow-hidden">
									<div class="h-full {getMatchBg(mr.matchPercentage)} rounded-full transition-all" style="width: {mr.matchPercentage}%"></div>
								</div>
								<span class="text-sm font-bold {getMatchColor(mr.matchPercentage)}">{mr.matchPercentage}%</span>
							</div>
						</div>
						<div class="grid grid-cols-2 gap-4">
							<div>
								<p class="text-[10px] text-slate-400 uppercase tracking-wider font-medium mb-1.5">Trouvés ({mr.foundCount}/{mr.totalKeywords})</p>
								<div class="flex flex-wrap gap-1">
									{#each mr.foundKeywords as kw}
										<span class="inline-flex items-center gap-0.5 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-xs font-medium">
											<svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 13l4 4L19 7"/></svg>
											{kw}
										</span>
									{/each}
								</div>
							</div>
							<div>
								<p class="text-[10px] text-slate-400 uppercase tracking-wider font-medium mb-1.5">Manquants</p>
								<div class="flex flex-wrap gap-1">
									{#each mr.missingKeywords as kw}
										<span class="inline-flex items-center gap-0.5 bg-red-50 text-red-600 px-2 py-0.5 rounded text-xs font-medium">
											<svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 18L18 6M6 6l12 12"/></svg>
											{kw}
										</span>
									{/each}
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>

			<div class="p-4 border-t border-slate-100 flex justify-between items-center">
				<button onclick={() => {
					const app = selectedApp!;
					const link = document.createElement('a');
					link.href = `data:${app.cvFileType};base64,${app.cvFileData}`;
					link.download = app.cvFileName;
					link.click();
				}} class="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl hover:from-indigo-700 hover:to-violet-700 transition-all font-medium text-sm flex items-center gap-2 shadow-sm">
					<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
					Télécharger le CV
				</button>
				<button onclick={closeModal} class="px-5 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium text-sm">Fermer</button>
			</div>
		</div>
	</div>
{/if}

<VideoModal open={showVideo} src={demoVideo} />