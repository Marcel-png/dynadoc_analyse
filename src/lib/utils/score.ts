export interface ScoreTone {
	label: string;
	text: string;
	bar: string;
	ring: string;
	soft: string;
}

// Classes écrites en toutes lettres pour que UnoCSS les détecte.
const TONES: { min: number; tone: ScoreTone }[] = [
	{ min: 80, tone: { label: 'Excellent', text: 'text-emerald-600', bar: 'bg-emerald-500', ring: 'stroke-emerald-500', soft: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/15' } },
	{ min: 60, tone: { label: 'Bon', text: 'text-sky-600', bar: 'bg-sky-500', ring: 'stroke-sky-500', soft: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/15' } },
	{ min: 40, tone: { label: 'Moyen', text: 'text-amber-600', bar: 'bg-amber-500', ring: 'stroke-amber-500', soft: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20' } },
	{ min: 0, tone: { label: 'Faible', text: 'text-rose-600', bar: 'bg-rose-400', ring: 'stroke-rose-400', soft: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/15' } }
];

export function scoreTone(pct: number): ScoreTone {
	return (TONES.find((t) => pct >= t.min) ?? TONES[TONES.length - 1]).tone;
}
