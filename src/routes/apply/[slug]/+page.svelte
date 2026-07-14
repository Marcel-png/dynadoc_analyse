<script lang="ts">
	import { getJobBySlug, addApplication } from '$lib/stores/jobs';
	import { extractTextFromFile } from '$lib/utils/cvParser';
	import { calculateMatch, calculateOverallMatch } from '$lib/utils/matchCalculator';
	import { page } from '$app/stores';
	import type { CandidateApplication } from '$lib/types';

	let job = $state<ReturnType<typeof getJobBySlug>>(undefined);
	let loading = $state(true);
	let notFound = $state(false);
	let expired = $state(false);

	let name = $state('');
	let email = $state('');
	let cvFile = $state<File | null>(null);
	let isDragging = $state(false);
	let submitting = $state(false);
	let submitted = $state(false);
	let error = $state('');

	$effect(() => {
		const slug = $page.params.slug as string;
		const found = getJobBySlug(slug);
		if (found) {
			if (found.deadline && Date.now() > found.deadline) {
				expired = true;
			} else {
				job = found;
			}
		} else {
			notFound = true;
		}
		loading = false;
	});

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		isDragging = true;
	}
	function handleDragLeave() { isDragging = false; }
	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
		const files = e.dataTransfer?.files;
		if (files && files.length > 0) validateAndSetFile(files[0]);
	}
	function handleFileInput(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files && input.files.length > 0) validateAndSetFile(input.files[0]);
	}
	function validateAndSetFile(file: File) {
		if (!['application/pdf', 'text/plain'].includes(file.type) && !file.name.endsWith('.txt') && !file.name.endsWith('.pdf')) {
			error = 'Format non supporté. Veuillez uploader un fichier PDF ou TXT.';
			return;
		}
		if (file.size > 10 * 1024 * 1024) {
			error = 'Le fichier est trop volumineux (max 10 Mo).';
			return;
		}
		error = '';
		cvFile = file;
	}
	function removeFile() { cvFile = null; }

	async function handleSubmit() {
		if (!name.trim() || !email.trim() || !cvFile) {
			error = 'Veuillez remplir tous les champs et joindre votre CV.';
			return;
		}
		if (!email.includes('@')) {
			error = 'Veuillez entrer un email valide.';
			return;
		}
		if (!job) return;
		submitting = true;
		error = '';
		try {
			const fileBuffer = await cvFile.arrayBuffer();
			const fileBytes = new Uint8Array(fileBuffer);
			let binary = '';
			fileBytes.forEach(byte => binary += String.fromCharCode(byte));
			const cvFileData = btoa(binary);

			const cvText = await extractTextFromFile(cvFile);
			if (!cvText.trim()) {
				error = 'Impossible d\'extraire le texte du CV. Vérifiez que le fichier n\'est pas scanné.';
				submitting = false;
				return;
			}
			const matchResults = calculateMatch(cvText, job.criteria);
			const overallMatch = calculateOverallMatch(cvText, job.criteria);
			const application: CandidateApplication = {
				id: crypto.randomUUID(), jobId: job.id, candidateName: name.trim(), email: email.trim(),
				cvText, cvFileName: cvFile.name, cvFileData, cvFileType: cvFile.type || 'application/octet-stream',
				matchResults, overallMatch, appliedAt: Date.now(),
			};
			addApplication(application);
			submitted = true;
		} catch (err) {
			console.error(err);
			error = 'Une erreur est survenue lors du traitement de votre CV. Veuillez réessayer.';
		}
		submitting = false;
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-indigo-900 via-slate-900 to-violet-900 relative overflow-hidden">
	<!-- Background decorations -->
	<div class="absolute inset-0 overflow-hidden pointer-events-none">
		<div class="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
		<div class="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl"></div>
		<div class="absolute top-1/3 left-1/2 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"></div>
	</div>

	{#if loading}
		<div class="flex items-center justify-center min-h-screen relative">
			<div class="animate-spin rounded-full h-10 w-10 border-2 border-indigo-400 border-t-transparent"></div>
		</div>
	{:else if notFound || expired}
		<div class="flex items-center justify-center min-h-screen p-6 relative">
			<div class="bg-white/10 backdrop-blur-xl rounded-3xl p-12 max-w-md w-full text-center border border-white/10">
				<div class="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
					<svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
						{#if expired}
							<path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
						{:else}
							<path d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
						{/if}
					</svg>
				</div>
				<h1 class="text-2xl font-bold text-white mb-2">{expired ? 'Candidatures closes' : 'Lien invalide'}</h1>
				<p class="text-white/60">{expired ? 'La date limite de candidature pour cette offre est dépassée.' : 'Cette offre d\'emploi n\'existe pas ou a été supprimée.'}</p>
			</div>
		</div>
	{:else if submitted}
		<div class="flex items-center justify-center min-h-screen p-6 relative">
			<div class="bg-white/10 backdrop-blur-xl rounded-3xl p-12 max-w-md w-full text-center border border-white/10 animate-[scale-in_0.3s_ease-out]">
				<div class="w-20 h-20 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
					<svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 13l4 4L19 7"/></svg>
				</div>
				<h1 class="text-2xl font-bold text-white mb-2">Candidature envoyée !</h1>
				<p class="text-white/60 mb-6">Votre CV a été reçu avec succès.</p>
			</div>
		</div>
	{:else}
		<div class="min-h-screen flex items-center justify-center p-6 relative">
			<div class="w-full max-w-2xl">
				<!-- Brand -->
				<div class="text-center mb-8">
					<div class="w-14 h-14 bg-gradient-to-br from-indigo-400 to-violet-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-500/20">
						<svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
					</div>
					<h1 class="text-2xl font-bold text-white">Postulez à cette offre</h1>
				</div>

				<div class="bg-white/10 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
					<!-- Job header -->
					<div class="bg-gradient-to-r from-indigo-500/20 to-violet-500/20 p-8 border-b border-white/10">
						<h2 class="text-xl font-bold text-white mb-1">{job!.title}</h2>
						<p class="text-white/60 text-sm flex items-center gap-1.5">
							<svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
							{job!.company}
						</p>
						{#if job!.description}
							<p class="text-white/50 text-sm mt-3">{job!.description}</p>
						{/if}
					</div>

					<div class="p-8 space-y-6">
						{#if error}
							<div class="bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
								<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
								{error}
							</div>
						{/if}

						<!-- Form fields -->
						<div class="grid gap-4">
							<div>
								<label for="candidate-name" class="block text-sm font-medium text-white/80 mb-1.5">Nom complet *</label>
								<input id="candidate-name" type="text" bind:value={name} placeholder="Votre nom" class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400/50 outline-none transition-all text-white placeholder-white/30 text-sm" />
							</div>
							<div>
								<label for="candidate-email" class="block text-sm font-medium text-white/80 mb-1.5">Email *</label>
								<input id="candidate-email" type="email" bind:value={email} placeholder="votre@email.com" class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400/50 outline-none transition-all text-white placeholder-white/30 text-sm" />
							</div>
						</div>

						<!-- CV Upload -->
						<div>
							<label for="cv-input" class="block text-sm font-medium text-white/80 mb-2">CV (PDF ou TXT) *</label>
							{#if cvFile}
								<div class="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between">
									<div class="flex items-center gap-3">
										<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
										<div>
											<p class="text-sm font-medium text-emerald-300">{cvFile.name}</p>
											<p class="text-xs text-emerald-400/60">{(cvFile.size / 1024).toFixed(1)} Ko</p>
										</div>
									</div>
									<button onclick={removeFile} aria-label="Supprimer le fichier" class="p-1.5 hover:bg-emerald-500/20 rounded-lg transition-colors">
										<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 18L18 6M6 6l12 12"/></svg>
									</button>
								</div>
							{:else}
								<div
									class="border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all {isDragging ? 'border-indigo-400 bg-indigo-500/10' : 'border-white/10 hover:border-indigo-400/50 hover:bg-white/5'}"
									ondragover={handleDragOver} ondragleave={handleDragLeave} ondrop={handleDrop}
									onclick={() => document.getElementById('cv-input')?.click()}
									role="button" tabindex="0"
									onkeydown={(e) => e.key === 'Enter' && document.getElementById('cv-input')?.click()}
								>
									<svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 mx-auto text-white/20 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
									<p class="text-white/70 font-medium mb-1">Glissez-déposez votre CV ici</p>
									<p class="text-white/40 text-sm">ou cliquez pour parcourir (PDF, TXT - max 10 Mo)</p>
								</div>
								<input type="file" id="cv-input" accept=".pdf,.txt,application/pdf,text/plain" class="hidden" onchange={handleFileInput} />
							{/if}
						</div>

						<!-- Criteria -->
						<div class="bg-white/5 rounded-2xl p-5">
							<h3 class="text-sm font-medium text-white/80 mb-3">Critères d'évaluation</h3>
							<div class="space-y-3">
								{#each job!.criteria as group}
									<div>
										<p class="text-xs text-white/50 font-medium mb-1">{group.name}</p>
										<div class="flex flex-wrap gap-1">
											{#each group.keywords as kw}
												<span class="text-xs bg-white/10 text-white/60 px-2 py-0.5 rounded-lg border border-white/5">{kw.text}</span>
											{/each}
										</div>
									</div>
								{/each}
							</div>
						</div>

						<button onclick={handleSubmit} disabled={submitting || !name.trim() || !email.trim() || !cvFile} class="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-2xl hover:from-indigo-600 hover:to-violet-600 disabled:opacity-40 disabled:cursor-not-allowed text-base font-bold transition-all shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 flex items-center justify-center gap-2">
							{#if submitting}
								<div class="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
								Analyse en cours...
							{:else}
								<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
								Envoyer ma candidature
							{/if}
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>