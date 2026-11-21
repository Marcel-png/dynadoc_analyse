<script lang="ts">
	import { onMount } from 'svelte';
	import { getJobs, deleteJob, getApplications } from '$lib/stores/jobs';
	import type { JobPost, CandidateApplication } from '$lib/types';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import VideoModal from '$lib/components/VideoModal.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { scoreTone } from '$lib/utils/score';
	import { plural, formatDate, deadlineState, relativeTime, copyToClipboard } from '$lib/utils/format';

	type Filter = 'all' | 'open' | 'expired';

	let ready = $state(false);
	let jobs = $state<JobPost[]>([]);
	let apps = $state<CandidateApplication[]>([]);
	let query = $state('');
	let filter = $state<Filter>('all');
	let jobToDelete = $state<JobPost | null>(null);
	let deleteOpen = $state(false);
	let showVideo = $state(false);

	function load() {
		jobs = getJobs().sort((a, b) => b.createdAt - a.createdAt);
		apps = getApplications();
	}

	onMount(() => {
		load();
		ready = true;
	});

	// Statistiques calculées une seule fois par changement de données
	const statsByJob = $derived.by(() => {
		const map = new Map<string, { count: number; avg: number; best: number; lastAt: number | null }>();
		for (const job of jobs) map.set(job.id, { count: 0, avg: 0, best: 0, lastAt: null });
		for (const a of apps) {
			const s = map.get(a.jobId);
			if (!s) continue;
			s.avg += a.overallMatch;
			s.count++;
			s.best = Math.max(s.best, a.overallMatch);
			s.lastAt = Math.max(s.lastAt ?? 0, a.appliedAt);
		}
		for (const s of map.values()) s.avg = s.count ? Math.round(s.avg / s.count) : 0;
		return map;
	});

	const totals = $derived.by(() => {
		const jobIds = new Set(jobs.map((j) => j.id));
		const relevant = apps.filter((a) => jobIds.has(a.jobId));
		const now = Date.now();
		return {
			open: jobs.filter((j) => !j.deadline || j.deadline > now).length,
			applications: relevant.length,
			avg: relevant.length ? Math.round(relevant.reduce((s, a) => s + a.overallMatch, 0) / relevant.length) : null,
			strong: relevant.filter((a) => a.overallMatch >= 80).length
		};
	});

	const filtered = $derived.by(() => {
		const q = query.trim().toLowerCase();
		const now = Date.now();
		return jobs.filter((j) => {
			const expired = !!j.deadline && j.deadline < now;
			if (filter === 'open' && expired) return false;
			if (filter === 'expired' && !expired) return false;
			if (!q) return true;
			return j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q);
		});
	});

	function askDelete(job: JobPost) {
		jobToDelete = job;
		deleteOpen = true;
	}

	function confirmDelete() {
		if (!jobToDelete) return;
		const title = jobToDelete.title;
		deleteJob(jobToDelete.id);
		load();
		deleteOpen = false;
		jobToDelete = null;
		toast(`Offre « ${title} » supprimée`);
	}

	async function copyLink(job: JobPost) {
		const ok = await copyToClipboard(`${location.origin}/apply/${job.slug}`);
		toast(ok ? 'Lien de candidature copié' : 'Impossible de copier le lien', ok ? 'success' : 'error');
	}

	const filters: { id: Filter; label: string }[] = [
		{ id: 'all', label: 'Toutes' },
		{ id: 'open', label: 'Ouvertes' },
		{ id: 'expired', label: 'Clôturées' }
	];
</script>

<svelte:head><title>Tableau de bord · DynaRecrut</title></svelte:head>

