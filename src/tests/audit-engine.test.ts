/**
 * tests/audit-engine.test.ts
 *
 * Vitest tests for the SpendScope audit engine.
 * Run with: npm test
 */

import { describe, it, expect } from "vitest";
import { runAudit } from "@/lib/audit-engine";
import { AuditTool } from "@/types/audit";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function makeTool(overrides: Partial<AuditTool> & { name: string; plan: string }): AuditTool {
    return {
        id: Math.random().toString(36).slice(2),
        monthlyCost: 100,
        seats: 1,
        useCase: "general chat and writing",
        billingCycle: "annual",
        ...overrides,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 1 — Empty tools array returns zero savings
// ─────────────────────────────────────────────────────────────────────────────

describe("runAudit with empty tools", () => {
    it("returns zero spend and zero savings", () => {
        const result = runAudit([]);
        expect(result.totalMonthlySpend).toBe(0);
        expect(result.potentialMonthlySavings).toBe(0);
        expect(result.potentialYearlySavings).toBe(0);
        expect(result.recommendations).toHaveLength(0);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 2 — Coding assistant overlap fires when Claude Pro + Cursor both present
// ─────────────────────────────────────────────────────────────────────────────

describe("ruleCodingAssistantOverlap", () => {
    it("fires consolidate rec when Claude Pro and Cursor are both in stack", () => {
        const tools: AuditTool[] = [
            makeTool({ name: "Claude", plan: "Pro", monthlyCost: 20, seats: 1, useCase: "coding and development" }),
            makeTool({ name: "Cursor", plan: "Pro", monthlyCost: 20, seats: 1, useCase: "coding" }),
        ];
        const result = runAudit(tools);
        const rec = result.recommendations.find((r) => r.type === "consolidate" || r.type === "cut");
        expect(rec).toBeDefined();
        expect(rec?.tool).toContain("Claude");
        expect(rec?.tool).toContain("Cursor");
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 3 — General AI overlap fires when Claude + ChatGPT both on paid plans
// ─────────────────────────────────────────────────────────────────────────────

describe("ruleGeneralAIOverlap", () => {
    it("fires consolidate rec when Claude and ChatGPT are both paid", () => {
        const tools: AuditTool[] = [
            makeTool({ name: "Claude", plan: "Pro", monthlyCost: 20, seats: 1, useCase: "writing" }),
            makeTool({ name: "ChatGPT", plan: "Plus", monthlyCost: 20, seats: 1, useCase: "writing" }),
        ];
        const result = runAudit(tools);
        const rec = result.recommendations.find(
            (r) => r.type === "consolidate" && r.tool.includes("Claude") && r.tool.includes("ChatGPT")
        );
        expect(rec).toBeDefined();
        expect(rec?.estimatedSavings).toBeGreaterThan(0);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 4 — Monthly billing rule fires for 3+ seats on monthly billing
// ─────────────────────────────────────────────────────────────────────────────

describe("ruleMonthlyBillingAtTeamScale", () => {
    it("fires negotiate rec when tool has 3+ seats on monthly billing", () => {
        const tools: AuditTool[] = [
            makeTool({
                name: "Claude",
                plan: "Team Standard",
                monthlyCost: 60,
                seats: 3,
                billingCycle: "monthly",
                useCase: "writing and analysis",
            }),
        ];
        const result = runAudit(tools);
        const rec = result.recommendations.find(
            (r) => r.type === "negotiate" && r.issue.includes("annual")
        );
        expect(rec).toBeDefined();
        expect(rec?.estimatedSavings).toBeGreaterThan(0);
        expect(rec?.confidence).toBeGreaterThanOrEqual(0.9);
    });

    it("does NOT fire for fewer than 3 seats", () => {
        const tools: AuditTool[] = [
            makeTool({
                name: "Claude",
                plan: "Team Standard",
                monthlyCost: 20,
                seats: 2,
                billingCycle: "monthly",
                useCase: "writing and analysis",
            }),
        ];
        const result = runAudit(tools);

        const rec = result.recommendations.find(
            (r) => r.type === "negotiate" && r.issue.includes("annual")
        );
        expect(rec).toBeUndefined();
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 5 — Personal plan at team scale fires for 3+ seats on personal plan
// ─────────────────────────────────────────────────────────────────────────────

describe("rulePersonalPlanAtTeamScale", () => {
    it("fires downgrade rec when Claude Pro used across 5 seats", () => {
        const tools: AuditTool[] = [
            makeTool({
                name: "Claude",
                plan: "Pro",
                monthlyCost: 100,
                seats: 5,
                useCase: "general chat",
            }),
        ];
        const result = runAudit(tools);
        const rec = result.recommendations.find(
            (r) => r.type === "downgrade" && r.tool === "Claude"
        );
        expect(rec).toBeDefined();
        expect(rec?.estimatedSavings).toBeGreaterThan(0);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 6 — Spend concentration does NOT fire for small teams (our fix)
// ─────────────────────────────────────────────────────────────────────────────

describe("ruleSpendConcentration", () => {
    it("does NOT fire for a single Claude tool with 3 seats", () => {
        const tools: AuditTool[] = [
            makeTool({
                name: "Claude",
                plan: "Team Standard",
                monthlyCost: 60,
                seats: 3,
                useCase: "writing",
            }),
        ];
        const result = runAudit(tools);
        const rec = result.recommendations.find(
            (r) => r.issue?.includes("concentrated")
        );
        expect(rec).toBeUndefined();
    });

    it("does NOT fire when only one tool in stack regardless of spend", () => {
        const tools: AuditTool[] = [
            makeTool({
                name: "Claude",
                plan: "Team Premium",
                monthlyCost: 5100,
                seats: 51,
                useCase: "coding and analysis",
            }),
        ];
        const result = runAudit(tools);
        const rec = result.recommendations.find(
            (r) => r.issue?.includes("concentrated")
        );
        expect(rec).toBeUndefined();
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 7 — Unused coding capability fires for Team Premium with non-coding use
// ─────────────────────────────────────────────────────────────────────────────

describe("rulePlanIncludesUnusedCodingCapability", () => {
    it("fires downgrade rec for Claude Team Premium with non-coding use case", () => {
        const tools: AuditTool[] = [
            makeTool({
                name: "Claude",
                plan: "Team Premium",
                monthlyCost: 1000,
                seats: 10,
                useCase: "writing marketing copy and blog posts",
            }),
        ];
        const result = runAudit(tools);
        const rec = result.recommendations.find(
            (r) => r.type === "downgrade" && r.tool === "Claude" && r.issue.includes("Claude Code")
        );
        expect(rec).toBeDefined();
        expect(rec?.estimatedSavings).toBe(800); // 10 seats × $80/seat savings
    });

    it("does NOT fire when use case indicates coding", () => {
        const tools: AuditTool[] = [
            makeTool({
                name: "Claude",
                plan: "Team Premium",
                monthlyCost: 1000,
                seats: 10,
                useCase: "coding development engineering software",
            }),
        ];
        const result = runAudit(tools);
        const rec = result.recommendations.find(
            (r) => r.type === "downgrade" && r.issue.includes("Claude Code")
        );
        expect(rec).toBeUndefined();
    });
});