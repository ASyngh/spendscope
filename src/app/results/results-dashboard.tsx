"use client";

import { AuditResult, Recommendation, RecommendationType } from "@/types/audit";
import { useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// TYPE CONFIG
// Maps each RecommendationType to visual treatment
// ─────────────────────────────────────────────────────────────────────────────

type TypeConfig = {
    label: string;
    color: string;           // Tailwind text color
    bg: string;              // badge bg
    border: string;          // card left border
    dot: string;             // dot fill
    filterBg: string;        // active filter pill
};

const TYPE_CONFIG: Record<RecommendationType, TypeConfig> = {
    cut: {
        label: "Cut",
        color: "text-red-400",
        bg: "bg-red-500/10 text-red-400 border border-red-500/20",
        border: "border-l-red-500",
        dot: "bg-red-500",
        filterBg: "bg-red-500/20 text-red-300 border-red-500/30",
    },
    downgrade: {
        label: "Downgrade",
        color: "text-orange-400",
        bg: "bg-orange-500/10 text-orange-400 border border-orange-500/20",
        border: "border-l-orange-500",
        dot: "bg-orange-500",
        filterBg: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    },
    negotiate: {
        label: "Negotiate",
        color: "text-yellow-400",
        bg: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
        border: "border-l-yellow-500",
        dot: "bg-yellow-500",
        filterBg: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    },
    consolidate: {
        label: "Consolidate",
        color: "text-blue-400",
        bg: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
        border: "border-l-blue-500",
        dot: "bg-blue-500",
        filterBg: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    },
    upgrade: {
        label: "Opportunity",
        color: "text-emerald-400",
        bg: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
        border: "border-l-emerald-500",
        dot: "bg-emerald-500",
        filterBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    },
    audit: {
        label: "Audit",
        color: "text-zinc-400",
        bg: "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20",
        border: "border-l-zinc-500",
        dot: "bg-zinc-500",
        filterBg: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
    },
};

const SEVERITY_CONFIG = {
    high: {
        label: "High",
        dot: "bg-red-500",
        text: "text-red-400",
        ring: "ring-red-500/30",
    },
    medium: {
        label: "Medium",
        dot: "bg-yellow-500",
        text: "text-yellow-400",
        ring: "ring-yellow-500/30",
    },
    low: {
        label: "Low",
        dot: "bg-zinc-500",
        text: "text-zinc-400",
        ring: "ring-zinc-500/30",
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function ConfidenceBar({ confidence }: { confidence: number }) {
    const pct = Math.round((confidence ?? 0) * 100);
    const color =
        pct >= 85 ? "bg-emerald-500" : pct >= 65 ? "bg-yellow-500" : "bg-zinc-500";

    return (
        <div className="flex items-center gap-2">
            <div className="h-1 w-16 rounded-full bg-white/5 overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-700 ${color}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span className="text-[10px] font-mono text-zinc-500">{pct}%</span>
        </div>
    );
}

function SavingsPill({ amount }: { amount: number }) {
    if (amount === 0) return null;
    return (
        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs font-mono font-semibold text-emerald-400">
            −${amount.toLocaleString()}/mo
        </span>
    );
}

function RecommendationCard({
                                rec,
                                index,
                            }: {
    rec: Recommendation;
    index: number;
}) {
    const [expanded, setExpanded] = useState(false);
    const typeConf = TYPE_CONFIG[rec.type] ?? TYPE_CONFIG.audit;
    const sevConf = SEVERITY_CONFIG[rec.severity] ?? SEVERITY_CONFIG.low;
    const isUpgrade = rec.estimatedSavings === 0;

    return (
        <div
            className={`
                group relative rounded-xl border border-white/[0.06] bg-white/[0.03]
                border-l-2 ${typeConf.border}
                transition-all duration-200
                hover:bg-white/[0.055] hover:border-white/[0.10]
                animate-in fade-in slide-in-from-bottom-2
            `}
            style={{ animationDelay: `${index * 60}ms`, animationFillMode: "both" }}
        >
            {/* Card header */}
            <button
                onClick={() => setExpanded((p) => !p)}
                className="w-full text-left px-5 py-4"
            >
                <div className="flex items-start justify-between gap-4">
                    {/* Left: type badge + tool name + issue */}
                    <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Type badge */}
                            <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase ${typeConf.bg}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${typeConf.dot}`} />
                                {typeConf.label}
                            </span>

                            {/* Severity */}
                            <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${sevConf.text}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${sevConf.dot}`} />
                                {sevConf.label} priority
                            </span>

                            {/* Tool name */}
                            <span className="text-[11px] font-mono text-zinc-500">
                                {rec.tool}
                            </span>
                        </div>

                        {/* Issue */}
                        <p className="text-sm font-medium text-zinc-200 leading-snug pr-2">
                            {rec.issue}
                        </p>
                    </div>

                    {/* Right: savings + chevron */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                        {isUpgrade ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
                                Opportunity
                            </span>
                        ) : (
                            <SavingsPill amount={rec.estimatedSavings} />
                        )}

                        {/* Chevron */}
                        <span
                            className={`text-zinc-600 transition-transform duration-200 text-xs ${expanded ? "rotate-180" : ""}`}
                        >
                            ▾
                        </span>
                    </div>
                </div>
            </button>

            {/* Expanded suggestion */}
            {expanded && (
                <div className="px-5 pb-5 pt-0 border-t border-white/[0.05]">
                    <div className="pt-4 space-y-3">
                        <p className="text-sm text-zinc-400 leading-relaxed">
                            {rec.suggestion}
                        </p>

                        <div className="flex items-center gap-4 pt-1">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[11px] text-zinc-600 uppercase tracking-wide">
                                    Confidence
                                </span>
                                <ConfidenceBar confidence={rec.confidence ?? 0} />
                            </div>

                            {!isUpgrade && rec.estimatedSavings > 0 && (
                                <div className="flex items-center gap-1.5 text-[11px] text-zinc-600 uppercase tracking-wide">
                                    Yearly:
                                    <span className="font-mono text-emerald-500 font-semibold normal-case">
                                        ${(rec.estimatedSavings * 12).toLocaleString()}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function SummaryCard({
                         label,
                         value,
                         sub,
                         accent,
                     }: {
    label: string;
    value: string;
    sub?: string;
    accent: string;
}) {
    return (
        <div className="relative rounded-xl border border-white/[0.06] bg-white/[0.03] p-5 overflow-hidden">
            {/* Subtle glow */}
            <div className={`absolute -top-6 -right-6 h-20 w-20 rounded-full blur-2xl opacity-20 ${accent}`} />
            <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-500 mb-2">
                {label}
            </p>
            <p className={`text-2xl font-bold font-mono ${accent.replace("bg-", "text-")}`}>
                {value}
            </p>
            {sub && (
                <p className="text-xs text-zinc-600 mt-1 font-mono">{sub}</p>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// FILTER BAR
// ─────────────────────────────────────────────────────────────────────────────

type FilterKey = RecommendationType | "all" | "waste" | "opportunities";

const FILTER_LABELS: Record<FilterKey, string> = {
    all: "All",
    waste: "Waste",
    opportunities: "Opportunities",
    cut: "Cut",
    downgrade: "Downgrade",
    negotiate: "Negotiate",
    consolidate: "Consolidate",
    upgrade: "Opportunities",
    audit: "Audit",
};

function filterRecs(
    recs: Recommendation[],
    active: FilterKey
): Recommendation[] {
    if (active === "all") return recs;
    if (active === "waste") return recs.filter((r) => r.estimatedSavings > 0);
    if (active === "opportunities") return recs.filter((r) => r.estimatedSavings === 0);
    return recs.filter((r) => r.type === active);
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

interface ResultsDashboardProps {
    result: AuditResult;
    onReset?: () => void;
}

export function ResultsDashboard({ result, onReset }: ResultsDashboardProps) {
    const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

    const { recommendations, totalMonthlySpend, potentialMonthlySavings, potentialYearlySavings } =
        result;

    const wasteRecs = recommendations.filter((r) => r.estimatedSavings > 0);
    const opportunityRecs = recommendations.filter((r) => r.estimatedSavings === 0);
    const highCount = recommendations.filter((r) => r.severity === "high").length;

    // Build filter pills — only show types that exist
    const presentTypes = Array.from(
        new Set(recommendations.map((r) => r.type))
    ) as RecommendationType[];

    const filters: FilterKey[] = [
        "all",
        ...(wasteRecs.length > 0 ? (["waste"] as FilterKey[]) : []),
        ...(opportunityRecs.length > 0 ? (["opportunities"] as FilterKey[]) : []),
        ...presentTypes,
    ];

    const filtered = filterRecs(recommendations, activeFilter);

    const savingsPct =
        totalMonthlySpend > 0
            ? Math.round((potentialMonthlySavings / totalMonthlySpend) * 100)
            : 0;

    return (
        <div className="min-h-screen bg-[#0a0a0b] text-white font-sans">
            {/* Subtle grid texture */}
            <div
                className="fixed inset-0 pointer-events-none opacity-[0.03]"
                style={{
                    backgroundImage:
                        "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
                    backgroundSize: "40px 40px",
                }}
            />

            <div className="relative max-w-3xl mx-auto px-4 py-12 space-y-8">

                {/* ── Header ─────────────────────────────────────────────── */}
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-600">
                                SpendScope
                            </span>
                            <span className="text-zinc-700">·</span>
                            <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-600">
                                Audit Results
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">
                            {recommendations.length === 0
                                ? "Your stack looks lean"
                                : `${recommendations.length} finding${recommendations.length > 1 ? "s" : ""} across your AI stack`}
                        </h1>
                        {highCount > 0 && (
                            <p className="text-sm text-zinc-500 mt-1">
                                <span className="text-red-400 font-medium">{highCount} high-priority</span>{" "}
                                {highCount === 1 ? "issue" : "issues"} to address first
                            </p>
                        )}
                    </div>

                    {onReset && (
                        <button
                            onClick={onReset}
                            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors border border-white/[0.06] rounded-lg px-3 py-1.5 hover:border-white/10"
                        >
                            ← New audit
                        </button>
                    )}
                </div>

                {/* ── Summary cards ──────────────────────────────────────── */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <SummaryCard
                        label="Monthly Spend"
                        value={`$${totalMonthlySpend.toLocaleString()}`}
                        accent="bg-zinc-400"
                    />
                    <SummaryCard
                        label="Potential Savings"
                        value={`$${potentialMonthlySavings.toLocaleString()}`}
                        sub="per month"
                        accent="bg-emerald-500"
                    />
                    <SummaryCard
                        label="Yearly Savings"
                        value={`$${potentialYearlySavings.toLocaleString()}`}
                        sub="annualised"
                        accent="bg-emerald-400"
                    />
                    <SummaryCard
                        label="Waste %"
                        value={`${savingsPct}%`}
                        sub="of total AI spend"
                        accent={savingsPct >= 25 ? "bg-red-500" : savingsPct >= 10 ? "bg-yellow-500" : "bg-zinc-500"}
                    />
                </div>

                {/* ── Zero state ─────────────────────────────────────────── */}
                {recommendations.length === 0 && (
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-12 text-center">
                        <div className="text-4xl mb-4">✓</div>
                        <p className="text-zinc-300 font-medium">No issues found</p>
                        <p className="text-sm text-zinc-600 mt-1">
                            Your AI stack looks well-optimised for its current size.
                        </p>
                    </div>
                )}

                {/* ── Filters ────────────────────────────────────────────── */}
                {recommendations.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                            {filters.map((f) => {
                                const isActive = activeFilter === f;
                                const typeConf =
                                    f !== "all" && f !== "waste" && f !== "opportunities"
                                        ? TYPE_CONFIG[f as RecommendationType]
                                        : null;

                                const count =
                                    f === "all"
                                        ? recommendations.length
                                        : filterRecs(recommendations, f).length;

                                return (
                                    <button
                                        key={f}
                                        onClick={() => setActiveFilter(f)}
                                        className={`
                                            inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-150
                                            ${isActive
                                            ? typeConf
                                                ? typeConf.filterBg + " border-transparent"
                                                : "bg-white/10 text-white border-white/20"
                                            : "bg-white/[0.03] text-zinc-500 border-white/[0.06] hover:text-zinc-300 hover:border-white/10"
                                        }
                                        `}
                                    >
                                        {typeConf && (
                                            <span className={`h-1.5 w-1.5 rounded-full ${typeConf.dot}`} />
                                        )}
                                        {FILTER_LABELS[f]}
                                        <span className={`font-mono text-[10px] ${isActive ? "opacity-70" : "opacity-40"}`}>
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* ── Waste section ──────────────────────────────── */}
                        {filtered.some((r) => r.estimatedSavings > 0) && (
                            <div className="space-y-2">
                                {activeFilter === "all" && (
                                    <div className="flex items-center gap-3 py-1">
                                        <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-600">
                                            Waste · {wasteRecs.length} finding{wasteRecs.length !== 1 ? "s" : ""}
                                        </span>
                                        <div className="flex-1 h-px bg-white/[0.05]" />
                                        <span className="text-[11px] font-mono text-emerald-600">
                                            −${potentialMonthlySavings.toLocaleString()}/mo
                                        </span>
                                    </div>
                                )}
                                {filtered
                                    .filter((r) => r.estimatedSavings > 0)
                                    .map((rec, i) => (
                                        <RecommendationCard key={`${rec.tool}-${rec.issue}`} rec={rec} index={i} />
                                    ))}
                            </div>
                        )}

                        {/* ── Opportunities section ──────────────────────── */}
                        {filtered.some((r) => r.estimatedSavings === 0) && (
                            <div className="space-y-2">
                                {activeFilter === "all" && (
                                    <div className="flex items-center gap-3 py-1">
                                        <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-600">
                                            Opportunities · {opportunityRecs.length}
                                        </span>
                                        <div className="flex-1 h-px bg-white/[0.05]" />
                                    </div>
                                )}
                                {filtered
                                    .filter((r) => r.estimatedSavings === 0)
                                    .map((rec, i) => (
                                        <RecommendationCard key={`${rec.tool}-${rec.issue}`} rec={rec} index={wasteRecs.length + i} />
                                    ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Footer note ────────────────────────────────────────── */}
                {recommendations.length > 0 && (
                    <p className="text-[11px] text-zinc-700 text-center pb-4">
                        Savings estimates are indicative. Verify current pricing with each vendor before acting.
                    </p>
                )}
            </div>
        </div>
    );
}
