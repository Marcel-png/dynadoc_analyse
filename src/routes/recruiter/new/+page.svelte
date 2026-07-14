<script lang="ts">
	import { createJob } from '$lib/stores/jobs';
	import { goto } from '$app/navigation';
	import type { CriterionGroup, CriterionKeyword } from '$lib/types';

	let title = $state('');
	let company = $state('');
	let description = $state('');
	let deadline = $state<string>('');
	let criteria = $state<CriterionGroup[]>([]);
	let error = $state('');

	let groupName = $state('');
	let keywordInput = $state('');
	let groupWeight = $state(3);
	let keywords = $state<CriterionKeyword[]>([]);

	function addKeyword() {
		const text = keywordInput.trim();
		if (!text) return;
		if (keywords.some(k => k.text.toLowerCase() === text.toLowerCase())) {
			keywordInput = '';
			return;
		}
		keywords = [...keywords, { text, weight: 3 }];
		keywordInput = '';
	}

	function removeKeyword(index: number) {
		keywords = keywords.filter((_, i) => i !== index);
	}

	function addGroup() {
		if (!groupName.trim()) {
			error = 'Veuillez donner un nom au groupe de critères';
			return;
		}
		if (keywords.length === 0) {
			error = 'Ajoutez au moins un mot-clé au groupe';
			return;
		}
		const group: CriterionGroup = {
			id: crypto.randomUUID(),
			name: groupName.trim(),
			keywords: [...keywords],
			weight: groupWeight,
		};
		criteria = [...criteria, group];
		groupName = '';
		keywords = [];
		groupWeight = 3;
		error = '';
	}

	function removeGroup(index: number) {
		criteria = criteria.filter((_, i) => i !== index);
	}

	function handleSubmit() {
		if (!title.trim() || !company.trim()) {
			error = 'Veuillez remplir le titre et le nom de l\'entreprise';
			return;
		}
		if (criteria.length === 0) {
			error = 'Ajoutez au moins un groupe de critères';
			return;
		}

		const deadlineTimestamp = deadline ? new Date(deadline).getTime() : null;
		const job = createJob({
			title: title.trim(),
			company: company.trim(),
			description: description.trim(),
			deadline: deadlineTimestamp,
			criteria,
		});
		goto(`/recruiter/job/${job.id}`);
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
	<div class="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-40">
		<div class="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
					<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
				</div>
				<div>
					<h1 class="text-xl font-bold text-slate-900">DynaRecrut</h1>
					<p class="text-xs text-slate-400">Nouvelle offre</p>
				</div>
			</div>
			<a href="/" class="text-sm text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1">
				<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
				Retour
			</a>
		</div>
	</div>

	<div class="max-w-4xl mx-auto px-6 py-8">
		<div class="mb-8">
			<h2 class="text-3xl font-bold text-slate-900">Créer une offre</h2>
			<p class="text-slate-400 mt-1">Définissez le poste, les critères d'analyse et la date limite</p>
		</div>

		{#if error}
			<div class="bg-red-50 border border-red-100 text-red-700 px-5 py-3.5 rounded-xl mb-6 text-sm flex items-center gap-2">
				<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
				{error}
			</div>
		{/if}

		<div class="space-y-6">
			<div class="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
				<div class="flex items-center gap-3 mb-5">
					<div class="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
						<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
					</div>
					<h3 class="font-semibold text-slate-900">Informations du poste</h3>
				</div>
				<div class="grid gap-4">
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label for="job-title" class="block text-sm font-medium text-slate-700 mb-1.5">Titre du poste *</label>
							<input id="job-title" type="text" bind:value={title} placeholder="ex: Développeur Full-Stack" class="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm" />
						</div>
						<div>
							<label for="job-company" class="block text-sm font-medium text-slate-700 mb-1.5">Entreprise *</label>
							<input id="job-company" type="text" bind:value={company} placeholder="Nom de l'entreprise" class="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm" />
						</div>
					</div>
					<div>
						<label for="job-description" class="block text-sm font-medium text-slate-700 mb-1.5">Description du poste</label>
						<textarea id="job-description" bind:value={description} rows={3} placeholder="Décrivez le poste, les responsabilités, l'équipe..." class="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none text-sm"></textarea>
					</div>
					<div>
						<label for="job-deadline" class="block text-sm font-medium text-slate-700 mb-1.5">Date limite de candidature</label>
						<input id="job-deadline" type="datetime-local" bind:value={deadline} class="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm" />
						<p class="text-xs text-slate-400 mt-1.5">Optionnelle. Passée cette date, le lien de candidature sera désactivé.</p>
					</div>
				</div>
			</div>

			<div class="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
				<div class="flex items-center gap-3 mb-5">
					<div class="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
						<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
					</div>
					<div>
						<h3 class="font-semibold text-slate-900">Critères d'analyse</h3>
						<p class="text-xs text-slate-400">Définissez les compétences recherchées pour analyser automatiquement les CV</p>
					</div>
				</div>

				<div class="bg-slate-50 rounded-xl p-5 mb-4">
					<h4 class="font-medium text-slate-700 text-sm mb-4">Ajouter un groupe de critères</h4>
					<div class="space-y-3 mb-4">
						<div>
							<label for="group-name" class="block text-xs font-medium text-slate-500 mb-1">Nom du groupe</label>
							<input id="group-name" type="text" bind:value={groupName} placeholder="ex: Langages de programmation" class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all" />
						</div>
						<div>
							<label class="block text-xs font-medium text-slate-500 mb-1.5">Poids du groupe (1-5)</label>
							<p class="text-[10px] text-slate-400 mb-2">Définit l'importance de ce groupe dans le score global. Poids 5 = essentiel, Poids 1 = secondaire.</p>
							<div class="flex gap-2" role="radiogroup" aria-label="Poids du groupe">
								{#each [1,2,3,4,5] as w}
									<button onclick={() => groupWeight = w} class="flex-1 py-2 rounded-lg text-sm font-semibold transition-all {groupWeight === w ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'}">{w}</button>
								{/each}
							</div>
						</div>
						<div>
							<label for="keyword-input" class="block text-xs font-medium text-slate-500 mb-1">Mots-clés</label>
							<div class="flex gap-2">
								<input id="keyword-input" type="text" bind:value={keywordInput} placeholder="ex: Next.js" class="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all" onkeydown={(e) => e.key === 'Enter' && addKeyword()} />
								<button onclick={addKeyword} class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-all whitespace-nowrap shadow-sm">Ajouter</button>
							</div>
						</div>
					</div>

					{#if keywords.length > 0}
						<div class="flex flex-wrap gap-1.5 mb-4">
							{#each keywords as kw, i}
								<span class="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg text-xs font-medium">
									{kw.text}
									<button onclick={() => removeKeyword(i)} aria-label="Supprimer {kw.text}" class="hover:text-red-500 transition-colors">
										<svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
									</button>
								</span>
							{/each}
						</div>
					{/if}

					<button onclick={addGroup} disabled={!groupName.trim() || keywords.length === 0} class="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold transition-all shadow-sm">
						<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 inline mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
						Ajouter ce groupe
					</button>
				</div>

				{#if criteria.length > 0}
					<div class="flex items-center gap-2 mb-3">
						<h4 class="font-medium text-slate-700 text-sm">Groupes ajoutés</h4>
						<span class="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-medium">{criteria.length}</span>
					</div>
					<div class="space-y-2">
						{#each criteria as group, gi}
							<div class="bg-white border border-slate-200 rounded-xl p-4 hover:border-indigo-200 transition-all">
								<div class="flex justify-between items-start mb-2">
									<div class="flex items-center gap-2">
										<div class="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-xs font-bold text-indigo-600">{group.weight}</div>
										<div>
											<h5 class="font-medium text-slate-900 text-sm">{group.name}</h5>
											<span class="text-[10px] text-slate-400">{group.keywords.length} mot-clé{(group.keywords.length > 1 ? 's' : '')}</span>
										</div>
									</div>
									<button onclick={() => removeGroup(gi)} aria-label="Supprimer le groupe {group.name}" class="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
										<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-slate-300 hover:text-red-500 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
									</button>
								</div>
								<div class="flex flex-wrap gap-1">
									{#each group.keywords as kw}
										<span class="bg-slate-50 text-slate-600 px-2 py-0.5 rounded text-xs border border-slate-100">{kw.text}</span>
									{/each}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<button onclick={handleSubmit} disabled={!title.trim() || !company.trim() || criteria.length === 0} class="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-base font-bold transition-all shadow-lg hover:shadow-xl hover:shadow-indigo-200 flex items-center justify-center gap-2">
				<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
			Créer l'offre et générer le lien de candidature
		</button>
		</div>
	</div>
</div>
