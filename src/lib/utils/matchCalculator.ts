import type { CriterionGroup, MatchResult } from '$lib/types';


export function calculateMatch(cvText: string, criteria: CriterionGroup[]): MatchResult[] {
	const cvLower = cvText.toLowerCase();

	return criteria.map(group => {
		const foundKeywords: string[] = [];
		const missingKeywords: string[] = [];

		for (const keyword of group.keywords) {
			const keywordLower = keyword.text.toLowerCase().trim();
			if (cvLower.includes(keywordLower)) {
				foundKeywords.push(keyword.text);
			} else {
				missingKeywords.push(keyword.text);
			}
		}

		const totalKeywords = group.keywords.length;
		const foundCount = foundKeywords.length;
		const matchPercentage = totalKeywords > 0
			? Math.round((foundCount / totalKeywords) * 100)
			: 0;

		return {
			groupId: group.id,
			groupName: group.name,
			foundKeywords,
			missingKeywords,
			totalKeywords,
			foundCount,
			matchPercentage,
		};
	});
}


export function calculateOverallMatch(cvText: string, criteria: CriterionGroup[]): number {
	if (criteria.length === 0) return 0;

	let totalWeight = 0;
	let weightedSum = 0;

	for (const group of criteria) {
		const match = calculateMatch(cvText, [group])[0];
		weightedSum += match.matchPercentage * group.weight;
		totalWeight += group.weight;
	}

	return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
}