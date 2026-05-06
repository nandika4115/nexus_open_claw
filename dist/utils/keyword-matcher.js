export function scoreKeywordMatch({ haystack, keywords }) {
    const normalized = haystack.toLowerCase();
    let score = 0;
    for (const keyword of keywords) {
        if (normalized.includes(keyword.toLowerCase())) {
            score += 1;
        }
    }
    return score;
}
export function matchBestThread(candidates, haystack) {
    let best = null;
    for (const candidate of candidates) {
        const score = scoreKeywordMatch({ haystack, keywords: candidate.keywords });
        if (score === 0) {
            continue;
        }
        if (!best || score > best.score) {
            best = { slug: candidate.slug, score };
        }
    }
    return best;
}
