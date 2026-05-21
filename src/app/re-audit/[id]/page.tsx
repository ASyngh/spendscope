import { supabase } from "@/lib/supabase";
import { diffAuditResults } from "@/lib/diff";
import type { StoredAudit, Recommendation } from "@/types/audit";
import { notFound } from "next/navigation";

export default async function ReAuditPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { data, error } = await supabase
        .from("audits")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !data) notFound();

    const audit = data as StoredAudit;

    if (!audit.is_stale || !audit.previous_recommendations) {
        return (
            <main className="max-w-2xl mx-auto py-16 px-4 text-center">
                <h1 className="text-2xl font-bold mb-4">No diff available</h1>
                <p className="text-muted-foreground">This audit hasn't been re-run yet, or nothing changed.</p>
            </main>
        );
    }

    const prevResult = {
        totalMonthlySpend: audit.total_monthly_spend,
        potentialMonthlySavings: audit.previous_savings ?? 0,
        potentialYearlySavings: (audit.previous_savings ?? 0) * 12,
        recommendations: audit.previous_recommendations,
    };
    const newResult = {
        totalMonthlySpend: audit.total_monthly_spend,
        potentialMonthlySavings: audit.potential_monthly_savings,
        potentialYearlySavings: audit.potential_monthly_savings * 12,
        recommendations: audit.recommendations,
    };

    const diff = diffAuditResults(prevResult, newResult);

    return (
        <main className="max-w-3xl mx-auto py-12 px-4">
            <h1 className="text-3xl font-bold mb-2">Re-Audit Results</h1>
            <p className="text-muted-foreground mb-8">
                Pricing changed since your original audit. Here's what's different.
            </p>

            {/* Savings delta */}
            <div className="rounded-lg border p-6 mb-8 flex gap-8">
                <div>
                    <p className="text-sm text-muted-foreground">Previous savings</p>
                    <p className="text-2xl font-bold">${diff.prevSavings.toFixed(0)}/mo</p>
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">Updated savings</p>
                    <p className="text-2xl font-bold">${diff.newSavings.toFixed(0)}/mo</p>
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">Delta</p>
                    <p className={`text-2xl font-bold ${diff.savingsDelta >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {diff.savingsDelta >= 0 ? "+" : ""}${diff.savingsDelta.toFixed(0)}/mo
                    </p>
                </div>
            </div>

            {/* New recommendations */}
            {diff.addedRecs.length > 0 && (
                <section className="mb-8">
                    <h2 className="text-lg font-semibold mb-3 text-green-700">New recommendations</h2>
                    {diff.addedRecs.map((rec, i) => (
                        <RecCard key={i} rec={rec} variant="added" />
                    ))}
                </section>
            )}

            {/* Resolved recommendations */}
            {diff.removedRecs.length > 0 && (
                <section className="mb-8">
                    <h2 className="text-lg font-semibold mb-3 text-muted-foreground">No longer applicable</h2>
                    {diff.removedRecs.map((rec, i) => (
                        <RecCard key={i} rec={rec} variant="removed" />
                    ))}
                </section>
            )}

            {/* Unchanged */}
            {diff.unchangedRecs.length > 0 && (
                <section className="mb-8">
                    <h2 className="text-lg font-semibold mb-3">Unchanged recommendations</h2>
                    {diff.unchangedRecs.map((rec, i) => (
                        <RecCard key={i} rec={rec} variant="unchanged" />
                    ))}
                </section>
            )}
        </main>
    );
}

function RecCard({ rec, variant }: { rec: Recommendation; variant: "added" | "removed" | "unchanged" }) {
    const border = variant === "added"
        ? "border-l-4 border-green-500 bg-green-50"
        : variant === "removed"
            ? "border-l-4 border-gray-300 bg-gray-50 opacity-60"
            : "border-l-4 border-blue-200";

    return (
        <div className={`rounded-lg border p-4 mb-3 ${border}`}>
            <div className="flex justify-between items-start mb-1">
                <p className="font-medium">{rec.tool}</p>
                {rec.estimatedSavings > 0 && (
                    <span className="text-sm font-mono">${rec.estimatedSavings}/mo</span>
                )}
            </div>
            <p className="text-sm text-muted-foreground mb-1">{rec.issue}</p>
            <p className="text-sm">{rec.suggestion}</p>
        </div>
    );
}