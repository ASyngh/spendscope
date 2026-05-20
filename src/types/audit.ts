import type { PricingSnapshot } from "@/data/pricing";

export interface AuditTool {
    name: string;
    plan: string;
    monthlyCost: number;
    seats: number;
    useCase: string;
    billingCycle?: "monthly" | "annual"; // optional — Rule 15 activates when present
    id?: string;
}

export interface AuditResult {
    totalMonthlySpend: number;
    potentialMonthlySavings: number;
    potentialYearlySavings: number;
    recommendations: Recommendation[];
}

export type RecommendationType =
    | "cut"
    | "downgrade"
    | "consolidate"
    | "upgrade"
    | "negotiate"
    | "audit";

export interface Recommendation {
    tool: string;
    issue: string;
    suggestion: string;
    estimatedSavings: number;
    severity: "low" | "medium" | "high";
    type: RecommendationType;
    confidence: number; // 0.0–1.0
}


// Round 2 additions
export interface AuditDiff {
    changed: boolean;
    prevSavings: number;
    newSavings: number;
    savingsDelta: number;
    addedRecs: Recommendation[];
    removedRecs: Recommendation[];
    unchangedRecs: Recommendation[];
}

export interface StoredAudit {
    id: string;
    email: string | null;
    tools: AuditTool[];
    recommendations: Recommendation[];
    total_monthly_spend: number;
    potential_monthly_savings: number;
    pricing_snapshot: PricingSnapshot | null;
    previous_recommendations: Recommendation[] | null;
    previous_savings: number | null;
    is_stale: boolean;
    last_reaudited_at: string | null;
    created_at: string;
}