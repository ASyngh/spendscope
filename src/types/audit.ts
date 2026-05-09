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