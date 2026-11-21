<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { getJob, getApplications } from '$lib/stores/jobs';
	import type { CandidateApplication, JobPost } from '$lib/types';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import ScoreRing from '$lib/components/ScoreRing.svelte';
	import VideoModal from '$lib/components/VideoModal.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { scoreTone } from '$lib/utils/score';
	import { plural, formatDate, formatDateTime, relativeTime, deadlineState, initials, copyToClipboard } from '$lib/utils/format';

	let ready = $state(false);
	let job = $state<JobPost | undefined>(undefined);
	let applications = $state<CandidateApplication[]>([]);
	let origin = $state('');
	let sortBy = $state<'match' | 'date'>('match');
	let filterMin = $state(0);
	let query = $state('');
	let selectedId = $state<string | null>(null);
	let detailOpen = $state(false);
	let showVideo = $state(false);
	let showFullDesc = $state(false);

	onMount(() => {
		origin = location.origin;
	});

	$effect(() => {
		const id = page.params.id as string;
		job = getJob(id);
		applications = getApplications(id);
		ready = true;
	});

	const link = $derived(job && origin ? `${origin}/apply/${job.slug}` : '');
	const dl = $derived(deadlineState(job?.deadline ?? null));

	const stats = $derived.by(() => {
		const n = applications.length;
		return {
			count: n,
			avg: n ? Math.round(applications.reduce((s, a) => s + a.overallMatch, 0) / n) : null,
			best: n ? Math.max(...applications.map((a) => a.overallMatch)) : null,
			strong: applications.filter((a) => a.overallMatch >= 80).length
		};
	});

	const thresholds = [
		{ min: 0, label: 'Tous' },
		{ min: 80, label: '≥ 80 %' },
		{ min: 60, label: '≥ 60 %' },
		{ min: 40, label: '≥ 40 %' }
	];
	const countAbove = (min: number) => applications.filter((a) => a.overallMatch >= min).length;

	const sortedApps = $derived.by(() => {
		const q = query.trim().toLowerCase();
		const apps = applications.filter(
			(a) => a.overallMatch >= filterMin && (!q || a.candidateName.toLowerCase().includes(q) || a.email.toLowerCase().includes(q))
		);
		return apps.sort((a, b) => (sortBy === 'match' ? b.overallMatch - a.overallMatch : b.appliedAt - a.appliedAt));
	});

	// Rang absolu (par score) indépendamment des filtres
	const rankById = $derived(
		new Map([...applications].sort((a, b) => b.overallMatch - a.overallMatch).map((a, i) => [a.id, i + 1]))
	);

	const selectedIndex = $derived(sortedApps.findIndex((a) => a.id === selectedId));
	const selectedApp = $derived(selectedIndex >= 0 ? sortedApps[selectedIndex] : null);

	function openApp(app: CandidateApplication) {
		selectedId = app.id;
		detailOpen = true;
	}

	function step(delta: number) {
		const next = sortedApps[selectedIndex + delta];
		if (next) selectedId = next.id;
	}

	function onDetailKeydown(e: KeyboardEvent) {
		if (!detailOpen) return;
		const t = e.target as HTMLElement;
		if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') return;
		if (e.key === 'ArrowRight' || e.key === 'j') step(1);
		if (e.key === 'ArrowLeft' || e.key === 'k') step(-1);
	}

	async function copyLink() {
		const ok = await copyToClipboard(link);
		toast(ok ? 'Lien copié dans le presse-papiers' : 'Impossible de copier le lien', ok ? 'success' : 'error');
	}

	function downloadCv(app: CandidateApplication) {
		const a = document.createElement('a');
		a.href = `data:${app.cvFileType};base64,${app.cvFileData}`;
		a.download = app.cvFileName;
		a.click();
	}
</script>

<svelte:head><title>{job ? `${job.title} · DynaRecrut` : 'Offre · DynaRecrut'}</title></svelte:head>
<svelte:window onkeydown={onDetailKeydown} />

