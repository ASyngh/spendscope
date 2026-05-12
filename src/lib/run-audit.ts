/**
 * lib/run-audit.ts
 *
 * Orchestrates the full audit:
 * 1. Calls analyzeStack() to get semantic use-case capabilities per tool
 * 2. Passes capabilities into the rules engine (replaces keyword matching)
 * 3. Enriches each recommendation's suggestion text via Groq
 * 4. If stack is well-optimised, surfaces that as a positive finding
 *
 * Import runFullAudit() instead of runAudit() from audit-engine.ts directly.
 */

import { AuditTool, AuditResult, Recommendation } from "@/types/audit";
import { runAudit } from "@/lib/audit-engine";
import { analyzeStack, UseCapeCapabilities } from "@/lib/analyze-use-case";

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────────

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

function getGroqKey(): string {
    return process.env.NEXT_PUBLIC_GROQ_API_KEY ?? "";
}

// ─────────────────────────────────────────────────────────────────────────────
// EXTENDED AUDIT RESULT
// ─────────────────────────────────────────────────────────────────────────────

export type FullAuditResult = AuditResult & {
    stackIsWellOptimised: boolean;
    optimisationNotes: string;
    toolSummaries: Record<string, string>; // tool name → 1-sentence usage summary
};

// ─────────────────────────────────────────────────────────────────────────────
// GROQ ENRICHMENT
// Rewrites the `suggestion` field on each recommendation to be more
// contextual and readable, given the actual tool/plan/use-case context.
// Runs as a single batched API call for all recommendations.
// ─────────────────────────────────────────────────────────────────────────────

