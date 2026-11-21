<script lang="ts">
	import { page } from '$app/state';
	import { getJobBySlug, addApplication } from '$lib/stores/jobs';
	import { extractTextFromFile } from '$lib/utils/cvParser';
	import { calculateMatch, calculateOverallMatch } from '$lib/utils/matchCalculator';
	import type { CandidateApplication, JobPost } from '$lib/types';
	import Icon from '$lib/components/Icon.svelte';
	import { deadlineState, formatDateTime, formatSize } from '$lib/utils/format';

	type Status = 'loading' | 'notFound' | 'expired' | 'form' | 'submitted';

	let status = $state<Status>('loading');
	let job = $state<JobPost | undefined>(undefined);

	let name = $state('');
	let email = $state('');
	let cvFile = $state<File | null>(null);
	let isDragging = $state(false);
	let submitting = $state(false);
	let phase = $state('');
	let formError = $state('');
	let fileError = $state('');
	let touched = $state({ name: false, email: false });
	let attempted = $state(false);
	let fileInput = $state<HTMLInputElement | null>(null);

	const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

	$effect(() => {
		const found = getJobBySlug(page.params.slug as string);
		if (!found) status = 'notFound';
		else if (found.deadline && Date.now() > found.deadline) {
			job = found;
			status = 'expired';
		} else {
			job = found;
			status = 'form';
		}
	});

	const errors = $derived({
		name: !name.trim() ? 'Indiquez votre nom.' : '',
		email: !email.trim() ? 'Indiquez votre e-mail.' : !EMAIL_RE.test(email.trim()) ? 'Cette adresse e-mail semble invalide.' : '',
		cv: !cvFile ? 'Joignez votre CV.' : ''
	});
	const show = (f: 'name' | 'email') => (touched[f] || attempted) && !!errors[f];
	const progress = $derived([!errors.name, !errors.email, !errors.cv].filter(Boolean).length);
	const dl = $derived(deadlineState(job?.deadline ?? null));

	function onDragOver(e: DragEvent) {
		e.preventDefault();
		isDragging = true;
	}
	function onDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
		const f = e.dataTransfer?.files?.[0];
		if (f) setFile(f);
	}
	function onFileInput(e: Event) {
		const f = (e.target as HTMLInputElement).files?.[0];
		if (f) setFile(f);
	}
	function setFile(file: File) {
		const lower = file.name.toLowerCase();
		if (!['application/pdf', 'text/plain'].includes(file.type) && !lower.endsWith('.pdf') && !lower.endsWith('.txt')) {
			fileError = 'Format non pris en charge. Utilisez un fichier PDF ou TXT.';
			return;
		}
		if (file.size > 10 * 1024 * 1024) {
			fileError = `Fichier trop volumineux (${formatSize(file.size)}). Maximum : 10 Mo.`;
			return;
		}
		fileError = '';
		cvFile = file;
	}
	function removeFile() {
		cvFile = null;
		if (fileInput) fileInput.value = '';
	}

	function toBase64(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const r = new FileReader();
			r.onload = () => resolve(String(r.result).split(',')[1] ?? '');
			r.onerror = () => reject(r.error);
			r.readAsDataURL(file);
		});
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		attempted = true;
		if (errors.name || errors.email || errors.cv || !job || !cvFile) {
			document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
			return;
		}
		submitting = true;
		formError = '';
		try {
			phase = 'Lecture de votre CV…';
			const [cvFileData, cvText] = await Promise.all([toBase64(cvFile), extractTextFromFile(cvFile)]);
			if (!cvText.trim()) {
				formError = 'Nous n’avons pas pu lire le texte de votre CV. S’il s’agit d’un scan ou d’une image, exportez-le en PDF texte depuis votre traitement de texte.';
				return;
			}
			phase = 'Analyse en cours…';
			const application: CandidateApplication = {
				id: crypto.randomUUID(),
				jobId: job.id,
				candidateName: name.trim(),
				email: email.trim(),
				cvText,
				cvFileName: cvFile.name,
				cvFileData,
				cvFileType: cvFile.type || 'application/octet-stream',
				matchResults: calculateMatch(cvText, job.criteria),
				overallMatch: calculateOverallMatch(cvText, job.criteria),
				appliedAt: Date.now()
			};
			addApplication(application);
			status = 'submitted';
			window.scrollTo({ top: 0 });
		} catch (err) {
			console.error(err);
			formError = 'Une erreur est survenue pendant l’envoi. Réessayez dans un instant.';
		} finally {
			submitting = false;
			phase = '';
		}
	}
</script>

<svelte:head><title>{job ? `Postuler · ${job.title} — ${job.company}` : 'Candidature'}</title></svelte:head>

