<script lang="ts">
	import { getJobs, deleteJob, getApplications } from '$lib/stores/jobs';
	import VideoModal from '$lib/components/VideoModal.svelte';
	import { onMount } from 'svelte';

	let jobs = $state<ReturnType<typeof getJobs>>([]);
	let showModal = $state(false);
	let jobToDelete = $state<string | null>(null);
	let showVideo = $state(false);
	const demoVideo = '/demo.mp4';

	onMount(() => {
		jobs = getJobs();
	});

	function handleDelete(id: string) {
		jobToDelete = id;
		showModal = true;
	}

	function confirmDelete() {
		if (jobToDelete) {
			deleteJob(jobToDelete);
			jobs = getJobs();
		}
		showModal = false;
		jobToDelete = null;
	}

	function closeModal() {
		showModal = false;
		jobToDelete = null;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') closeModal();
	}

	function getAppCount(jobId: string): number {
		return getApplications(jobId).length;
	}

	function getAvgMatch(jobId: string): number {
		const apps = getApplications(jobId);
		if (apps.length === 0) return 0;
		const sum = apps.reduce((s, a) => s + a.overallMatch, 0);
		return Math.round(sum / apps.length);
	}

</script>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
	<!-- Top Bar -->
	<div class="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-40">
		<div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
					<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
				</div>
				<div>
					<h1 class="text-xl font-bold text-slate-900">DynaRecrut</h1>
					<p class="text-xs text-slate-400">Plateforme de recrutement intelligente</p>
				</div>
			</div>
			<div class="flex items-center gap-3">
				<button onclick={() => showVideo = true} class="px-4 py-2.5 rounded-xl font-medium transition-all shadow-md hover:shadow-lg flex items-center gap-2 text-sm bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white">
					<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 12l-6 4V8l6 4z"/></svg>
					Voir la démo
				</button>
				<a href="/recruiter/new" class="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-md hover:shadow-lg hover:shadow-indigo-200 flex items-center gap-2 text-sm">
					<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
					Nouvelle Offre
				</a>
			</div>
		</div>
	</div>

	<div class="max-w-7xl mx-auto px-6 py-8">
		<!-- Header -->
		<div class="mb-10">
			<div class="flex items-center gap-3 mb-2">
				<h2 class="text-3xl font-bold text-slate-900">Tableau de Bord</h2>
				<span class="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-semibold">{jobs.length} offre{(jobs.length > 1 ? 's' : '')}</span>
			</div>
			<p class="text-slate-400">Gérez vos offres d'emploi et analysez les candidatures en un coup d'œil</p>
		</div>

		{#if jobs.length === 0}
			<div class="text-center py-24 px-8">
				<div class="w-24 h-24 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
					<svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 text-indigo-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
				</div>
				<h2 class="text-2xl font-bold text-slate-800 mb-2">Aucune offre d'emploi</h2>
				<p class="text-slate-400 mb-8 max-w-md mx-auto">Créez votre première offre pour générer un lien de candidature et commencer à recevoir les CV de vos candidats.</p>
				<a href="/recruiter/new" class="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-8 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:shadow-indigo-200">
					<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
					Cr&eacute;er une offre
				</a>
			</div>
		{:else}
			<!-- Stats Row -->
			<div class="grid grid-cols-3 gap-4 mb-8">
				<div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
					<div class="flex items-center gap-3">
						<div class="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
							<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
						</div>
						<div>
							<p class="text-2xl font-bold text-slate-900">{jobs.length}</p>
							<p class="text-xs text-slate-400">Offres actives</p>
						</div>
					</div>
				</div>
				<div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
					<div class="flex items-center gap-3">
						<div class="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
							<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
						</div>
						<div>
							<p class="text-2xl font-bold text-slate-900">{jobs.reduce((s, j) => s + getAppCount(j.id), 0)}</p>
							<p class="text-xs text-slate-400">Total candidatures</p>
						</div>
					</div>
				</div>
				<div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
					<div class="flex items-center gap-3">
						<div class="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
							<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
						</div>
						<div>
							<p class="text-2xl font-bold text-slate-900">{Math.round(jobs.reduce((s, j) => s + getAvgMatch(j.id), 0) / jobs.length)}%</p>
							<p class="text-xs text-slate-400">Match moyen global</p>
						</div>
					</div>
				</div>
			</div>

			<!-- Jobs List -->
			<div class="space-y-3">
				{#each jobs as job}
					<div class="group bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-lg hover:border-indigo-100 transition-all duration-300">
						<div class="flex items-center justify-between">
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-3 mb-1.5">
									<h3 class="text-lg font-bold text-slate-900 truncate">{job.title}</h3>
									<span class="px-2.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-medium whitespace-nowrap">{job.criteria.length} groupe{(job.criteria.length > 1 ? 's' : '')}</span>
									{#if job.deadline}
										<span class="px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap {Date.now() > job.deadline ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}">
											{Date.now() > job.deadline ? 'Expirée' : new Date(job.deadline).toLocaleDateString('fr-FR')}
										</span>
									{/if}
								</div>
								<div class="flex items-center gap-3 text-sm text-slate-400">
									<span class="flex items-center gap-1">
										<svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
										{job.company}
									</span>
									<span class="flex items-center gap-1">
										<svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
										{new Date(job.createdAt).toLocaleDateString('fr-FR')}
									</span>
								</div>
								{#if job.description}
									<p class="text-sm text-slate-400 mt-1.5 line-clamp-1">{job.description}</p>
								{/if}
							</div>

							<div class="flex items-center gap-8 ml-8">
								<div class="text-center">
									<div class="text-2xl font-bold text-indigo-600">{getAppCount(job.id)}</div>
									<div class="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Candidatures</div>
								</div>
								<div class="text-center">
									<div class="text-2xl font-bold {getAvgMatch(job.id) >= 70 ? 'text-emerald-600' : getAvgMatch(job.id) >= 40 ? 'text-amber-600' : 'text-slate-300'}">{getAvgMatch(job.id)}%</div>
									<div class="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Match</div>
								</div>
							</div>

							<div class="flex items-center gap-1 ml-6">
								<a href="/recruiter/job/{job.id}" class="p-2.5 hover:bg-indigo-50 rounded-xl transition-all text-slate-400 hover:text-indigo-600 group/btn" title="Voir les candidatures">
									<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 group-hover/btn:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
								</a>
								<button onclick={() => handleDelete(job.id)} class="p-2.5 hover:bg-red-50 rounded-xl transition-all text-slate-400 hover:text-red-500 group/btn" title="Supprimer">
									<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 group-hover/btn:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
								</button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<VideoModal open={showVideo} src={demoVideo} />

<!-- Delete Modal -->
{#if showModal}
	<div class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onclick={closeModal} onkeydown={handleKeydown} role="dialog" aria-modal="true" tabindex="-1">
		<div class="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl" onclick={(e) => e.stopPropagation()} role="document">
			<div class="text-center">
				<div class="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
					<svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
				</div>
				<h3 class="text-lg font-bold text-slate-900 mb-2">Supprimer cette offre ?</h3>
				<p class="text-slate-500 text-sm mb-6">Toutes les candidatures associées seront supprimées d&eacute;finitivement.</p>
				<div class="flex gap-3 justify-center">
					<button onclick={closeModal} class="px-6 py-2.5 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition-all font-medium text-sm">Annuler</button>
					<button onclick={confirmDelete} class="px-6 py-2.5 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl hover:from-red-600 hover:to-rose-600 transition-all font-medium text-sm shadow-md shadow-red-100">Confirmer la suppression</button>
				</div>
			</div>
		</div>
	</div>
{/if}