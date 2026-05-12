import { Recommendation } from "@/types/audit";
import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";

interface AuditPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function SharedAuditPage({
                                                  params,
                                              }: AuditPageProps) {

    const { id } = await params;

    const { data, error } = await supabase
        .from("audits")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !data) {
        notFound();
    }

    return (
        <main className="min-h-screen bg-background text-foreground">
            <div className="max-w-5xl mx-auto px-6 py-12 space-y-8">

                <div className="space-y-2">
                    <h1 className="text-4xl font-bold tracking-tight">
                        Shared Audit Report
                    </h1>

                    <p className="text-muted-foreground">
                        AI spend optimisation snapshot
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    <div className="rounded-xl border border-border p-5">
                        <p className="text-sm text-muted-foreground mb-2">
                            Monthly Spend
                        </p>

                        <p className="text-3xl font-bold font-mono">
                            ${Number(data.total_monthly_spend).toLocaleString()}
                        </p>
                    </div>

                    <div className="rounded-xl border border-border p-5">
                        <p className="text-sm text-muted-foreground mb-2">
                            Monthly Savings
                        </p>

                        <p className="text-3xl font-bold font-mono text-emerald-400">
                            ${Number(data.potential_monthly_savings).toLocaleString()}
                        </p>
                    </div>

                    <div className="rounded-xl border border-border p-5">
                        <p className="text-sm text-muted-foreground mb-2">
                            Yearly Savings
                        </p>

                        <p className="text-3xl font-bold font-mono text-emerald-400">
                            ${Number(data.potential_yearly_savings).toLocaleString()}
                        </p>
                    </div>
                </div>

                <div className="rounded-xl border border-border p-6 space-y-4">
                    <h2 className="text-xl font-semibold">
                        Recommendations
                    </h2>

                    <div className="space-y-3">
                        {data.recommendations.map((rec:Recommendation , index: number) => (
                            <div
                                key={index}
                                className="rounded-lg border border-border p-4"
                            >
                                <div className="flex items-center justify-between gap-4 mb-2">
                                    <div>
                                        <p className="font-semibold">
                                            {rec.tool}
                                        </p>

                                        <p className="text-sm text-muted-foreground">
                                            {rec.issue}
                                        </p>
                                    </div>

                                    <p className="font-mono text-emerald-400">
                                        ${rec.estimatedSavings}/mo
                                    </p>
                                </div>

                                <p className="text-sm text-muted-foreground">
                                    {rec.suggestion}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </main>
    );
}