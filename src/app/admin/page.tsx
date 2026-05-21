import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";

export default async function AdminPage({
                                            searchParams,
                                        }: {
    searchParams: Promise<{ secret?: string }>;
}) {
    const { secret } = await searchParams;

    if (secret !== process.env.REAUDIT_SECRET) {
        notFound();
    }

    const [
        { count: totalAudits },
        { count: auditsWithEmail },
        { count: reauditedAudits },
        { count: staleAudits },
    ] = await Promise.all([
        supabase.from("audits").select("*", { count: "exact", head: true }),
        supabase.from("audits").select("*", { count: "exact", head: true }).not("email", "is", null),
        supabase.from("audits").select("*", { count: "exact", head: true }).not("last_reaudited_at", "is", null),
        supabase.from("audits").select("*", { count: "exact", head: true }).eq("is_stale", true),
    ]);

    const clickThroughPct =
        reauditedAudits && auditsWithEmail && auditsWithEmail > 0
            ? Math.round((reauditedAudits / auditsWithEmail) * 100)
            : 0;

    const stats = [
        { label: "Total audits", value: totalAudits ?? 0 },
        { label: "Audits with email", value: auditsWithEmail ?? 0 },
        { label: "Emails sent (re-audits)", value: reauditedAudits ?? 0 },
        { label: "Currently stale", value: staleAudits ?? 0 },
        { label: "% click-through (approx)", value: `${clickThroughPct}%` },
    ];

    return (
        <main className="max-w-2xl mx-auto py-12 px-4">
            <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground text-sm mb-8">SpendScope — Re-audit system overview</p>

            <div className="grid grid-cols-2 gap-4">
                {stats.map((s) => (
                    <div key={s.label} className="rounded-lg border border-border/50 bg-card/50 p-5">
                        <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                        <p className="text-3xl font-bold font-mono">{s.value}</p>
                    </div>
                ))}
            </div>

            <p className="text-xs text-muted-foreground/40 mt-8">
                Access this page at <code>/admin?secret=YOUR_SECRET</code>
            </p>
        </main>
    );
}