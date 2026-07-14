
let pdfjsLib: any = null;
let workerInitPromise: Promise<void> | null = null;

async function initWorker() {
	if (workerInitPromise) return workerInitPromise;

	workerInitPromise = (async () => {
		const mod = await import('pdfjs-dist');
		pdfjsLib = mod;

		if (typeof window !== 'undefined') {
			try {
				const worker = await import('pdfjs-dist/build/pdf.worker.mjs?worker');
				pdfjsLib.GlobalWorkerOptions.workerPort = new worker.default();
			} catch {
				try {
					const workerUrl = new URL(
						'pdfjs-dist/build/pdf.worker.mjs',
						import.meta.url
					);
					pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl.toString();
				} catch {
					pdfjsLib.GlobalWorkerOptions.workerSrc =
						`https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
				}
			}
		}
	})();

	await workerInitPromise;
}

export async function extractTextFromPDF(file: File): Promise<string> {
	try {
		await initWorker();

		const arrayBuffer = await file.arrayBuffer();
		const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
		let fullText = '';

		for (let i = 1; i <= pdf.numPages; i++) {
			const page = await pdf.getPage(i);
			const content = await page.getTextContent();
			const pageText = content.items
				.map((item: any) => ('str' in item ? item.str : ''))
				.filter((s: string) => s)
				.join(' ');
			fullText += pageText + '\n';
		}

		return fullText.trim();
	} catch (error) {
		console.error('Error extracting PDF text:', error);
		return '';
	}
}

export function extractTextFromFile(file: File): Promise<string> {
	if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
		return extractTextFromPDF(file);
	}
	return file.text();
}