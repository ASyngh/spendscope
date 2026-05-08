import {
    AuditTool,
    AuditResult,
    Recommendation,
} from "@/types/audit";

export function runAudit(
    tools: AuditTool[]
): AuditResult {

    const recommendations: Recommendation[] = [];

    let totalMonthlySpend = 0;
    let potentialMonthlySavings = 0;

    const toolNames = tools.map((tool) => tool.name);

    for (const tool of tools) {
        totalMonthlySpend += tool.monthlyCost;

        if (
            toolNames.includes("Cursor") &&
            toolNames.includes("GitHub Copilot")
        ) {
            recommendations.push({
                tool: "Cursor + GitHub Copilot",
                issue: "Overlapping developer tools",
                suggestion: "Consolidate to a single coding assistant",
                estimatedSavings: 20,
                severity: "medium",
            });

            potentialMonthlySavings += 20;
        }

        if (tool.seats > 10) {
            recommendations.push({
                tool: tool.name,
                issue: "High seat allocation",
                suggestion: "Review inactive seats",
                estimatedSavings: 50,
                severity: "medium",
            });

            potentialMonthlySavings += 50;
        }

        if (
            tool.name === "ChatGPT" &&
            tool.plan === "Team" &&
            tool.seats < 5
        ) {
            recommendations.push({
                tool: tool.name,
                issue: "Expensive plan for small team",
                suggestion: "Consider downgrading to ChatGPT Plus",
                estimatedSavings: 40,
                severity: "high",
            });

            potentialMonthlySavings += 40;
        }
    }

    return {
        totalMonthlySpend,
        potentialMonthlySavings,
        potentialYearlySavings:
            potentialMonthlySavings * 12,
        recommendations,
    };
}