<div class="min-h-screen bg-slate-50">
	<AppHeader back={{ href: '/', label: 'Retour au tableau de bord' }}>
		{#snippet actions()}
			<button type="button" onclick={() => (showVideo = true)} class="btn-ghost">
				<Icon name="play" class="w-4 h-4" />
				<span class="hidden sm:inline">Démo</span>
			</button>
		{/snippet}
	</AppHeader>

	<main id="main" class="max-w-6xl mx-auto px-4 sm:px-6 py-8">
		{#if !ready}
			<div class="skeleton h-48 mb-6"></div>
			<div class="space-y-3">{#each Array(3) as _}<div class="skeleton h-24"></div>{/each}</div>
		{:else if !job}
			<div class="card-surface text-center py-16 px-6">
				<Icon name="sad" class="w-12 h-12 text-slate-300 mx-auto mb-4" stroke={1.5} />
				<h1 class="text-xl font-bold text-slate-900 mb-1">Offre introuvable</h1>
				<p class="text-slate-500 mb-6">Elle a peut-être été supprimée.</p>
				<a href="/" class="btn-primary">Retour au tableau de bord</a>
			</div>
		{:else}
			<!-- En-tête de l'offre -->
			<section class="card-surface overflow-hidden mb-6">
				<div class="p-5 sm:p-6 grid lg:grid-cols-[1fr_minmax(0,380px)] gap-6">
					<div class="min-w-0">
						<nav class="text-xs text-slate-400 mb-2" aria-label="Fil d’Ariane">
							<a href="/" class="hover:text-slate-600">Tableau de bord</a> <span aria-hidden="true">/</span> <span class="text-slate-500">Offre</span>
						</nav>
						<div class="flex flex-wrap items-center gap-2 mb-2">
							<h1 class="text-2xl font-bold text-slate-900 tracking-tight">{job.title}</h1>
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
							{#if job.deadline}
								<span class="flex items-center gap-1.5"><Icon name="clock" class="w-3.5 h-3.5" />Jusqu’au {formatDateTime(job.deadline)}</span>
							{/if}
						</div>
						{#if job.description}
							<p class="text-sm text-slate-600 mt-4 whitespace-pre-line {showFullDesc ? '' : 'line-clamp-3'}">{job.description}</p>
							{#if job.description.length > 220}
								<button type="button" class="text-sm font-medium text-indigo-600 hover:text-indigo-700 mt-1" onclick={() => (showFullDesc = !showFullDesc)}>
									{showFullDesc ? 'Réduire' : 'Lire la suite'}
								</button>
							{/if}
						{/if}
					</div>

					<!-- Partage -->
					<div class="rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 p-4 self-start">
						<p class="text-sm font-semibold text-indigo-950 flex items-center gap-1.5 mb-1"><Icon name="link" class="w-4 h-4" />Lien de candidature</p>
						<p class="text-xs text-indigo-900/60 mb-3">Partagez-le sur vos annonces : les CV reçus apparaissent ici, déjà notés.</p>
						<div class="flex gap-2">
							<input type="text" readonly value={link} aria-label="Lien de candidature" onfocus={(e) => (e.target as HTMLInputElement).select()}
								class="flex-1 min-w-0 px-3 py-2 bg-white border border-indigo-200 rounded-lg text-xs text-slate-700 font-mono outline-none focus:ring-2 focus:ring-indigo-500/20" />
							<button type="button" onclick={copyLink} class="btn-primary px-3 py-2" aria-label="Copier le lien">
								<Icon name="copy" class="w-4 h-4" />
								<span class="hidden sm:inline">Copier</span>
							</button>
						</div>
						<a href="/apply/{job.slug}" target="_blank" rel="noopener" class="inline-flex items-center gap-1 text-xs font-medium text-indigo-700 hover:text-indigo-900 mt-2.5">
							Voir la page candidat <Icon name="external" class="w-3.5 h-3.5" />
						</a>
					</div>
				</div>

				<!-- Critères -->
				<div class="px-5 sm:px-6 py-4 bg-slate-50/70 border-t border-slate-100">
					<p class="text-xs font-medium text-slate-500 mb-2">Critères évalués</p>
					<div class="flex flex-wrap gap-2">
						{#each job.criteria as group}
							<div class="bg-white rounded-lg border border-slate-200 px-3 py-2 text-xs">
								<span class="font-medium text-slate-800">{group.name}</span>
								<span class="text-slate-400 ml-1">· poids {group.weight}</span>
								<div class="flex flex-wrap gap-1 mt-1.5">
									{#each group.keywords.slice(0, 5) as kw}
										<span class="bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded border border-slate-100">{kw.text}</span>
									{/each}
									{#if group.keywords.length > 5}
										<span class="text-slate-400 px-1 py-0.5" title={group.keywords.slice(5).map((k) => k.text).join(', ')}>+{group.keywords.length - 5}</span>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</div>
			</section>

			<!-- Indicateurs -->
			<section aria-label="Indicateurs" class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
				{#each [
					{ label: 'Candidatures', value: stats.count, tone: 'text-slate-900' },
					{ label: 'Score moyen', value: stats.avg === null ? '—' : `${stats.avg}%`, tone: stats.avg === null ? 'text-slate-300' : scoreTone(stats.avg).text },
					{ label: 'Meilleur score', value: stats.best === null ? '—' : `${stats.best}%`, tone: stats.best === null ? 'text-slate-300' : scoreTone(stats.best).text },
					{ label: 'Profils ≥ 80 %', value: stats.strong, tone: 'text-emerald-600' }
				] as kpi}
					<div class="card-surface px-4 py-3.5">
						<p class="text-xs text-slate-500">{kpi.label}</p>
						<p class="text-2xl font-bold tabular mt-0.5 {kpi.tone}">{kpi.value}</p>
					</div>
				{/each}
			</section>

			{#if applications.length === 0}
				<div class="card-surface text-center py-14 px-6">
					<div class="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
						<Icon name="users" class="w-7 h-7 text-indigo-400" stroke={1.5} />
					</div>
					<h2 class="text-lg font-semibold text-slate-900 mb-1">Aucune candidature pour l’instant</h2>
					<p class="text-sm text-slate-500 mb-6 max-w-sm mx-auto">Partagez le lien de candidature : chaque CV sera analysé et classé automatiquement ici.</p>
					<button type="button" onclick={copyLink} class="btn-primary"><Icon name="copy" class="w-4 h-4" />Copier le lien</button>
				</div>
			{:else}
				<!-- Barre d'outils -->
				<div class="flex flex-col md:flex-row md:items-center gap-3 mb-4">
					<div class="relative md:w-72">
						<Icon name="search" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
						<input type="search" bind:value={query} placeholder="Nom ou e-mail…" aria-label="Rechercher un candidat" class="input-field pl-10 py-2" />
					</div>
					<div class="flex flex-wrap gap-1.5" role="group" aria-label="Score minimum">
						{#each thresholds as t}
							<button type="button" aria-pressed={filterMin === t.min} onclick={() => (filterMin = t.min)}
								class="px-3 py-1.5 rounded-lg text-sm font-medium border transition-all {filterMin === t.min ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}">
								{t.label}
								<span class="ml-1 text-xs tabular {filterMin === t.min ? 'text-white/60' : 'text-slate-400'}">{countAbove(t.min)}</span>
							</button>
						{/each}
					</div>
					<div class="md:ml-auto inline-flex p-1 bg-slate-100 rounded-xl self-start" role="group" aria-label="Trier">
						{#each [{ id: 'match', label: 'Meilleur score' }, { id: 'date', label: 'Plus récent' }] as s}
							<button type="button" aria-pressed={sortBy === s.id} onclick={() => (sortBy = s.id as 'match' | 'date')}
								class="px-3 py-1.5 rounded-lg text-sm font-medium transition-all {sortBy === s.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}">
								{s.label}
							</button>
						{/each}
					</div>
				</div>

				{#if sortedApps.length === 0}
					<div class="card-surface text-center py-10 px-6">
						<p class="font-medium text-slate-700">Aucun candidat ne correspond à ces filtres</p>
						<button type="button" class="text-sm text-indigo-600 hover:text-indigo-700 font-medium mt-2" onclick={() => { query = ''; filterMin = 0; }}>Réinitialiser</button>
					</div>
				{:else}
					<ul class="space-y-2.5">
						{#each sortedApps as app (app.id)}
							{@const rank = rankById.get(app.id) ?? 0}
							<li>
								<button type="button" onclick={() => openApp(app)} class="group w-full text-left card-surface p-4 sm:p-5 hover:border-indigo-200 hover:shadow-md transition-all focus-visible:ring-2 focus-visible:ring-indigo-500">
									<div class="flex items-center gap-4">
										<div class="hidden sm:flex flex-col items-center w-8 flex-shrink-0">
											{#if rank <= 3 && applications.length > 1}
												<span class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold {rank === 1 ? 'bg-amber-100 text-amber-700' : rank === 2 ? 'bg-slate-200 text-slate-700' : 'bg-orange-100 text-orange-700'}" title="Rang {rank}">{rank}</span>
											{:else}
												<span class="text-xs font-semibold text-slate-400 tabular">#{rank}</span>
											{/if}
										</div>
										<ScoreRing value={app.overallMatch} size={56} />
										<div class="flex-1 min-w-0">
											<div class="flex flex-wrap items-center gap-x-2 gap-y-0.5">
												<h3 class="font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">{app.candidateName || 'Candidat'}</h3>
												<span class="text-xs text-slate-400">· {app.email}</span>
											</div>
											<div class="flex flex-wrap gap-1.5 mt-2">
												{#each app.matchResults as mr}
													<span class="chip {scoreTone(mr.matchPercentage).soft}">{mr.groupName} <span class="tabular font-semibold">{mr.matchPercentage}%</span></span>
												{/each}
											</div>
										</div>
										<div class="hidden md:block text-right flex-shrink-0">
											<p class="text-xs text-slate-500" title={formatDateTime(app.appliedAt)}>{relativeTime(app.appliedAt)}</p>
											<p class="text-[11px] text-slate-400 mt-0.5 max-w-36 truncate">{app.cvFileName}</p>
										</div>
										<Icon name="arrowRight" class="w-4 h-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
									</div>
								</button>
							</li>
						{/each}
					</ul>
				{/if}
			{/if}
		{/if}
	</main>
</div>

<Modal bind:open={detailOpen} size="lg" align="top" labelledby="cand-title">
	{#if selectedApp}
		{@const tone = scoreTone(selectedApp.overallMatch)}
		<div class="p-5 sm:p-6 border-b border-slate-100">
			<div class="flex items-start gap-4">
				<div class="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white font-semibold flex items-center justify-center flex-shrink-0">
					{initials(selectedApp.candidateName || 'C')}
				</div>
				<div class="flex-1 min-w-0">
					<h2 id="cand-title" class="text-lg font-bold text-slate-900 truncate">{selectedApp.candidateName || 'Candidat'}</h2>
					<a href="mailto:{selectedApp.email}" class="text-sm text-indigo-600 hover:underline break-all">{selectedApp.email}</a>
					<p class="text-xs text-slate-400 mt-1">Candidature du {formatDateTime(selectedApp.appliedAt)}</p>
				</div>
				<div class="flex flex-col items-center">
					<ScoreRing value={selectedApp.overallMatch} size={72} />
					<span class="chip mt-1.5 {tone.soft}">{tone.label}</span>
				</div>
				<button type="button" class="btn-icon -mr-2 -mt-2" aria-label="Fermer" onclick={() => (detailOpen = false)}>
					<Icon name="x" class="w-5 h-5" />
				</button>
			</div>
		</div>

		<div class="p-5 sm:p-6 space-y-3 max-h-[55vh] overflow-y-auto">
			<h3 class="text-xs font-medium text-slate-500 uppercase tracking-wide">Détail par critère</h3>
			{#each selectedApp.matchResults as mr}
				{@const t = scoreTone(mr.matchPercentage)}
				<div class="rounded-xl border border-slate-200 p-4">
					<div class="flex items-center justify-between gap-3 mb-2">
						<h4 class="font-medium text-slate-900 text-sm">{mr.groupName}</h4>
						<span class="text-sm font-bold tabular {t.text}">{mr.foundCount}/{mr.totalKeywords} · {mr.matchPercentage}%</span>
					</div>
					<div class="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
						<div class="h-full rounded-full {t.bar} transition-all duration-500" style="width:{mr.matchPercentage}%"></div>
					</div>
					<div class="flex flex-wrap gap-1.5">
						{#each mr.foundKeywords as kw}
							<span class="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md text-xs font-medium">
								<Icon name="check" class="w-3 h-3" stroke={3} />{kw}
							</span>
						{/each}
						{#each mr.missingKeywords as kw}
							<span class="inline-flex items-center gap-1 bg-slate-50 text-slate-400 px-2 py-0.5 rounded-md text-xs font-medium line-through decoration-slate-300">
								{kw}
							</span>
						{/each}
					</div>
				</div>
			{/each}
		</div>

		<div class="flex flex-wrap items-center gap-2 px-5 sm:px-6 py-4 bg-slate-50 border-t border-slate-100 rounded-b-2xl">
			<button type="button" onclick={() => downloadCv(selectedApp!)} class="btn-primary">
				<Icon name="download" class="w-4 h-4" />Télécharger le CV
			</button>
			<a href="mailto:{selectedApp.email}?subject={encodeURIComponent(`Votre candidature — ${job?.title ?? ''}`)}" class="btn-secondary">
				<Icon name="mail" class="w-4 h-4" />Contacter
			</a>
			<div class="ml-auto flex items-center gap-1">
				<span class="text-xs text-slate-400 tabular mr-1 hidden sm:inline">{selectedIndex + 1} / {sortedApps.length}</span>
				<button type="button" class="btn-icon" disabled={selectedIndex <= 0} onclick={() => step(-1)} aria-label="Candidat précédent" title="Précédent (←)">
					<Icon name="arrowLeft" class="w-4 h-4" />
				</button>
				<button type="button" class="btn-icon" disabled={selectedIndex >= sortedApps.length - 1} onclick={() => step(1)} aria-label="Candidat suivant" title="Suivant (→)">
					<Icon name="arrowRight" class="w-4 h-4" />
				</button>
			</div>
		</div>
	{/if}
</Modal>

<VideoModal bind:open={showVideo} src="/demo.mp4" />
