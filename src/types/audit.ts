export interface AuditTool {
    id: string;
    toolName: string;
    plan: string;
    monthlyCost: number;
    seats: number;
    useCase: string;
}

export interface AuditResult {
    totalMonthlySpend: number;
    potentialMonthlySavings: number;
    potentialYearlySavings: number;
    recommendations: Recommendation[];
}

export interface Recommendation {
    tool: string;
    issue: string;
    suggestion: string;
    estimatedSavings: number;
    severity: "low" | "medium" | "high";
}