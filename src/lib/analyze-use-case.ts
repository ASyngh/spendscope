/**
 * lib/analyze-use-case.ts
 *
 * Replaces keyword-matching with a Groq API call (llama-3.3-70b-versatile)
 * that reads use case descriptions semantically. Also evaluates whether the
 * overall stack looks well-optimised given the described use cases.
 *
 * Groq is used instead of Claude API — it's free-tier friendly and
 * OpenAI-compatible. Set NEXT_PUBLIC_GROQ_API_KEY in your .env.local.
 */

import { AuditTool } from "@/types/audit";

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────────

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

function getGroqKey(): string {
    return process.env.NEXT_PUBLIC_GROQ_API_KEY ?? "";
}

/** Shared fetch wrapper — handles auth, JSON parse, and text extraction */
async function groqComplete(prompt: string): Promise<string> {
    const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getGroqKey()}`,
        },
        body: JSON.stringify({
            model: GROQ_MODEL,
            max_tokens: 1000,
            temperature: 0,          // deterministic JSON output
            messages: [
                {
                    role: "system",
                    content: "You are a precise JSON-only responder. Never include markdown, code fences, or any text outside the JSON object.",
                },
                { role: "user", content: prompt },
            ],
        }),
    });

    if (!response.ok) {
        throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    // Groq follows OpenAI response shape: choices[0].message.content
    const text: string = data.choices?.[0]?.message?.content ?? "";
    return text.replace(/```json|```/g, "").trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type UseCaseCapabilities = {
    usesCoding: boolean;    // uses coding / dev / engineering features
    usesImageGen: boolean;  // uses image generation features
    usesWriting: boolean;   // uses writing / content creation features
    usesAnalysis: boolean;  // uses analysis / research features
    usesChat: boolean;      // general chat / assistant use
    summary: string;        // 1-sentence plain-English summary of what they use it for
};

export type StackAnalysis = {
    toolCapabilities: Record<string, UseCapeCapabilities>; // keyed by tool name
    stackIsWellOptimised: boolean;
    optimisationNotes: string; // 1-2 sentences explaining why, shown in UI
};

// Typo alias kept for export compatibility with run-audit.ts
export type UseCapeCapabilities = UseCaseCapabilities;

// ─────────────────────────────────────────────────────────────────────────────
// SINGLE-TOOL ANALYSIS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Asks Groq (Llama 3.3 70B) to interpret a single tool's use case description semantically.
 * Returns structured capability flags — no keyword matching.
 *
 * Example: "everything except image and vid gen" → usesCoding: true, usesImageGen: false
 * Example: "writing marketing copy and blog posts" → usesWriting: true, usesCoding: false
 */
export async function analyzeToolUseCase(tool: AuditTool): Promise<UseCaseCapabilities> {
    const prompt = `You are analyzing how a startup uses an AI tool subscription.

Tool: ${tool.name} (${tool.plan} plan, ${tool.seats} seat${tool.seats !== 1 ? "s" : ""})
Use case description: "${tool.useCase}"

Based on this description, determine what capabilities the team actually uses.
Interpret the description semantically — e.g. "everything except image gen" means they use coding, writing, analysis, and chat but NOT image generation.

Respond with ONLY a JSON object, no markdown, no explanation:
{
  "usesCoding": boolean,
  "usesImageGen": boolean,
  "usesWriting": boolean,
  "usesAnalysis": boolean,
  "usesChat": boolean,
  "summary": "one sentence describing what they actually use it for"
}`;

    try {
        const clean = await groqComplete(prompt);
        return JSON.parse(clean) as UseCaseCapabilities;
    } catch {
        // Fallback: assume all capabilities used — conservative, avoids false positives
        return {
            usesCoding: true,
            usesImageGen: true,
            usesWriting: true,
            usesAnalysis: true,
            usesChat: true,
            summary: tool.useCase,
        };
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// FULL STACK ANALYSIS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Analyzes the entire stack in one API call.
 * More efficient than N individual calls, and lets the model reason about
 * cross-tool complementarity (e.g. "ChatGPT for image gen + Claude for everything else"
 * is a deliberate split, not an overlap).
 */
export async function analyzeStack(tools: AuditTool[]): Promise<StackAnalysis> {
    const toolDescriptions = tools
        .map(
            (t) =>
                `- Tool: "${t.name}" | Plan: ${t.plan} | Seats: ${t.seats} | Cost: $${t.monthlyCost}/mo | Use case: "${t.useCase}"`
        )
        .join("\n");

    const prompt = `You are a startup CFO's AI spend advisor analyzing a company's AI tool stack.

Here is their current stack with use case descriptions:
${toolDescriptions}

Your job:
1. For each tool, determine what capabilities the team actually uses based on their description. Interpret descriptions semantically — "everything except image gen" means coding + writing + analysis + chat but NOT image gen.
2. Assess whether the overall stack is well-optimised: are the tools complementary and non-redundant given their stated use cases? A stack where ChatGPT is used specifically for image gen and Claude is used for everything else is deliberate and well-optimised, not redundant.

Respond with ONLY a JSON object, no markdown, no explanation:
{
  "toolCapabilities": {
    "<Use the exact tool name from the "Tool:" field as the key in toolCapabilities.>": {
      "usesCoding": boolean,
      "usesImageGen": boolean,
      "usesWriting": boolean,
      "usesAnalysis": boolean,
      "usesChat": boolean,
      "summary": "one sentence"
    }
  },
  "stackIsWellOptimised": boolean,
  "optimisationNotes": "1-2 sentences explaining the assessment — be specific about what makes it optimised or not"
}`;

    try {
        const clean = await groqComplete(prompt);
        return JSON.parse(clean) as StackAnalysis;
    } catch {
        // Fallback: assume all capabilities used, not optimised (conservative)
        const fallbackCaps: UseCaseCapabilities = {
            usesCoding: true,
            usesImageGen: true,
            usesWriting: true,
            usesAnalysis: true,
            usesChat: true,
            summary: "",
        };
        return {
            toolCapabilities: Object.fromEntries(
                tools.map((t) => [t.name, { ...fallbackCaps, summary: t.useCase }])
            ),
            stackIsWellOptimised: false,
            optimisationNotes: "",
        };
    }
}