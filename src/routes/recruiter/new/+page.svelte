<script lang="ts">
	import { createJob } from '$lib/stores/jobs';
	import { goto } from '$app/navigation';
	import type { CriterionGroup, CriterionKeyword } from '$lib/types';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { plural } from '$lib/utils/format';

	const WEIGHTS = [
		{ value: 1, label: 'Bonus' },
		{ value: 2, label: 'Utile' },
		{ value: 3, label: 'Important' },
		{ value: 4, label: 'Très important' },
		{ value: 5, label: 'Essentiel' }
	];
	const SUGGESTED_GROUPS = ['Compétences techniques', 'Outils', 'Langues', 'Soft skills', 'Diplômes'];

	let title = $state('');
	let company = $state('');
	let description = $state('');
	let deadline = $state('');
	let criteria = $state<CriterionGroup[]>([]);
	let attempted = $state(false);

	// Éditeur de groupe
	let editingId = $state<string | null>(null);
	let groupName = $state('');
	let groupWeight = $state(3);
	let keywordInput = $state('');
	let keywords = $state<CriterionKeyword[]>([]);
	let groupAttempted = $state(false);
	let keywordInputEl = $state<HTMLInputElement | null>(null);
	let groupNameEl = $state<HTMLInputElement | null>(null);

	const minDeadline = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);

	const errors = $derived({
		title: !title.trim() ? 'Indiquez l’intitulé du poste.' : '',
		company: !company.trim() ? 'Indiquez le nom de l’entreprise.' : '',
		deadline: deadline && new Date(deadline).getTime() < Date.now() ? 'La date limite doit être dans le futur.' : '',
		criteria: criteria.length === 0 && !groupIsValid() ? 'Ajoutez au moins un groupe de critères.' : ''
	});
	const groupErrors = $derived({
		name: !groupName.trim() ? 'Donnez un nom à ce groupe.' : '',
		keywords: keywords.length === 0 ? 'Ajoutez au moins un mot-clé.' : ''
	});
	const groupDirty = $derived(!!groupName.trim() || keywords.length > 0 || !!keywordInput.trim());
	const totalWeight = $derived(criteria.reduce((s, g) => s + g.weight, 0));

	const checklist = $derived([
		{ ok: !!title.trim() && !!company.trim(), label: 'Poste et entreprise' },
		{ ok: criteria.length > 0, label: 'Au moins un groupe de critères' },
		{ ok: !!deadline, label: 'Date limite (optionnelle)', optional: true }
	]);

	function groupIsValid() {
		return !!groupName.trim() && (keywords.length > 0 || !!keywordInput.trim());
	}

	function addKeywords(raw: string) {
		const parts = raw.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
		const next = [...keywords];
		for (const text of parts) {
			if (!next.some((k) => k.text.toLowerCase() === text.toLowerCase())) next.push({ text, weight: 3 });
		}
		keywords = next;
	}

	function commitKeywordInput() {
		if (keywordInput.trim()) addKeywords(keywordInput);
		keywordInput = '';
	}

	function onKeywordKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ',') {
			e.preventDefault();
			commitKeywordInput();
		} else if (e.key === 'Backspace' && !keywordInput && keywords.length) {
			keywords = keywords.slice(0, -1);
		}
	}

	function onKeywordPaste(e: ClipboardEvent) {
		const text = e.clipboardData?.getData('text') ?? '';
		if (/[,;\n]/.test(text)) {
			e.preventDefault();
			addKeywords(keywordInput + text);
			keywordInput = '';
		}
	}

	function removeKeyword(i: number) {
		keywords = keywords.filter((_, idx) => idx !== i);
		keywordInputEl?.focus();
	}

	function resetEditor() {
		editingId = null;
		groupName = '';
		keywords = [];
		keywordInput = '';
		groupWeight = 3;
		groupAttempted = false;
	}

	/** Enregistre le groupe en cours. Retourne false si invalide. */
	function saveGroup(): boolean {
		commitKeywordInput();
		groupAttempted = true;
		if (groupErrors.name || keywords.length === 0) return false;
		const group: CriterionGroup = {
			id: editingId ?? crypto.randomUUID(),
			name: groupName.trim(),
			keywords: [...keywords],
			weight: groupWeight
		};
		criteria = editingId ? criteria.map((g) => (g.id === editingId ? group : g)) : [...criteria, group];
		resetEditor();
		return true;
	}

	function editGroup(g: CriterionGroup) {
		editingId = g.id;
		groupName = g.name;
		groupWeight = g.weight;
		keywords = [...g.keywords];
		keywordInput = '';
		groupAttempted = false;
		groupNameEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
		groupNameEl?.focus({ preventScroll: true });
	}

	function removeGroup(id: string) {
		criteria = criteria.filter((g) => g.id !== id);
		if (editingId === id) resetEditor();
	}

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		attempted = true;

		// Le groupe en cours de saisie est intégré automatiquement plutôt que perdu.
		if (groupDirty && !saveGroup()) {
			toast('Terminez ou videz le groupe de critères en cours', 'error');
			groupNameEl?.focus();
			return;
		}
		if (errors.title || errors.company || errors.deadline || criteria.length === 0) {
			const firstInvalid = document.querySelector<HTMLElement>('[aria-invalid="true"]');
			firstInvalid?.focus();
			return;
		}

		const job = createJob({
			title: title.trim(),
			company: company.trim(),
			description: description.trim(),
			deadline: deadline ? new Date(deadline).getTime() : null,
			criteria
		});
		toast('Offre publiée — partagez le lien pour recevoir des CV');
		goto(`/recruiter/job/${job.id}`);
	}

	function weightLabel(w: number) {
		return WEIGHTS.find((x) => x.value === w)?.label ?? '';
	}