async function enrichRecommendations(
    recommendations: Recommendation[],
    tools: AuditTool[],
    toolSummaries: Record<string, string>
): Promise<Recommendation[]> {
    if (recommendations.length === 0) return recommendations;
    console.log("enrichRecommendations called with", recommendations.length, "recs");

    // Build a compact context block so Groq understands the actual stack
    const stackContext = tools
        .map((t) => {
            const summary = toolSummaries[t.name] ? ` — "${toolSummaries[t.name]}"` : "";
            return `- ${t.name} (${t.plan}, ${t.seats} seat${t.seats !== 1 ? "s" : ""}, $${t.monthlyCost}/mo)${summary}`;
        })
        .join("\n");

    // Serialize recommendations for the prompt
    const recsForPrompt = recommendations.map((r, i) => ({
        index: i,
        tool: r.tool,
        type: r.type,
        issue: r.issue,
        currentSuggestion: r.suggestion,
        estimatedSavings: r.estimatedSavings,
        severity: r.severity,
    }));

    const prompt = `You are a blunt, senior CFO advisor writing spend recommendations for a startup founder who is not technical.

THEIR CURRENT AI STACK:
${stackContext}

FINDINGS TO REWRITE (${recommendations.length} total):
${JSON.stringify(recsForPrompt, null, 2)}

Rewrite the "suggestion" field for each finding. Your rewrites must:
- Sound like a CFO talking directly to a founder, not a generic SaaS recommendation
- Be 2-3 sentences max. No filler. No "consider" or "you might want to". Be direct.
- State the exact action to take, who to contact, and what the outcome is
- Reference the actual numbers: tool name, plan, seat count, dollar amount
- For billing cycle findings: name the exact saving and tell them exactly how to switch (admin dashboard or account rep)
- For consolidation findings: name which tool to cut and why the other covers it
- For negotiate findings: explain exactly what leverage they have and what to say
- Never repeat the issue text back as the suggestion — the founder already read it

Respond with ONLY a valid JSON array. No markdown, no explanation, no extra text:
[
  { "index": 0, "suggestion": "your rewrite here" },
  { "index": 1, "suggestion": "your rewrite here" }
]`;

    try {
        const response = await fetch(GROQ_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getGroqKey()}`,
            },
            body: JSON.stringify({
                model: GROQ_MODEL,
                max_tokens: 2048,
                temperature: 0.3,
                messages: [
                    {
                        role: "system",
                        content: "You are a precise JSON-only responder. Never include markdown, code fences, or any text outside the JSON array.",
                    },
                    { role: "user", content: prompt },
                ],
            }),
        });

        if (!response.ok) throw new Error(`Groq enrichment failed: ${response.status}`);

        const data = await response.json();
        console.log("Raw Groq response:", JSON.stringify(data, null, 2));

        const text: string = (data.choices?.[0]?.message?.content ?? "")
            .replace(/```json|```/g, "")
            .trim();

        console.log("Parsed text before JSON.parse:", text);

        const enriched: { index: number; suggestion: string }[] = JSON.parse(text);
        console.log("enriched suggestions:", JSON.stringify(enriched, null, 2));

        // Merge enriched suggestions back into original recommendations
        return recommendations.map((rec, i) => {
            const match = enriched.find((e) => e.index === i);
            return match ? { ...rec, suggestion: match.suggestion } : rec;
        });
    } catch (err) {
        // Fallback: return original suggestions untouched
        // Log so you can see if Groq is actually failing vs silently falling back
        console.error("[enrichRecommendations] Error during enrichment:", {
            error: err instanceof Error ? err.message : String(err),
            stack: err instanceof Error ? err.stack : undefined,
            recommendations: recommendations.length,
        });
        return recommendations;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN ORCHESTRATOR
// ─────────────────────────────────────────────────────────────────────────────

export async function runFullAudit(tools: AuditTool[]): Promise<FullAuditResult> {
    console.log("[runFullAudit] START - tools count:", tools.length);

    if (!tools.length) {
        return {
            totalMonthlySpend: 0,
            potentialMonthlySavings: 0,
            potentialYearlySavings: 0,
            recommendations: [],
            stackIsWellOptimised: true,
            optimisationNotes: "No tools to audit.",
            toolSummaries: {},
        };
    }

    // 1. Semantic analysis of the whole stack in one API call
    console.log("[runFullAudit] Step 1: Calling analyzeStack...");
    const stackAnalysis = await analyzeStack(tools);
    console.log("[runFullAudit] Step 1 complete. stackAnalysis:", JSON.stringify(stackAnalysis, null, 2));

    const capabilityMap: Record<string, UseCapeCapabilities> = stackAnalysis.toolCapabilities;

    // 2. Patch tools with semantic useCase keywords so the rules engine
    //    reads capability flags instead of raw user input strings
    console.log("[runFullAudit] Step 2: Patching tools with semantic use cases...");
    const patchedTools: AuditTool[] = tools.map((t) => {
        const caps = capabilityMap[t.name];
        if (!caps) return t;

        const semanticUseCase = [
            caps.usesCoding   ? "coding development engineering software" : "",
            caps.usesImageGen ? "image generation visual design"          : "",
            caps.usesWriting  ? "writing content copy"                    : "",
            caps.usesAnalysis ? "analysis research data"                  : "",
            caps.usesChat     ? "chat assistant general"                  : "",
        ].filter(Boolean).join(" ");

        return { ...t, useCase: semanticUseCase };
    });
    console.log("[runFullAudit] Step 2 complete. patchedTools:", JSON.stringify(patchedTools, null, 2));

    // 3. Run the rules engine with semantically-patched tools
    console.log("[runFullAudit] Step 3: Running audit engine...");
    const baseResult = runAudit(patchedTools);
    console.log("[runFullAudit] Step 3 complete. baseResult recommendations:", baseResult.recommendations.length);

    // 4. If stack is well-optimised, suppress low-confidence speculative recs
    console.log("[runFullAudit] Step 4: Filtering based on stackIsWellOptimised...");
    let recommendations = baseResult.recommendations;
    if (stackAnalysis.stackIsWellOptimised) {
        recommendations = recommendations.filter(
            (r) =>
                r.type !== "consolidate" &&
                r.type !== "cut" &&
                (r.severity === "high" || (r.confidence ?? 0) > 0.85)
        );
    }
    console.log("[runFullAudit] Step 4 complete. Filtered recommendations:", recommendations.length);

    // 5. Build tool summaries for the UI spend breakdown
    console.log("[runFullAudit] Step 5: Building tool summaries...");
    const toolSummaries: Record<string, string> = {};
    for (const [name, caps] of Object.entries(capabilityMap)) {
        toolSummaries[name] = caps.summary;
    }
    console.log("[runFullAudit] Step 5 complete. toolSummaries:", toolSummaries);

    // 6. Enrich recommendation suggestions with Groq — contextual, human, specific
    console.log("[runFullAudit] Step 6: About to call enrichRecommendations with", recommendations.length, "recommendations");
    recommendations = await enrichRecommendations(recommendations, tools, toolSummaries);
    console.log("[runFullAudit] Step 6 complete. After enrichRecommendations, recommendations:", JSON.stringify(recommendations.slice(0, 2), null, 2));

    // 7. Recalculate savings after filtering
    console.log("[runFullAudit] Step 7: Recalculating savings...");
    const potentialMonthlySavings = recommendations.reduce(
        (sum, r) => sum + r.estimatedSavings,
        0
    );
    console.log("[runFullAudit] Step 7 complete. potentialMonthlySavings:", potentialMonthlySavings);

    console.log("[runFullAudit] COMPLETE - returning result");
    return {
        ...baseResult,
        recommendations,
        potentialMonthlySavings,
        potentialYearlySavings: potentialMonthlySavings * 12,
        stackIsWellOptimised: stackAnalysis.stackIsWellOptimised && recommendations.length === 0,
        optimisationNotes: stackAnalysis.optimisationNotes,
        toolSummaries,
    };
}