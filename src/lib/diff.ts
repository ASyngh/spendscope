import type { AuditResult, AuditDiff, Recommendation } from "@/types/audit";

export function diffAuditResults(prev: AuditResult, next: AuditResult): AuditDiff {
    const prevKeys = new Set(prev.recommendations.map((r) => r.tool + r.type));
    const nextKeys = new Set(next.recommendations.map((r) => r.tool + r.type));

    const addedRecs = next.recommendations.filter(
        (r) => !prevKeys.has(r.tool + r.type)
    );
    const removedRecs = prev.recommendations.filter(
        (r) => !nextKeys.has(r.tool + r.type)
    );
    const unchangedRecs = next.recommendations.filter(
        (r) => prevKeys.has(r.tool + r.type)
    );

    const prevSavings = prev.potentialMonthlySavings;
    const newSavings = next.potentialMonthlySavings;
    const savingsDelta = newSavings - prevSavings;

    const changed =
        addedRecs.length > 0 ||
        removedRecs.length > 0 ||
        Math.abs(savingsDelta) >= 5; // ignore rounding noise under $5

    return { changed, prevSavings, newSavings, savingsDelta, addedRecs, removedRecs, unchangedRecs };
}