<div class="min-h-screen bg-slate-50">
	<AppHeader>
		{#snippet actions()}
			<button type="button" onclick={() => (showVideo = true)} class="btn-ghost">
				<Icon name="play" class="w-4 h-4" />
				<span class="hidden sm:inline">Voir la démo</span>
			</button>
			<a href="/recruiter/new" class="btn-primary">
				<Icon name="plus" class="w-4 h-4" stroke={2.5} />
				Nouvelle offre
			</a>
		{/snippet}
	</AppHeader>

	<main id="main" class="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
		<div class="mb-8">
			<h1 class="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Tableau de bord</h1>
			<p class="text-slate-500 mt-1">Suivez vos offres et repérez les meilleurs profils en un coup d’œil.</p>
		</div>

		{#if !ready}
			<!-- Squelette de chargement : évite le flash de l'état vide -->
			<div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
				{#each Array(4) as _}<div class="skeleton h-24"></div>{/each}
			</div>
			<div class="space-y-3">
				{#each Array(3) as _}<div class="skeleton h-28"></div>{/each}
			</div>
		{:else if jobs.length === 0}
			<div class="card-surface anim-slide text-center py-16 px-6 sm:px-12">
				<div class="w-16 h-16 bg-gradient-to-br from-indigo-50 to-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
					<Icon name="briefcase" class="w-8 h-8 text-indigo-500" stroke={1.5} />
				</div>
				<h2 class="text-xl font-bold text-slate-900 mb-2">Publiez votre première offre</h2>
				<p class="text-slate-500 mb-8 max-w-md mx-auto">En trois étapes, obtenez un lien à partager et un classement automatique des CV reçus.</p>

				<ol class="grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-10 text-left">
					{#each [
						{ icon: 'pencil', title: 'Décrivez le poste', text: 'Titre, entreprise, date limite.' },
						{ icon: 'clipboard', title: 'Fixez vos critères', text: 'Compétences et importance de chacune.' },
						{ icon: 'link', title: 'Partagez le lien', text: 'Les CV sont analysés dès réception.' }
					] as step, i}
						<li class="rounded-xl bg-slate-50 p-4">
							<div class="flex items-center gap-2 mb-2">
								<span class="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">{i + 1}</span>
								<Icon name={step.icon as 'pencil'} class="w-4 h-4 text-indigo-500" />
							</div>
							<p class="font-semibold text-slate-900 text-sm">{step.title}</p>
							<p class="text-xs text-slate-500 mt-0.5">{step.text}</p>
						</li>
					{/each}
				</ol>

				<div class="flex flex-col sm:flex-row items-center justify-center gap-3">
					<a href="/recruiter/new" class="btn-primary px-6 py-3">
						<Icon name="plus" class="w-4 h-4" stroke={2.5} />
						Créer une offre
					</a>
					<button type="button" class="btn-secondary px-6 py-3" onclick={() => (showVideo = true)}>
						<Icon name="play" class="w-4 h-4" />
						Voir la démo
					</button>
				</div>
			</div>
		{:else}
			<!-- Indicateurs -->
			<section aria-label="Indicateurs" class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
				{#each [
					{ icon: 'briefcase', value: totals.open, sub: `sur ${jobs.length}`, label: 'Offres ouvertes', color: 'bg-indigo-50 text-indigo-600' },
					{ icon: 'users', value: totals.applications, sub: '', label: 'Candidatures reçues', color: 'bg-violet-50 text-violet-600' },
					{ icon: 'chart', value: totals.avg === null ? '—' : `${totals.avg}%`, sub: '', label: 'Score moyen', color: 'bg-sky-50 text-sky-600' },
					{ icon: 'star', value: totals.strong, sub: '≥ 80 %', label: 'Profils excellents', color: 'bg-emerald-50 text-emerald-600' }
				] as kpi}
					<div class="card-surface p-4 sm:p-5">
						<div class="w-9 h-9 rounded-lg flex items-center justify-center mb-3 {kpi.color}">
							<Icon name={kpi.icon as 'chart'} class="w-5 h-5" />
						</div>
						<p class="text-2xl font-bold text-slate-900 tabular leading-none">
							{kpi.value}
							{#if kpi.sub}<span class="text-sm font-medium text-slate-400 ml-1">{kpi.sub}</span>{/if}
						</p>
						<p class="text-xs sm:text-sm text-slate-500 mt-1.5">{kpi.label}</p>
					</div>
				{/each}
			</section>

			<!-- Barre d'outils -->
			<div class="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
				<div class="relative flex-1 max-w-md">
					<Icon name="search" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
					<input type="search" bind:value={query} placeholder="Rechercher une offre ou une entreprise…" aria-label="Rechercher une offre" class="input-field pl-10" />
				</div>
				<div class="inline-flex p-1 bg-slate-100 rounded-xl self-start" role="tablist" aria-label="Filtrer les offres">
					{#each filters as f}
						<button
							type="button"
							role="tab"
							aria-selected={filter === f.id}
							onclick={() => (filter = f.id)}
							class="px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all {filter === f.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}"
						>
							{f.label}
						</button>
					{/each}
				</div>
			</div>

			{#if filtered.length === 0}
				<div class="card-surface text-center py-12 px-6">
					<Icon name="search" class="w-8 h-8 text-slate-300 mx-auto mb-3" />
					<p class="font-medium text-slate-700">Aucune offre ne correspond</p>
					<button type="button" class="text-sm text-indigo-600 hover:text-indigo-700 font-medium mt-2" onclick={() => { query = ''; filter = 'all'; }}>
						Réinitialiser les filtres
					</button>
				</div>
			{:else}
				<ul class="space-y-3">
					{#each filtered as job (job.id)}
						{@const s = statsByJob.get(job.id)!}
						{@const dl = deadlineState(job.deadline)}
						{@const tone = scoreTone(s.avg)}
						<li class="group relative card-surface p-4 sm:p-5 hover:border-indigo-200 hover:shadow-md transition-all">
							<div class="flex flex-col md:flex-row md:items-center gap-4">
								<div class="flex-1 min-w-0">
									<div class="flex flex-wrap items-center gap-2 mb-1">
										<!-- Lien étendu : toute la carte est cliquable -->
										<a href="/recruiter/job/{job.id}" class="font-semibold text-slate-900 text-base sm:text-lg truncate after:content-[''] after:absolute after:inset-0 after:rounded-2xl group-hover:text-indigo-700 transition-colors">
											{job.title}
										</a>
										{#if dl.kind === 'expired'}
											<span class="chip bg-slate-100 text-slate-600"><Icon name="lock" class="w-3 h-3" />Clôturée</span>
										{:else if dl.kind === 'soon'}
											<span class="chip bg-amber-50 text-amber-700"><Icon name="clock" class="w-3 h-3" />Clôture {dl.label}</span>
										{:else}
											<span class="chip bg-emerald-50 text-emerald-700"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Ouverte</span>
										{/if}
									</div>
									<div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
										<span class="flex items-center gap-1.5"><Icon name="building" class="w-3.5 h-3.5" />{job.company}</span>
										<span class="flex items-center gap-1.5"><Icon name="calendar" class="w-3.5 h-3.5" />Publiée le {formatDate(job.createdAt)}</span>
										<span class="flex items-center gap-1.5"><Icon name="clipboard" class="w-3.5 h-3.5" />{plural(job.criteria.length, 'critère')}</span>
									</div>
								</div>

								<div class="flex items-center gap-6 md:gap-8">
									<div class="text-left md:text-center">
										<p class="text-xl font-bold text-slate-900 tabular leading-none">{s.count}</p>
										<p class="text-[11px] text-slate-500 mt-1">{s.count > 1 ? 'candidatures' : 'candidature'}</p>
									</div>
									<div class="text-left md:text-center min-w-16">
										{#if s.count}
											<p class="text-xl font-bold tabular leading-none {tone.text}">{s.avg}%</p>
											<p class="text-[11px] text-slate-500 mt-1">score moyen</p>
										{:else}
											<p class="text-xl font-bold text-slate-300 leading-none">—</p>
											<p class="text-[11px] text-slate-400 mt-1">pas encore</p>
										{/if}
									</div>
									{#if s.lastAt}
										<p class="hidden lg:block text-xs text-slate-400 w-28">Dernière {relativeTime(s.lastAt)}</p>
									{/if}

									<!-- Actions au-dessus du lien étendu -->
									<div class="relative z-10 flex items-center gap-1 ml-auto md:ml-0">
										<button type="button" onclick={() => copyLink(job)} class="btn-icon hover:text-indigo-600 hover:bg-indigo-50" title="Copier le lien de candidature" aria-label="Copier le lien de candidature de {job.title}">
											<Icon name="link" class="w-[18px] h-[18px]" />
										</button>
										<button type="button" onclick={() => askDelete(job)} class="btn-icon hover:text-red-600 hover:bg-red-50" title="Supprimer l’offre" aria-label="Supprimer l’offre {job.title}">
											<Icon name="trash" class="w-[18px] h-[18px]" />
										</button>
										<Icon name="arrowRight" class="w-4 h-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all hidden md:block ml-1" />
									</div>
								</div>
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		{/if}
	</main>
</div>

<VideoModal bind:open={showVideo} src="/demo.mp4" />

<Modal bind:open={deleteOpen} size="sm" labelledby="delete-title" onclose={() => (jobToDelete = null)}>
	<div class="p-6">
		<div class="flex items-start gap-4">
			<div class="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
				<Icon name="warning" class="w-6 h-6 text-red-600" />
			</div>
			<div>
				<h2 id="delete-title" class="text-lg font-semibold text-slate-900">Supprimer cette offre ?</h2>
				<p class="text-slate-500 text-sm mt-1">
					« <span class="font-medium text-slate-700">{jobToDelete?.title}</span> » et
					{plural(jobToDelete ? (statsByJob.get(jobToDelete.id)?.count ?? 0) : 0, 'candidature associée', 'candidatures associées')}
					seront définitivement supprimées. Cette action est irréversible.
				</p>
			</div>
		</div>
	</div>
	<div class="flex flex-col-reverse sm:flex-row justify-end gap-2 px-6 py-4 bg-slate-50 rounded-b-2xl border-t border-slate-100">
		<button type="button" data-autofocus onclick={() => (deleteOpen = false)} class="btn-secondary">Annuler</button>
		<button type="button" onclick={confirmDelete} class="btn-danger">
			<Icon name="trash" class="w-4 h-4" />
			Supprimer
		</button>
	</div>
</Modal>
