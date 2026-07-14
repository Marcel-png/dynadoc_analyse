import { browser } from '$app/environment';
import type { JobPost, CandidateApplication } from '$lib/types';

const JOBS_KEY = 'dyna_jobs';
const APPS_KEY = 'dyna_apps';

function loadFromStorage<T>(key: string, fallback: T): T {
	if (!browser) return fallback;
	try {
		const data = localStorage.getItem(key);
		return data ? JSON.parse(data) : fallback;
	} catch {
		return fallback;
	}
}

function saveToStorage<T>(key: string, data: T): void {
	if (!browser) return;
	try {
		localStorage.setItem(key, JSON.stringify(data));
	} catch {
		console.error('Failed to save to localStorage');
	}
}

function generateSlug(title: string): string {
	return title
		.toLowerCase()
		.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '')
		+ '-' + Math.random().toString(36).substring(2, 8);
}

function generateId(): string {
	return crypto.randomUUID ? crypto.randomUUID() : 
		Date.now().toString(36) + Math.random().toString(36).substring(2);
}


export function getJobs(): JobPost[] {
	return loadFromStorage<JobPost[]>(JOBS_KEY, []);
}

export function getJob(id: string): JobPost | undefined {
	return getJobs().find(j => j.id === id);
}

export function getJobBySlug(slug: string): JobPost | undefined {
	return getJobs().find(j => j.slug === slug);
}

export function createJob(job: Omit<JobPost, 'id' | 'slug' | 'createdAt'>): JobPost {
	const jobs = getJobs();
	const newJob: JobPost = {
		...job,
		deadline: job.deadline ?? null,
		id: generateId(),
		slug: generateSlug(job.title),
		createdAt: Date.now(),
	};
	jobs.push(newJob);
	saveToStorage(JOBS_KEY, jobs);
	return newJob;
}

export function deleteJob(id: string): void {
	const jobs = getJobs().filter(j => j.id !== id);
	saveToStorage(JOBS_KEY, jobs);
	const apps = getApplications().filter(a => a.jobId !== id);
	saveToStorage(APPS_KEY, apps);
}


export function getApplications(jobId?: string): CandidateApplication[] {
	const all = loadFromStorage<CandidateApplication[]>(APPS_KEY, []);
	return jobId ? all.filter(a => a.jobId === jobId) : all;
}

export function addApplication(app: CandidateApplication): void {
	const apps = getApplications();
	apps.push(app);
	saveToStorage(APPS_KEY, apps);
}