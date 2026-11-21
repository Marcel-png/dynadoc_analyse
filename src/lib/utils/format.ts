export function plural(n: number, singular: string, pluralForm = singular + 's'): string {
	return `${n} ${n > 1 ? pluralForm : singular}`;
}

export function formatDate(ts: number, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }): string {
	return new Date(ts).toLocaleDateString('fr-FR', opts);
}

export function formatDateTime(ts: number): string {
	return new Date(ts).toLocaleString('fr-FR', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
}

const rtf = new Intl.RelativeTimeFormat('fr-FR', { numeric: 'auto' });

/** « il y a 3 heures », « dans 2 jours »… */
export function relativeTime(ts: number, now = Date.now()): string {
	const diff = ts - now;
	const abs = Math.abs(diff);
	const min = 60_000;
	const hour = 60 * min;
	const day = 24 * hour;
	if (abs < min) return 'à l’instant';
	if (abs < hour) return rtf.format(Math.round(diff / min), 'minute');
	if (abs < day) return rtf.format(Math.round(diff / hour), 'hour');
	if (abs < 30 * day) return rtf.format(Math.round(diff / day), 'day');
	return formatDate(ts);
}

export type DeadlineState = { kind: 'none' } | { kind: 'expired' } | { kind: 'soon' | 'open'; label: string };

export function deadlineState(deadline: number | null, now = Date.now()): DeadlineState {
	if (!deadline) return { kind: 'none' };
	if (now > deadline) return { kind: 'expired' };
	const soon = deadline - now < 3 * 24 * 3600_000;
	return { kind: soon ? 'soon' : 'open', label: relativeTime(deadline, now) };
}

export function initials(name: string): string {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return '?';
	return ((parts[0][0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

export function formatSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} o`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
	return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch {
		const ta = document.createElement('textarea');
		ta.value = text;
		ta.style.position = 'fixed';
		ta.style.opacity = '0';
		document.body.appendChild(ta);
		ta.select();
		const ok = document.execCommand('copy');
		ta.remove();
		return ok;
	}
}
