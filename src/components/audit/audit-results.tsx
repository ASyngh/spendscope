"use client";

import { useState } from "react";
import { AuditResult, AuditTool, Recommendation, RecommendationType } from "@/types/audit";
import { FullAuditResult } from "@/lib/run-audit";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import {
    ArrowLeft, CheckCircle2, TrendingDown, ChevronDown,
    Sparkles, Bell, ExternalLink, Zap,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// TOOL ICONS
// ─────────────────────────────────────────────────────────────────────────────

const TOOL_ICON: Record<string, string> = {
    ChatGPT: "🤖", Claude: "🟣", Gemini: "✨", Cursor: "⚡",
    "GitHub Copilot": "🐙", Midjourney: "🎨", "Notion AI": "📝",
    Jasper: "✍️", Grammarly: "📖", Perplexity: "🔍",
    Tabnine: "💻", Codeium: "💻", Windsurf: "🏄",
    "Adobe Firefly": "🔥", "Overall AI Stack": "📊",
};

function toolIcon(name: string): string {
    for (const [key, icon] of Object.entries(TOOL_ICON)) {
        if (name.toLowerCase().includes(key.toLowerCase())) return icon;
    }
    return "🔧";
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPE CONFIG
// ─────────────────────────────────────────────────────────────────────────────

type TypeConfig = {
    label: string;
    borderColor: string;
    badgeClass: string;
    dotClass: string;
    savingsColor: string;
};

const TYPE_CONFIG: Record<RecommendationType, TypeConfig> = {
    cut:         { label: "Cut",         borderColor: "hsl(0 72% 51%)",    badgeClass: "bg-red-500/10 text-red-400 border-red-500/25",            dotClass: "bg-red-500",     savingsColor: "text-red-400"     },
    downgrade:   { label: "Downgrade",   borderColor: "hsl(25 95% 53%)",   badgeClass: "bg-orange-500/10 text-orange-400 border-orange-500/25",   dotClass: "bg-orange-500",  savingsColor: "text-orange-400"  },
    negotiate:   { label: "Negotiate",   borderColor: "hsl(48 96% 53%)",   badgeClass: "bg-yellow-500/10 text-yellow-400 border-yellow-500/25",   dotClass: "bg-yellow-500",  savingsColor: "text-yellow-400"  },
    consolidate: { label: "Consolidate", borderColor: "hsl(217 91% 60%)",  badgeClass: "bg-blue-500/10 text-blue-400 border-blue-500/25",         dotClass: "bg-blue-500",    savingsColor: "text-blue-400"    },
    upgrade:     { label: "Opportunity", borderColor: "hsl(142 71% 45%)",  badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",dotClass: "bg-emerald-500", savingsColor: "text-emerald-400" },
    audit:       { label: "Audit",       borderColor: "hsl(240 5% 45%)",   badgeClass: "bg-zinc-500/10 text-zinc-400 border-zinc-500/25",         dotClass: "bg-zinc-500",    savingsColor: "text-zinc-400"    },
};

const SEVERITY_CONFIG = {
    high:   { label: "High",   textClass: "text-red-400",    dotClass: "bg-red-500"    },
    medium: { label: "Medium", textClass: "text-yellow-400", dotClass: "bg-yellow-500" },
    low:    { label: "Low",    textClass: "text-zinc-500",   dotClass: "bg-zinc-500"   },
};

// ─────────────────────────────────────────────────────────────────────────────
// FILTER
// ─────────────────────────────────────────────────────────────────────────────

type FilterKey = "all" | "waste" | "opportunities" | RecommendationType;

function filterRecs(recs: Recommendation[], active: FilterKey): Recommendation[] {
    if (active === "all") return recs;
    if (active === "waste") return recs.filter((r) => r.estimatedSavings > 0);
    if (active === "opportunities") return recs.filter((r) => r.estimatedSavings === 0);
    return recs.filter((r) => r.type === active);
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIDENCE BAR
// ─────────────────────────────────────────────────────────────────────────────

function ConfidenceBar({ confidence }: { confidence: number }) {
    const pct = Math.round((confidence ?? 0) * 100);
    const colorClass = pct >= 85 ? "bg-emerald-500" : pct >= 65 ? "bg-yellow-500" : "bg-zinc-600";
    return (
        <div className="flex items-center gap-2">
            <div className="h-1 w-14 rounded-full bg-white/5 overflow-hidden">
                <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">{pct}%</span>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// RECOMMENDATION CARD
// ─────────────────────────────────────────────────────────────────────────────

function RecommendationCard({ rec }: { rec: Recommendation }) {
    const [expanded, setExpanded] = useState(false);
    const typeConf = TYPE_CONFIG[rec.type] ?? TYPE_CONFIG.audit;
    const sevConf = SEVERITY_CONFIG[rec.severity] ?? SEVERITY_CONFIG.low;
    const isUpgrade = rec.estimatedSavings === 0;

    return (
        <Card className="border-border/50 overflow-hidden relative transition-colors duration-150 hover:border-border/80">
            <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ backgroundColor: typeConf.borderColor }} />

            <button onClick={() => setExpanded((p) => !p)} className="w-full text-left pl-5 pr-4 pt-3.5 pb-3.5">
                <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 min-w-0 flex-wrap">
                        <span className="text-base leading-none">{toolIcon(rec.tool)}</span>
                        <span className="text-sm font-bold text-foreground">{rec.tool}</span>
                        <Badge variant="outline" className={`text-[10px] font-semibold uppercase tracking-wide gap-1 shrink-0 ${typeConf.badgeClass}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${typeConf.dotClass}`} />
                            {typeConf.label}
                        </Badge>
                        <span className={`hidden sm:inline-flex items-center gap-1 text-[10px] font-medium shrink-0 ${sevConf.textClass}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${sevConf.dotClass}`} />
                            {sevConf.label}
                        </span>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                        {isUpgrade ? (
                            <Badge variant="outline" className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border-emerald-500/25">
                                Opportunity
                            </Badge>
                        ) : (
                            <span className={`text-base font-bold font-mono ${typeConf.savingsColor}`}>
                                −${rec.estimatedSavings.toLocaleString()}
                                <span className="text-xs font-normal text-muted-foreground">/mo</span>
                            </span>
                        )}
                        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground/30 transition-transform duration-150 ${expanded ? "rotate-180" : ""}`} />
                    </div>
                </div>
                <p className="text-sm text-muted-foreground leading-snug pl-6">{rec.issue}</p>
            </button>

            {expanded && (
                <CardContent className="pl-5 pt-0 pb-4 border-t border-border/30">
                    <div className="pt-3 space-y-3 pl-6">
                        <p className="text-sm text-muted-foreground leading-relaxed">{rec.suggestion}</p>
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 pt-1">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] uppercase tracking-wide text-muted-foreground/40">Confidence</span>
                                <ConfidenceBar confidence={rec.confidence ?? 0} />
                            </div>
                            {!isUpgrade && (
                                <span className="text-[10px] text-muted-foreground/40 uppercase tracking-wide">
                                    Yearly:{" "}
                                    <span className="font-mono text-emerald-500 font-semibold normal-case">
                                        ${(rec.estimatedSavings * 12).toLocaleString()}
                                    </span>
                                </span>
                            )}
                        </div>
                    </div>
                </CardContent>
            )}
        </Card>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// CREDEX CTA
// Shown when potentialMonthlySavings > $500.
// Credex sells discounted AI credits — this is the lead-gen hook.
// ─────────────────────────────────────────────────────────────────────────────

function CredexCTA({ savings }: { savings: number }) {
    return (
        <Card className="border-cyan-500/30 bg-cyan-500/5 overflow-hidden relative">
            {/* Subtle glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none" />
            <CardContent className="p-5 relative">
                <div className="flex items-start gap-4">
                    <div className="shrink-0 mt-0.5 h-9 w-9 rounded-lg bg-cyan-500/15 flex items-center justify-center">
                        <Zap className="h-4 w-4 text-cyan-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-cyan-300 mb-1">
                            Capture more of that ${savings.toLocaleString()}/mo with Credex
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                            Credex sells discounted AI infrastructure credits — Cursor, Claude, ChatGPT Enterprise, and others — sourced from companies that overforecast or pivoted. The discount is real. Most startups save 20–40% on top of what the audit already found.
                        </p>
                        <Button
                            size="sm"
                            className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs shadow-[0_0_20px_rgba(6,182,212,0.25)]"
                            onClick={() => window.open("https://credex.rocks", "_blank", "noopener")}
                        >
                            Book a free Credex consultation <ExternalLink className="ml-1.5 h-3 w-3" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// SPENDING WELL BANNER
// Shown when stack is optimal OR potentialMonthlySavings < $100.
// Honest, not manufactured. Still captures lead via "notify me" CTA.
// ─────────────────────────────────────────────────────────────────────────────

function SpendingWellBanner({
                                notes,
                                onNotify,
                            }: {
    notes: string;
    onNotify: (email: string) => Promise<void>;
}) {
    const [email, setEmail] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!email.trim() || !email.includes("@")) return;

        try {
            setLoading(true);

            await onNotify(email.trim());

            setSubmitted(true);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
            <CardContent className="p-5 space-y-3">
                <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-emerald-400 mb-1">
                            You&apos;re spending well
                        </p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {notes || "Your AI stack is well-matched to your use cases. No significant consolidation or downgrades are warranted right now."}
                        </p>
                    </div>
                </div>

                {/* Notify me — lead capture without manufactured urgency */}
                {!submitted ? (
                    <div className="pl-8 space-y-2">
                        <p className="text-xs text-muted-foreground/60">
                            As your team grows or vendors change pricing, new optimisations may apply.
                            We&apos;ll notify you when they do.
                        </p>
                        <div className="flex gap-2">
                            <Input
                                type="email"
                                placeholder="your@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                                className="h-8 text-xs max-w-[240px]"
                            />
                            {/* Honeypot — hidden from humans */}
                            <Input
                                type="text"
                                name="website"
                                style={{ display: "none" }}
                                tabIndex={-1}
                                autoComplete="off"
                                aria-hidden="true"
                                readOnly
                            />
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs"
                                onClick={handleSubmit}
                                disabled={loading}
                            >
                                <Bell className="mr-1.5 h-3 w-3" />
                                {loading ? "Saving..." : "Notify me"}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="pl-8 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <p className="text-xs text-emerald-400">Got it — we&apos;ll reach out when new optimisations apply.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// WELL-OPTIMISED BANNER (engine-flagged, no email CTA needed — SpendingWell covers it)
// ─────────────────────────────────────────────────────────────────────────────

function WellOptimisedBanner({ notes }: { notes: string }) {
    return (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
            <CardContent className="flex items-start gap-4 p-5">
                <Sparkles className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-semibold text-emerald-400 mb-1">Well-optimised stack</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {notes || "Your tools are complementary and non-redundant given your stated use cases. No consolidation needed."}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface AuditResultsProps {
    result: FullAuditResult;
    tools: AuditTool[];
    onReset: () => void;
}

export function AuditResults({ result, tools, onReset }: AuditResultsProps) {
    const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
    const [savingAudit, setSavingAudit] = useState(false);
    const [shareUrl, setShareUrl] = useState("");

    const {
        recommendations,
        totalMonthlySpend,
        potentialMonthlySavings,
        potentialYearlySavings,
        stackIsWellOptimised,
        optimisationNotes,
        toolSummaries,
    } = result;

    // ── State classification ───────────────────────────────────────────────
    // "spending well" = engine says optimised OR savings are trivially small
    const isSpendingWell = stackIsWellOptimised || potentialMonthlySavings < 100;
    // Credex CTA threshold — assignment spec says >$500/mo
    const showCredexCTA = potentialMonthlySavings >= 500;

    const wasteRecs = recommendations.filter((r) => r.estimatedSavings > 0);
    const opportunityRecs = recommendations.filter((r) => r.estimatedSavings === 0);
    const highCount = recommendations.filter((r) => r.severity === "high").length;
    const savingsPct = totalMonthlySpend > 0
        ? Math.min(99, Math.round((potentialMonthlySavings / totalMonthlySpend) * 100))
        : 0;

    const presentTypes = Array.from(new Set(recommendations.map((r) => r.type))) as RecommendationType[];
    const filters: FilterKey[] = [
        "all",
        ...(wasteRecs.length > 0 ? ["waste" as FilterKey] : []),
        ...(opportunityRecs.length > 0 ? ["opportunities" as FilterKey] : []),
        ...presentTypes,
    ];
    const FILTER_LABELS: Partial<Record<FilterKey, string>> = {
        all: "All", waste: "Waste", opportunities: "Opportunities",
    };

    const filtered = filterRecs(recommendations, activeFilter);

    const chartData = [...tools]
        .sort((a, b) => b.monthlyCost - a.monthlyCost)
        .map((t) => ({ name: t.name, cost: t.monthlyCost }));

    // Notify-me handler — TODO: wire to email capture backend (Supabase)
    // Notify-me handler — saves lead to backend
    const handleNotify = async (email: string) => {
        try {
            const response = await fetch("/api/leads", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    estimatedMonthlySavings:
                    potentialMonthlySavings,
                    totalMonthlySpend:
                    totalMonthlySpend,
                    auditSummary: recommendations,
                    website:"",
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                console.error(data.error);
                return;
            }

            return;

        } catch (error) {
            console.error("Failed to save lead:", error);
        }
    };
    const handleSaveAudit = async () => {
        try {
            setSavingAudit(true);

            const response = await fetch("/api/audits", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    tools,
                    recommendations,
                    totalMonthlySpend,
                    potentialMonthlySavings,
                    potentialYearlySavings,
                    stackIsWellOptimised,
                    optimisationNotes,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                console.error(data.error);
                return;
            }

            const url = `${window.location.origin}/audit/${data.id}`;

            setShareUrl(url);

            window.open(url, "_blank");

        } catch (error) {
            console.error("Failed to save audit:", error);

        } finally {
            setSavingAudit(false);
        }
    };

    return (
        <div className="space-y-8">

            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Audit Report</h2>
                    <p className="text-muted-foreground text-sm mt-0.5">
                        {isSpendingWell
                            ? "Your stack looks healthy — no significant waste found."
                            : recommendations.length === 0
                                ? "No issues found."
                                : <>
                                    {recommendations.length} finding{recommendations.length !== 1 ? "s" : ""} across your AI stack
                                    {highCount > 0 && <> · <span className="text-red-400 font-medium">{highCount} high-priority</span></>}
                                </>
                        }
                    </p>
                </div>
                <div className="flex items-center gap-2">
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleSaveAudit}
                    disabled={savingAudit}
                >
                    {savingAudit ? "Saving..." : "Share Audit"}
                </Button>
                    {shareUrl && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigator.clipboard.writeText(shareUrl)}
                        >
                            Copy Link
                        </Button>
                    )}

                <Button
                    variant="outline"
                    size="sm"
                    onClick={onReset}
                >
                    <ArrowLeft className="mr-2 h-3.5 w-3.5" />
                    Edit Stack
                </Button>
            </div>
            </div>

            {/* ── Credex CTA — above the fold for high savings ───────────── */}
            {showCredexCTA && (
                <CredexCTA savings={potentialMonthlySavings} />
            )}

            {/* ── Summary cards ──────────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-border/50 bg-card/50">
                    <CardHeader className="pb-2 pt-4 px-4">
                        <CardDescription className="text-xs">Monthly Spend</CardDescription>
                        <CardTitle className="text-2xl font-mono">${totalMonthlySpend.toLocaleString()}</CardTitle>
                    </CardHeader>
                </Card>

                <Card className={`${potentialMonthlySavings > 0 ? "border-emerald-500/30 bg-emerald-500/5" : "border-border/50 bg-card/50"}`}>
                    <CardHeader className="pb-2 pt-4 px-4">
                        <CardDescription className={`text-xs flex items-center gap-1 ${potentialMonthlySavings > 0 ? "text-emerald-500" : ""}`}>
                            {potentialMonthlySavings > 0 && <TrendingDown className="h-3 w-3" />}
                            Monthly Savings
                        </CardDescription>
                        <CardTitle className={`text-2xl font-mono ${potentialMonthlySavings > 0 ? "text-emerald-400" : "text-muted-foreground"}`}>
                            ${potentialMonthlySavings.toLocaleString()}
                        </CardTitle>
                    </CardHeader>
                </Card>

                <Card className="border-border/50 bg-card/50">
                    <CardHeader className="pb-2 pt-4 px-4">
                        <CardDescription className="text-xs">Yearly Savings</CardDescription>
                        <CardTitle className={`text-2xl font-mono ${potentialYearlySavings > 0 ? "text-emerald-500" : "text-muted-foreground"}`}>
                            ${potentialYearlySavings.toLocaleString()}
                        </CardTitle>
                    </CardHeader>
                </Card>

                <Card
                    className="border-border/50 bg-card/50"
                    style={{
                        borderColor: savingsPct >= 25 ? "hsl(0 72% 51% / 0.3)"
                            : savingsPct >= 10 ? "hsl(48 96% 53% / 0.3)" : undefined,
                    }}
                >
                    <CardHeader className="pb-2 pt-4 px-4">
                        <CardDescription className="text-xs">Waste of Budget</CardDescription>
                        <CardTitle className={`text-2xl font-mono ${savingsPct >= 25 ? "text-red-400" : savingsPct >= 10 ? "text-yellow-400" : "text-muted-foreground"}`}>
                            ~{savingsPct}%
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* ── Main content ───────────────────────────────────────────── */}
            <div className="grid lg:grid-cols-2 gap-8">

                {/* ── Left: recommendations ──────────────────────────────── */}
                <div className="space-y-4">
                    <h3 className="text-base font-semibold border-b border-border/50 pb-2">Recommendations</h3>

                    {/* Spending well state — honest, no manufactured savings */}
                    {isSpendingWell && (
                        <SpendingWellBanner
                            notes={optimisationNotes}
                            onNotify={handleNotify}
                        />
                    )}

                    {/* Well-optimised engine note — only when savings exist but engine still flagged it */}
                    {!isSpendingWell && stackIsWellOptimised && (
                        <WellOptimisedBanner notes={optimisationNotes} />
                    )}

                    {recommendations.length === 0 ? (
                        !isSpendingWell && (
                            <Card className="border-dashed bg-muted/10">
                                <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                                    <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-3" />
                                    <h4 className="text-base font-medium mb-1">No issues found</h4>
                                    <p className="text-sm text-muted-foreground">Your stack looks clean.</p>
                                </CardContent>
                            </Card>
                        )
                    ) : (
                        <div className="space-y-3">
                            {/* Filter pills */}
                            <div className="flex flex-wrap gap-1.5">
                                {filters.map((f) => {
                                    const isActive = activeFilter === f;
                                    const typeConf = (f !== "all" && f !== "waste" && f !== "opportunities")
                                        ? TYPE_CONFIG[f as RecommendationType] : null;
                                    const count = filterRecs(recommendations, f).length;
                                    const label = FILTER_LABELS[f] ?? TYPE_CONFIG[f as RecommendationType]?.label ?? f;
                                    return (
                                        <button
                                            key={f}
                                            onClick={() => setActiveFilter(f)}
                                            className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-medium transition-all duration-100 ${
                                                isActive
                                                    ? typeConf ? typeConf.badgeClass : "bg-primary/10 text-primary border-primary/30"
                                                    : "bg-transparent text-muted-foreground border-border/50 hover:border-border hover:text-foreground"
                                            }`}
                                        >
                                            {typeConf && <span className={`h-1.5 w-1.5 rounded-full ${typeConf.dotClass}`} />}
                                            {label}
                                            <span className="opacity-50 font-mono">{count}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Waste recs */}
                            {filtered.some((r) => r.estimatedSavings > 0) && (
                                <div className="space-y-2">
                                    {activeFilter === "all" && (
                                        <div className="flex items-center gap-2 py-0.5">
                                            <span className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/40">
                                                Waste · {wasteRecs.length} finding{wasteRecs.length !== 1 ? "s" : ""}
                                            </span>
                                            <div className="flex-1 h-px bg-border/40" />
                                            <span className="text-[10px] font-mono text-emerald-600">
                                                −${potentialMonthlySavings.toLocaleString()}/mo
                                            </span>
                                        </div>
                                    )}
                                    {filtered.filter((r) => r.estimatedSavings > 0).map((rec, i) => (
                                        <RecommendationCard key={i} rec={rec} />
                                    ))}
                                </div>
                            )}

                            {/* Opportunity recs */}
                            {filtered.some((r) => r.estimatedSavings === 0) && (
                                <div className="space-y-2">
                                    {activeFilter === "all" && (
                                        <div className="flex items-center gap-2 py-0.5">
                                            <span className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/40">
                                                Opportunities · {opportunityRecs.length}
                                            </span>
                                            <div className="flex-1 h-px bg-border/40" />
                                        </div>
                                    )}
                                    {filtered.filter((r) => r.estimatedSavings === 0).map((rec, i) => (
                                        <RecommendationCard key={i} rec={rec} />
                                    ))}
                                </div>
                            )}

                            {/* Credex CTA — below recs for medium savings ($100–$499) */}
                            {!showCredexCTA && potentialMonthlySavings >= 100 && (
                                <Card className="border-border/50 bg-card/30 mt-2">
                                    <CardContent className="p-4 flex items-center gap-3">
                                        <Zap className="h-4 w-4 text-cyan-400 shrink-0" />
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            Want to reduce costs further?{" "}
                                            <button
                                                onClick={() => window.open("https://credex.rocks", "_blank", "noopener")}
                                                className="text-cyan-400 underline underline-offset-2 hover:text-cyan-300"
                                            >
                                                Credex sells discounted AI credits
                                            </button>{" "}
                                            — real savings on top of what you found here.
                                        </p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Right: spend breakdown ─────────────────────────────── */}
                <div className="space-y-4">
                    <h3 className="text-base font-semibold border-b border-border/50 pb-2">Spend Breakdown</h3>

                    <Card className="border-border/50 bg-card/50 p-5">
                        <div className="h-[240px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 16, left: 40, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                                    <XAxis type="number" tickFormatter={(v) => `$${v}`} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} stroke="hsl(var(--muted-foreground))" fontSize={11} width={72} />
                                    <Tooltip
                                        formatter={(v) => typeof v === "number" ? [`$${v.toLocaleString()}`, "Monthly cost"] : ["N/A", "Monthly cost"]}
                                        contentStyle={{ backgroundColor: "hsl(var(--popover))", borderColor: "hsl(var(--border))", borderRadius: "0.5rem", fontSize: 12 }}
                                        itemStyle={{ color: "hsl(var(--foreground))" }}
                                    />
                                    <Bar dataKey="cost" radius={[0, 4, 4, 0]}>
                                        {chartData.map((_, i) => (
                                            <Cell key={`cell-${i}`} fill="hsl(var(--primary))" opacity={Math.max(0.35, 1 - i * 0.12)} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    {/* Per-tool rows */}
                    <div className="space-y-3">
                        {chartData.map((t) => {
                            const pct = totalMonthlySpend > 0 ? Math.round((t.cost / totalMonthlySpend) * 100) : 0;
                            const summary = toolSummaries?.[t.name];
                            return (
                                <div key={t.name} className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm w-5 text-center shrink-0">{toolIcon(t.name)}</span>
                                        <span className="text-xs text-foreground w-24 truncate shrink-0 font-medium">{t.name}</span>
                                        <div className="flex-1 h-1.5 rounded-full bg-border/40 overflow-hidden">
                                            <div className="h-full rounded-full bg-primary/60" style={{ width: `${pct}%` }} />
                                        </div>
                                        <span className="text-xs font-mono text-muted-foreground w-16 text-right shrink-0">${t.cost.toLocaleString()}</span>
                                        <span className="text-[10px] font-mono text-muted-foreground/40 w-8 text-right shrink-0">{pct}%</span>
                                    </div>
                                    {summary && (
                                        <p className="text-[11px] text-muted-foreground/50 pl-8 leading-snug">{summary}</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <p className="text-[10px] text-muted-foreground/30 pt-1">
                        Savings estimates are indicative. Verify current pricing with each vendor before acting.
                    </p>
                </div>
            </div>
        </div>
    );
}