<div class="min-h-screen bg-slate-50">
	{#if status === 'loading'}
		<div class="flex items-center justify-center min-h-screen" role="status" aria-label="Chargement">
			<div class="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent"></div>
		</div>
	{:else if status === 'notFound' || status === 'expired'}
		<main id="main" class="flex items-center justify-center min-h-screen p-6">
			<div class="card-surface anim-pop p-8 sm:p-10 max-w-md w-full text-center">
				<div class="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 {status === 'expired' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-400'}">
					<Icon name={status === 'expired' ? 'lock' : 'sad'} class="w-7 h-7" stroke={1.75} />
				</div>
				<h1 class="text-xl font-bold text-slate-900 mb-2">{status === 'expired' ? 'Candidatures clôturées' : 'Offre introuvable'}</h1>
				{#if status === 'expired' && job}
					<p class="text-slate-500">
						Les candidatures pour <span class="font-medium text-slate-700">{job.title}</span> chez {job.company} sont fermées depuis le {formatDateTime(job.deadline!)}.
					</p>
				{:else}
					<p class="text-slate-500">Ce lien est invalide ou l’offre a été retirée. Vérifiez l’adresse auprès de la personne qui vous l’a transmise.</p>
				{/if}
			</div>
		</main>
	{:else if status === 'submitted' && job}
		<main id="main" class="flex items-center justify-center min-h-screen p-6">
			<div class="card-surface anim-pop p-8 sm:p-10 max-w-md w-full text-center">
				<div class="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5 ring-8 ring-emerald-50/50">
					<Icon name="check" class="w-8 h-8 text-emerald-600" stroke={2.5} />
				</div>
				<h1 class="text-2xl font-bold text-slate-900 mb-2">Candidature envoyée</h1>
				<p class="text-slate-500 mb-6">Merci {name.trim().split(' ')[0]} ! {job.company} a bien reçu votre candidature au poste de <span class="font-medium text-slate-700">{job.title}</span>.</p>
				<dl class="text-left text-sm bg-slate-50 rounded-xl p-4 space-y-2">
					<div class="flex justify-between gap-4"><dt class="text-slate-500">Nom</dt><dd class="font-medium text-slate-800 truncate">{name}</dd></div>
					<div class="flex justify-between gap-4"><dt class="text-slate-500">E-mail</dt><dd class="font-medium text-slate-800 truncate">{email}</dd></div>
					<div class="flex justify-between gap-4"><dt class="text-slate-500">CV</dt><dd class="font-medium text-slate-800 truncate">{cvFile?.name}</dd></div>
				</dl>
				<p class="text-xs text-slate-400 mt-5">Le recruteur reviendra vers vous à l’adresse indiquée. Vous pouvez fermer cette page.</p>
			</div>
		</main>
	{:else if job}
		<!-- Bandeau de l'offre -->
		<div class="bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 text-white">
			<div class="max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-24 sm:pb-28">
				<p class="inline-flex items-center gap-1.5 text-xs font-medium bg-white/15 rounded-full px-3 py-1 mb-4">
					<Icon name="building" class="w-3.5 h-3.5" />{job.company}
				</p>
				<h1 class="text-3xl sm:text-4xl font-bold tracking-tight">{job.title}</h1>
				{#if dl.kind === 'soon' || dl.kind === 'open'}
					<p class="mt-3 text-indigo-100 text-sm flex items-center gap-1.5">
						<Icon name="clock" class="w-4 h-4" />Candidatures ouvertes jusqu’au {formatDateTime(job.deadline!)}
						{#if dl.kind === 'soon'}<span class="chip bg-amber-400 text-amber-950 ml-1">Clôture {dl.label}</span>{/if}
					</p>
				{/if}
			</div>
		</div>

		<main id="main" class="max-w-5xl mx-auto px-4 sm:px-6 -mt-16 sm:-mt-20 pb-16 grid lg:grid-cols-[1fr_400px] gap-6 items-start">
			<!-- Formulaire (en premier sur mobile) -->
			<form class="card-surface shadow-xl shadow-slate-900/5 p-5 sm:p-7 lg:order-2 lg:sticky lg:top-6" novalidate onsubmit={handleSubmit} aria-labelledby="form-title">
				<div class="flex items-center justify-between mb-1">
					<h2 id="form-title" class="text-lg font-bold text-slate-900">Postuler</h2>
					<span class="text-xs text-slate-400 tabular" aria-live="polite">{progress}/3 complétés</span>
				</div>
				<div class="h-1 bg-slate-100 rounded-full overflow-hidden mb-6" aria-hidden="true">
					<div class="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300" style="width:{(progress / 3) * 100}%"></div>
				</div>

				{#if formError}
					<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex gap-2 mb-5" role="alert">
						<Icon name="alert" class="w-5 h-5 flex-shrink-0" />{formError}
					</div>
				{/if}

				<div class="space-y-4">
					<div>
						<label for="candidate-name" class="field-label">Nom complet</label>
						<input id="candidate-name" type="text" bind:value={name} autocomplete="name" placeholder="Prénom Nom"
							onblur={() => (touched.name = true)} aria-invalid={show('name')} aria-describedby={show('name') ? 'name-err' : undefined}
							class="input-field {show('name') ? 'border-red-400' : ''}" />
						{#if show('name')}<p id="name-err" class="field-error"><Icon name="alert" class="w-3.5 h-3.5" />{errors.name}</p>{/if}
					</div>
					<div>
						<label for="candidate-email" class="field-label">E-mail</label>
						<input id="candidate-email" type="email" bind:value={email} autocomplete="email" inputmode="email" placeholder="vous@exemple.com"
							onblur={() => (touched.email = true)} aria-invalid={show('email')} aria-describedby={show('email') ? 'email-err' : undefined}
							class="input-field {show('email') ? 'border-red-400' : ''}" />
						{#if show('email')}<p id="email-err" class="field-error"><Icon name="alert" class="w-3.5 h-3.5" />{errors.email}</p>{/if}
					</div>

					<div>
						<span class="field-label" id="cv-label">CV</span>
						{#if cvFile}
							<div class="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 anim-pop">
								<div class="w-10 h-10 rounded-lg bg-white border border-emerald-200 flex items-center justify-center flex-shrink-0">
									<Icon name="doc" class="w-5 h-5 text-emerald-600" />
								</div>
								<div class="flex-1 min-w-0">
									<p class="text-sm font-medium text-slate-900 truncate">{cvFile.name}</p>
									<p class="text-xs text-slate-500">{formatSize(cvFile.size)} · prêt à l’envoi</p>
								</div>
								<button type="button" onclick={removeFile} class="btn-icon w-8 h-8 hover:text-red-600 hover:bg-red-50" aria-label="Retirer le fichier {cvFile.name}">
									<Icon name="x" class="w-4 h-4" />
								</button>
							</div>
						{:else}
							<label for="cv-input"
								class="block border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all focus-within:ring-4 focus-within:ring-indigo-500/10 {isDragging ? 'border-indigo-500 bg-indigo-50' : (attempted && errors.cv) || fileError ? 'border-red-300 bg-red-50/30' : 'border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/40'}"
								ondragover={onDragOver} ondragenter={onDragOver} ondragleave={() => (isDragging = false)} ondrop={onDrop}>
								<div class="w-11 h-11 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-3 transition-transform {isDragging ? 'scale-110' : ''}">
									<Icon name="upload" class="w-5 h-5 text-indigo-600" />
								</div>
								<p class="text-sm text-slate-700"><span class="font-semibold text-indigo-600">Choisissez un fichier</span> ou glissez-le ici</p>
								<p class="text-xs text-slate-400 mt-1">PDF ou TXT · 10 Mo maximum</p>
								<input bind:this={fileInput} id="cv-input" type="file" accept=".pdf,.txt,application/pdf,text/plain" class="sr-only"
									onchange={onFileInput} aria-labelledby="cv-label" aria-invalid={attempted && !!errors.cv} aria-describedby={fileError || (attempted && errors.cv) ? 'cv-err' : undefined} />
							</label>
							{#if fileError || (attempted && errors.cv)}
								<p id="cv-err" class="field-error"><Icon name="alert" class="w-3.5 h-3.5" />{fileError || errors.cv}</p>
							{/if}
						{/if}
					</div>

					<button type="submit" disabled={submitting} class="btn-primary w-full py-3 text-base mt-2">
						{#if submitting}
							<span class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
							{phase || 'Envoi…'}
						{:else}
							Envoyer ma candidature
							<Icon name="arrowRight" class="w-4 h-4" />
						{/if}
					</button>
					<p class="text-xs text-slate-400 text-center">Votre CV est analysé automatiquement au regard des critères de l’offre.</p>
				</div>
			</form>

			<!-- Détails de l'offre -->
			<div class="space-y-6 lg:order-1 min-w-0">
				{#if job.description}
					<section class="card-surface p-5 sm:p-7">
						<h2 class="text-base font-semibold text-slate-900 mb-3">À propos du poste</h2>
						<p class="text-slate-600 leading-relaxed whitespace-pre-line">{job.description}</p>
					</section>
				{/if}

				<section class="card-surface p-5 sm:p-7">
					<h2 class="text-base font-semibold text-slate-900">Ce que nous recherchons</h2>
					<p class="text-sm text-slate-500 mt-1 mb-5">Mentionnez clairement ces compétences dans votre CV : il est évalué sur cette base.</p>
					<div class="space-y-4">
						{#each [...job.criteria].sort((a, b) => b.weight - a.weight) as group}
							<div>
								<div class="flex items-center gap-2 mb-2">
									<h3 class="text-sm font-medium text-slate-800">{group.name}</h3>
									{#if group.weight >= 4}
										<span class="chip bg-indigo-50 text-indigo-700">{group.weight === 5 ? 'Essentiel' : 'Très important'}</span>
									{/if}
								</div>
								<ul class="flex flex-wrap gap-1.5">
									{#each group.keywords as kw}
										<li class="text-sm bg-slate-50 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200">{kw.text}</li>
									{/each}
								</ul>
							</div>
						{/each}
					</div>
				</section>
			</div>
		</main>
	{/if}
</div>