</script>

<svelte:head><title>Nouvelle offre · DynaRecrut</title></svelte:head>

<div class="min-h-screen bg-slate-50">
	<AppHeader back={{ href: '/', label: 'Retour au tableau de bord' }} />

	<main id="main" class="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
		<div class="mb-8">
			<h1 class="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Créer une offre</h1>
			<p class="text-slate-500 mt-1">Décrivez le poste et les compétences attendues : chaque CV reçu sera noté automatiquement.</p>
		</div>

		<form class="grid lg:grid-cols-[1fr_300px] gap-6 items-start" novalidate onsubmit={handleSubmit}>
			<div class="space-y-6 min-w-0">
				<!-- Étape 1 -->
				<section class="card-surface p-5 sm:p-6" aria-labelledby="step1">
					<div class="flex items-center gap-3 mb-5">
						<span class="w-7 h-7 rounded-full bg-indigo-600 text-white text-sm font-bold flex items-center justify-center">1</span>
						<h2 id="step1" class="font-semibold text-slate-900">Le poste</h2>
					</div>
					<div class="grid gap-5">
						<div class="grid sm:grid-cols-2 gap-5">
							<div>
								<label for="job-title" class="field-label">Intitulé du poste <span class="text-red-500" aria-hidden="true">*</span></label>
								<input id="job-title" type="text" bind:value={title} placeholder="ex. Développeur Full-Stack" autocomplete="off"
									class="input-field {attempted && errors.title ? 'border-red-400' : ''}"
									aria-invalid={attempted && !!errors.title} aria-describedby={attempted && errors.title ? 'job-title-err' : undefined} required />
								{#if attempted && errors.title}<p id="job-title-err" class="field-error"><Icon name="alert" class="w-3.5 h-3.5" />{errors.title}</p>{/if}
							</div>
							<div>
								<label for="job-company" class="field-label">Entreprise <span class="text-red-500" aria-hidden="true">*</span></label>
								<input id="job-company" type="text" bind:value={company} placeholder="Nom de l’entreprise" autocomplete="organization"
									class="input-field {attempted && errors.company ? 'border-red-400' : ''}"
									aria-invalid={attempted && !!errors.company} aria-describedby={attempted && errors.company ? 'job-company-err' : undefined} required />
								{#if attempted && errors.company}<p id="job-company-err" class="field-error"><Icon name="alert" class="w-3.5 h-3.5" />{errors.company}</p>{/if}
							</div>
						</div>
						<div>
							<div class="flex items-baseline justify-between">
								<label for="job-description" class="field-label">Description</label>
								<span class="text-xs text-slate-400 tabular">{description.length}/2000</span>
							</div>
							<textarea id="job-description" bind:value={description} rows={4} maxlength={2000}
								placeholder="Missions, équipe, contexte… Ce texte est affiché aux candidats."
								class="input-field resize-y min-h-24"></textarea>
						</div>
						<div class="sm:max-w-xs">
							<label for="job-deadline" class="field-label">Date limite de candidature</label>
							<input id="job-deadline" type="datetime-local" bind:value={deadline} min={minDeadline}
								class="input-field {errors.deadline ? 'border-red-400' : ''}" aria-invalid={!!errors.deadline}
								aria-describedby="job-deadline-hint" />
							{#if errors.deadline}
								<p class="field-error"><Icon name="alert" class="w-3.5 h-3.5" />{errors.deadline}</p>
							{:else}
								<p id="job-deadline-hint" class="field-hint">Optionnelle. Le lien sera désactivé après cette date.</p>
							{/if}
						</div>
					</div>
				</section>

				<!-- Étape 2 -->
				<section class="card-surface p-5 sm:p-6 {attempted && errors.criteria ? 'border-red-300' : ''}" aria-labelledby="step2">
					<div class="flex items-start gap-3 mb-5">
						<span class="w-7 h-7 rounded-full bg-indigo-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">2</span>
						<div>
							<h2 id="step2" class="font-semibold text-slate-900">Critères d’analyse</h2>
							<p class="text-sm text-slate-500 mt-0.5">Regroupez les mots-clés à rechercher dans les CV et indiquez l’importance de chaque groupe.</p>
						</div>
					</div>

					{#if criteria.length > 0}
						<ul class="space-y-2 mb-5">
							{#each criteria as group (group.id)}
								{@const share = Math.round((group.weight / totalWeight) * 100)}
								<li class="rounded-xl border p-4 transition-all {editingId === group.id ? 'border-indigo-300 bg-indigo-50/40 ring-4 ring-indigo-500/10' : 'border-slate-200 hover:border-slate-300'}">
									<div class="flex items-start justify-between gap-3">
										<div class="min-w-0">
											<div class="flex flex-wrap items-center gap-2">
												<h3 class="font-medium text-slate-900">{group.name}</h3>
												<span class="chip bg-indigo-50 text-indigo-700">{weightLabel(group.weight)}</span>
												<span class="text-xs text-slate-400">{share} % du score</span>
											</div>
											<div class="flex flex-wrap gap-1.5 mt-2">
												{#each group.keywords as kw}
													<span class="bg-white text-slate-600 px-2 py-0.5 rounded-md text-xs border border-slate-200">{kw.text}</span>
												{/each}
											</div>
										</div>
										<div class="flex gap-1 flex-shrink-0">
											<button type="button" onclick={() => editGroup(group)} class="btn-icon w-8 h-8" aria-label="Modifier le groupe {group.name}" title="Modifier">
												<Icon name="pencil" class="w-4 h-4" />
											</button>
											<button type="button" onclick={() => removeGroup(group.id)} class="btn-icon w-8 h-8 hover:text-red-600 hover:bg-red-50" aria-label="Supprimer le groupe {group.name}" title="Supprimer">
												<Icon name="trash" class="w-4 h-4" />
											</button>
										</div>
									</div>
								</li>
							{/each}
						</ul>
						<!-- Répartition visuelle des poids -->
						<div class="mb-5">
							<p class="text-xs font-medium text-slate-500 mb-1.5">Répartition du score</p>
							<div class="flex h-2 rounded-full overflow-hidden gap-0.5 bg-slate-100">
								{#each criteria as g, i (g.id)}
									<div class="h-full {['bg-indigo-500', 'bg-violet-500', 'bg-sky-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'][i % 6]}" style="width:{(g.weight / totalWeight) * 100}%" title="{g.name} — {Math.round((g.weight / totalWeight) * 100)} %"></div>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Éditeur -->
					<div class="rounded-xl bg-slate-50 border border-slate-200/70 p-4 sm:p-5">
						<div class="flex items-center justify-between mb-4">
							<h3 class="font-medium text-slate-800 text-sm">{editingId ? 'Modifier le groupe' : criteria.length ? 'Ajouter un autre groupe' : 'Premier groupe de critères'}</h3>
							{#if editingId}
								<button type="button" class="text-xs font-medium text-slate-500 hover:text-slate-800" onclick={resetEditor}>Annuler la modification</button>
							{/if}
						</div>

						<div class="space-y-4">
							<div>
								<label for="group-name" class="field-label">Nom du groupe</label>
								<input id="group-name" bind:this={groupNameEl} type="text" bind:value={groupName} placeholder="ex. Langages de programmation"
									class="input-field {groupAttempted && groupErrors.name ? 'border-red-400' : ''}" aria-invalid={groupAttempted && !!groupErrors.name}
									onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); keywordInputEl?.focus(); } }} />
								{#if groupAttempted && groupErrors.name}
									<p class="field-error"><Icon name="alert" class="w-3.5 h-3.5" />{groupErrors.name}</p>
								{:else if !groupName}
									<div class="flex flex-wrap gap-1.5 mt-2" aria-label="Suggestions">
										{#each SUGGESTED_GROUPS.filter((s) => !criteria.some((c) => c.name === s)) as s}
											<button type="button" onclick={() => { groupName = s; keywordInputEl?.focus(); }} class="text-xs px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-700 transition-colors">
												+ {s}
											</button>
										{/each}
									</div>
								{/if}
							</div>

							<div>
								<label for="keyword-input" class="field-label">Mots-clés</label>
								<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
								<div class="flex flex-wrap items-center gap-1.5 min-h-[46px] px-2 py-1.5 bg-white border rounded-xl cursor-text transition-all focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 {groupAttempted && groupErrors.keywords ? 'border-red-400' : 'border-slate-200'}"
									onclick={() => keywordInputEl?.focus()}>
									{#each keywords as kw, i}
										<span class="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 pl-2.5 pr-1 py-1 rounded-lg text-xs font-medium">
											{kw.text}
											<button type="button" onclick={(e) => { e.stopPropagation(); removeKeyword(i); }} aria-label="Retirer {kw.text}" class="p-0.5 rounded hover:bg-indigo-100 hover:text-red-600 transition-colors">
												<Icon name="x" class="w-3 h-3" stroke={2.5} />
											</button>
										</span>
									{/each}
									<input id="keyword-input" bind:this={keywordInputEl} type="text" bind:value={keywordInput}
										placeholder={keywords.length ? 'Ajouter…' : 'ex. React, TypeScript, Node.js'}
										class="flex-1 min-w-32 px-1.5 py-1 text-sm outline-none bg-transparent placeholder-slate-400"
										onkeydown={onKeywordKeydown} onpaste={onKeywordPaste} onblur={commitKeywordInput}
										aria-describedby="keyword-hint" />
								</div>
								{#if groupAttempted && groupErrors.keywords}
									<p class="field-error"><Icon name="alert" class="w-3.5 h-3.5" />{groupErrors.keywords}</p>
								{:else}
									<p id="keyword-hint" class="field-hint">Validez avec <kbd class="kbd">Entrée</kbd> ou une virgule. Vous pouvez coller une liste.</p>
								{/if}
							</div>

							<fieldset>
								<legend class="field-label">Importance dans le score global</legend>
								<div class="grid grid-cols-5 gap-1.5" role="radiogroup" aria-label="Importance du groupe">
									{#each WEIGHTS as w}
										<button type="button" role="radio" aria-checked={groupWeight === w.value} onclick={() => (groupWeight = w.value)}
											class="py-2 px-1 rounded-lg text-center transition-all border {groupWeight === w.value ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-200' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-700'}">
											<span class="block text-sm font-bold">{w.value}</span>
											<span class="block text-[10px] leading-tight mt-0.5 {groupWeight === w.value ? 'text-indigo-100' : 'text-slate-400'} truncate">{w.label}</span>
										</button>
									{/each}
								</div>
							</fieldset>

							<button type="button" onclick={() => saveGroup()} class="btn-secondary w-full border-dashed border-indigo-300 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-400">
								<Icon name={editingId ? 'check' : 'plus'} class="w-4 h-4" stroke={2.5} />
								{editingId ? 'Enregistrer les modifications' : 'Ajouter ce groupe'}
							</button>
						</div>
					</div>

					{#if attempted && errors.criteria}
						<p class="field-error mt-3"><Icon name="alert" class="w-3.5 h-3.5" />{errors.criteria}</p>
					{/if}
				</section>
			</div>

			<!-- Récapitulatif collant -->
			<aside class="lg:sticky lg:top-24 space-y-4">
				<div class="card-surface p-5">
					<h2 class="text-sm font-semibold text-slate-900 mb-3">Avant de publier</h2>
					<ul class="space-y-2.5 mb-5">
						{#each checklist as item}
							<li class="flex items-center gap-2.5 text-sm">
								<span class="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors {item.ok ? 'bg-emerald-500 text-white' : 'border-2 border-slate-200'}">
									{#if item.ok}<Icon name="check" class="w-3 h-3" stroke={3} />{/if}
								</span>
								<span class={item.ok ? 'text-slate-700' : 'text-slate-500'}>{item.label}</span>
							</li>
						{/each}
					</ul>
					{#if criteria.length}
						<p class="text-xs text-slate-500 mb-4">
							{plural(criteria.length, 'groupe')} · {plural(criteria.reduce((s, g) => s + g.keywords.length, 0), 'mot-clé', 'mots-clés')}
						</p>
					{/if}
					<button type="submit" class="btn-primary w-full py-3">
						<Icon name="checkCircle" class="w-5 h-5" />
						Publier l’offre
					</button>
					<p class="text-xs text-slate-400 text-center mt-3">Un lien de candidature unique sera généré.</p>
				</div>
				<div class="rounded-2xl bg-indigo-50/60 border border-indigo-100 p-4 text-sm text-indigo-900 hidden lg:block">
					<p class="font-medium flex items-center gap-1.5 mb-1"><Icon name="sparkles" class="w-4 h-4" />Astuce</p>
					<p class="text-indigo-800/80 text-xs leading-relaxed">La recherche ignore les majuscules et trouve les termes à l’intérieur d’expressions : « React » est aussi détecté dans « React Native ». Préférez des mots-clés courts.</p>
				</div>
			</aside>
		</form>
	</main>
</div>
