export interface CriterionKeyword {
	text: string;
	weight: number;
}

export interface CriterionGroup {
	id: string;
	name: string;
	keywords: CriterionKeyword[];
	weight: number;
}

export interface JobPost {
	id: string;
	title: string;
	description: string;
	company: string;
	slug: string;
	criteria: CriterionGroup[];
	deadline: number | null;
	createdAt: number;
}

export interface MatchResult {
	groupId: string;
	groupName: string;
	foundKeywords: string[];
	missingKeywords: string[];
	totalKeywords: number;
	foundCount: number;
	matchPercentage: number;
}

export interface CandidateApplication {
	id: string;
	jobId: string;
	candidateName: string;
	email: string;
	cvText: string;
	cvFileName: string;
	cvFileData: string;
	cvFileType: string;
	matchResults: MatchResult[];
	overallMatch: number;
	appliedAt: number;
}