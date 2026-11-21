import { defineConfig, presetWind3, presetAttributify } from 'unocss';

export default defineConfig({
	presets: [presetWind3(), presetAttributify()],
	// Classes de score définies dans src/lib/utils/score.ts (les .ts ne sont pas scannés).
	safelist: ['emerald', 'sky', 'amber', 'rose'].flatMap((c) => [
		`text-${c}-600`,
		`text-${c}-700`,
		`bg-${c}-50`,
		`bg-${c}-500`,
		`bg-${c}-400`,
		`stroke-${c}-500`,
		`stroke-${c}-400`,
		`ring-1`,
		`ring-inset`,
		`ring-${c}-600/15`,
		`ring-${c}-600/20`
	]),
	theme: {
		colors: {
			brand: {
				50: '#eef2ff',
				100: '#e0e7ff',
				200: '#c7d2fe',
				500: '#6366f1',
				600: '#4f46e5',
				700: '#4338ca'
			}
		}
	},
	shortcuts: {
		// Boutons
		'btn': 'inline-flex items-center justify-center gap-2 rounded-xl font-medium text-sm px-4 py-2.5 transition-all duration-150 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
		'btn-primary': 'btn bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-200 hover:from-indigo-700 hover:to-violet-700 hover:shadow-md active:scale-[0.98]',
		'btn-secondary': 'btn bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98]',
		'btn-ghost': 'btn text-slate-500 hover:text-slate-900 hover:bg-slate-100',
		'btn-danger': 'btn bg-red-600 text-white hover:bg-red-700 shadow-sm active:scale-[0.98]',
		'btn-icon': 'inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',

		// Champs
		'field-label': 'block text-sm font-medium text-slate-700 mb-1.5',
		'field-hint': 'text-xs text-slate-500 mt-1.5',
		'field-error': 'text-xs text-red-600 mt-1.5 flex items-center gap-1',
		'input-field': 'w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10',

		// Surfaces
		'card-surface': 'bg-white rounded-2xl border border-slate-200/70 shadow-[0_1px_2px_rgba(15,23,42,0.04)]',
		'chip': 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap',
		'kbd': 'px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 text-[10px] font-mono text-slate-500'
	}
});
