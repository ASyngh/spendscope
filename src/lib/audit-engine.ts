import { AuditTool, AuditResult, Recommendation } from "@/types/audit";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Recommendation type — drives UI rendering (cut = red, upgrade = green, etc.)
 */
export type RecommendationType =
    | "cut"        // Cancel a tool or seats outright
    | "downgrade"  // Move to a cheaper plan tier
    | "consolidate"// Merge multiple tools into one
    | "upgrade"    // Spend more to save productivity (rare, flagged differently)
    | "negotiate"  // Push vendor for discount
    | "audit";     // Requires manual investigation before action

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS & KNOWN TOOL METADATA
// ─────────────────────────────────────────────────────────────────────────────

const TOOL_CATEGORIES: Record<string, string> = {
    // General AI / Chat
    ChatGPT: "general-ai",
    Claude: "general-ai",
    Gemini: "general-ai",
    Perplexity: "general-ai",
    Copilot: "general-ai",  // Microsoft Copilot (not GitHub)

    // Dedicated Coding Assistants
    Cursor: "coding-assistant",
    "GitHub Copilot": "coding-assistant",
    Codeium: "coding-assistant",
    Tabnine: "coding-assistant",
    "Amazon CodeWhisperer": "coding-assistant",
    Windsurf: "coding-assistant",

    // Writing / Content
    "Notion AI": "writing-assistant",
    Jasper: "writing-assistant",
    "Copy.ai": "writing-assistant",
    Copy: "writing-assistant",
    Grammarly: "writing-assistant",
    Writesonic: "writing-assistant",
    Rytr: "writing-assistant",

    // Image Generation
    Midjourney: "image-generation",
    "DALL-E": "image-generation",
    "Adobe Firefly": "image-generation",
    Stable: "image-generation",  // matches "Stable Diffusion"
    Leonardo: "image-generation",
    Ideogram: "image-generation",

    // Search / Research
    "You.com": "ai-search",
};

// ─────────────────────────────────────────────────────────────────────────────
// CAPABILITY LAYER
//
// Maps tool + plan → what capabilities are bundled at that tier.
// The most commonly missed waste pattern: teams paying for a standalone coding
// tool (Cursor, GitHub Copilot) when their general AI plan already includes
// a capable coding agent (Claude Code, Codex, Gemini Code Assist).
// ─────────────────────────────────────────────────────────────────────────────

type Capability =
    | "chat"
    | "coding"
    | "image-gen"
    | "writing"
    | "team-admin"
    | "analysis";

const PLAN_CAPABILITIES: Record<string, Record<string, Capability[]>> = {
    // ── Claude ──────────────────────────────────────────────────────────────
    // Claude Code ships with Pro, Max, Team Premium, and Enterprise.
    Claude: {
        Free: ["chat"],
        Pro: ["chat", "coding", "analysis"],
        Max: ["chat", "coding", "analysis"],
        "Team Standard": ["chat", "analysis", "team-admin"],
        "Team Premium": ["chat", "coding", "analysis", "team-admin"],
        Enterprise: ["chat", "coding", "analysis", "team-admin"],
    },

    // ── ChatGPT ──────────────────────────────────────────────────────────────
    // Codex (sandboxed coding agent) ships with Plus and above.
    // DALL-E image gen included from Plus upward.
    ChatGPT: {
        Free: ["chat"],
        Plus: ["chat", "coding", "image-gen"],
        Pro: ["chat", "coding", "image-gen"],
        Business: ["chat", "coding", "image-gen", "team-admin"],
        Enterprise: ["chat", "coding", "image-gen", "team-admin"],
    },

    // ── Gemini ───────────────────────────────────────────────────────────────
    Gemini: {
        Free: ["chat"],
        "AI Plus": ["chat", "analysis"],
        "AI Pro": ["chat", "coding", "analysis"],
        "AI Ultra": ["chat", "coding", "analysis", "image-gen"],
        "Workspace Business": ["chat", "analysis", "team-admin"],
    },

    // ── GitHub Copilot ───────────────────────────────────────────────────────
    "GitHub Copilot": {
        Free: ["coding"],
        Pro: ["coding"],
        "Pro+": ["coding"],
        Business: ["coding", "team-admin"],
        Enterprise: ["coding", "team-admin"],
    },

    // ── Cursor ───────────────────────────────────────────────────────────────
    Cursor: {
        Free: ["coding"],
        Pro: ["coding"],
        "Pro+": ["coding"],
        Ultra: ["coding"],
        Teams: ["coding", "team-admin"],
        Enterprise: ["coding", "team-admin"],
    },

    // ── Notion AI ────────────────────────────────────────────────────────────
    "Notion AI": {
        Free: [],
        Plus: [],                // 20 lifetime AI responses only; effectively unusable
        Business: ["writing", "analysis", "team-admin"],
        Enterprise: ["writing", "analysis", "team-admin"],
    },

    // ── Midjourney ───────────────────────────────────────────────────────────
    Midjourney: {
        Basic: ["image-gen"],
        Standard: ["image-gen"],
        Pro: ["image-gen"],
        Mega: ["image-gen"],
    },
};

/**
 * General AI tools that include a capable coding assistant at certain plan tiers.
 * Used to detect "implicit coding overlap" — the most commonly missed waste pattern.
 */
const IMPLICIT_CODING_CAPABLE_PLANS: Record<string, Set<string>> = {
    Claude: new Set(["Pro", "Max", "Team Premium", "Enterprise"]),
    ChatGPT: new Set(["Plus", "Pro", "Business", "Enterprise"]),
    Gemini: new Set(["AI Pro", "AI Ultra"]),
};

/**
 * General AI tools that include image generation at certain plan tiers.
 */
const IMPLICIT_IMAGE_GEN_PLANS: Record<string, Set<string>> = {
    ChatGPT: new Set(["Plus", "Pro", "Business", "Enterprise"]),
    Gemini: new Set(["AI Ultra"]),
};

/** Returns the display name of the built-in coding agent for a given tool */
function getCodingAgentName(toolName: string): string {
    if (toolName === "Claude") return "Claude Code";
    if (toolName === "ChatGPT") return "Codex";
    if (toolName === "Gemini") return "Gemini Code Assist";
    return `${toolName} Code Assist`;
}

/** Does this tool+plan include a built-in coding assistant? */
function hasImplicitCoding(tool: AuditTool): boolean {
    return IMPLICIT_CODING_CAPABLE_PLANS[tool.name]?.has(tool.plan) ?? false;
}

/** Does this tool+plan include built-in image generation? */
function hasImplicitImageGen(tool: AuditTool): boolean {
    return IMPLICIT_IMAGE_GEN_PLANS[tool.name]?.has(tool.plan) ?? false;
}

// ─────────────────────────────────────────────────────────────────────────────
// PLAN BENCHMARKS
// Verified per-seat cost benchmarks (monthly, USD) — updated May 2026.
// ─────────────────────────────────────────────────────────────────────────────

const PLAN_SEAT_BENCHMARKS: Record<string, Record<string, number>> = {
    ChatGPT: {
        Free: 0,
        Plus: 20,
        Pro: 200,
        Business: 20,    // Renamed from "Team" April 2026; cut from $25 → $20
        Enterprise: 60,
    },
    Claude: {
        Free: 0,
        Pro: 20,
        Max: 100,
        "Team Standard": 20,
        "Team Premium": 100,
        Enterprise: 20,
    },
    Gemini: {
        Free: 0,
        "AI Plus": 8,
        "AI Pro": 20,
        "AI Ultra": 250,
        "Workspace Business": 14,
    },
    Cursor: {
        Free: 0,
        Pro: 20,
        "Pro+": 60,
        Ultra: 200,
        Teams: 40,
        Enterprise: 50,
    },
    "GitHub Copilot": {
        Free: 0,
        Pro: 10,
        "Pro+": 39,
        Business: 19,
        Enterprise: 39,
    },
    "Notion AI": {
        Free: 0,
        Plus: 10,
        Business: 20,
        Enterprise: 35,
    },
    Midjourney: {
        Basic: 10,
        Standard: 30,
        Pro: 60,
        Mega: 120,
    },
    Jasper: {
        Creator: 49,
        Pro: 69,
        Business: 125,
    },
};

/**
 * Annual discount rates vs monthly billing per vendor.
 * Used to flag teams still on monthly billing at team scale.
 */
const ANNUAL_DISCOUNT_RATE: Record<string, number> = {
    Claude: 0.20,
    ChatGPT: 0.17,
    Cursor: 0.17,
    "GitHub Copilot": 0.17,
    "Notion AI": 0.20,
    Gemini: 0.15,
    Jasper: 0.20,
};

/**
 * Plans that are personal-tier — not designed for shared team usage.
 * Used to detect when a startup is scaling individual accounts.
 */
const PERSONAL_PLANS = new Set([
    "Plus", "Pro", "Pro+", "Max", "Individual",
    "Basic", "Standard", "Creator", "Personal",
    "AI Plus", "AI Pro",
]);

/** Plans that carry enterprise pricing but require features small teams rarely need */
const ENTERPRISE_PLANS = new Set(["Enterprise"]);

/** Minimum seat count before a personal plan at team scale is worth flagging */
const TEAM_SEAT_THRESHOLD = 3;

/**
 * Writing tools that have been largely superseded by frontier general AI models.
 * These were category leaders pre-2024 but overlap heavily with Claude/ChatGPT today.
 */
const WRITING_TOOLS_SUPERSEDED_BY_GENERAL_AI = new Set([
    "Jasper", "Copy", "Copy.ai", "Writesonic", "Rytr",
]);

/**
 * Power-user dev tiers where most teams never saturate the usage limits.
 * Key: tool name. Value: config for downgrade recommendation.
 */
const OVERKILL_DEV_PLANS: Record<
    string,
    {
        plan: string;
        cheaperAlt: string;
        savingsPerSeat: number;
        rationale: string;
    }
> = {
    Cursor: {
        plan: "Ultra",
        cheaperAlt: "Pro",
        savingsPerSeat: 180,
        rationale:
            "Ultra adds 500K context and unlimited fast requests. Most devs never saturate Pro's 500 fast requests/mo. Run one billing cycle on Pro and watch the usage dashboard.",
    },
    ChatGPT: {
        plan: "Pro",
        cheaperAlt: "Plus",
        savingsPerSeat: 180,
        rationale:
            "Pro adds extended o1 thinking and higher rate limits. Unless you're running research-grade reasoning tasks daily, Plus covers typical dev and content work.",
    },
    Claude: {
        plan: "Max",
        cheaperAlt: "Pro",
        savingsPerSeat: 80,
        rationale:
            "Max is 5× the cost of Pro with higher token limits. Unless users are consistently hitting Pro's usage cap, the multiplier doesn't pay off.",
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getCategory(toolName: string): string | null {
    for (const [key, cat] of Object.entries(TOOL_CATEGORIES)) {
        if (toolName.toLowerCase().includes(key.toLowerCase())) return cat;
    }
    return null;
}

function costPerSeat(tool: AuditTool): number {
    return tool.seats > 0 ? tool.monthlyCost / tool.seats : tool.monthlyCost;
}

/**
 * Derives severity from absolute savings and share of total spend.
 * Consistent across all rules — no more hand-assigned severity.
 */
function deriveSeverity(
    savings: number,
    totalSpend: number
): "high" | "medium" | "low" {
    const pct = totalSpend > 0 ? savings / totalSpend : 0;
    if (savings >= 200 || pct >= 0.25) return "high";
    if (savings >= 75 || pct >= 0.10) return "medium";
    return "low";
}

/**
 * Checks whether a tool's use case description contains coding-related keywords.
 * Used to validate whether "coding" capability is actually being used.
 */
function indicatesCodingUseCase(useCase: string): boolean {
    const CODING_KEYWORDS = [
        "coding", "code", "dev", "engineer", "programming", "development",
        "software", "api", "terminal", "cli", "repository", "repo",
        "refactor", "debug", "deploy", "pull request", "git",
    ];
    const lower = useCase.toLowerCase();
    return CODING_KEYWORDS.some((kw) => lower.includes(kw));
}

function push(
    recs: Recommendation[],
    seenKeys: Set<string>,
    key: string,
    rec: Recommendation,
    savings: number,
    totalSavings: { value: number }
) {
    if (seenKeys.has(key)) return;
    seenKeys.add(key);
    recs.push(rec);
    totalSavings.value += savings;
}

// ─────────────────────────────────────────────────────────────────────────────
// RULE CONTEXT
// ─────────────────────────────────────────────────────────────────────────────

type RuleContext = {
    tool: AuditTool;
    allTools: AuditTool[];
    totalSpend: number;
    seenKeys: Set<string>;
};

type RuleResult = {
    key: string;
    rec: Recommendation;
    savings: number;
} | null;

// ─────────────────────────────────────────────────────────────────────────────
// ── CROSS-TOOL RULES ─────────────────────────────────────────────────────────
// Evaluated once per audit. ctx.tool is a sentinel; use ctx.allTools.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * RULE 1 — Coding assistant overlap (explicit + implicit)
 *
 * Pattern A: Two dedicated coding tools (e.g. Cursor + GitHub Copilot).
 * Pattern B: General AI plan with built-in coding + a dedicated coding tool.
 *   e.g. Claude Pro (includes Claude Code) + Cursor ($20/mo)
 *   e.g. ChatGPT Plus (includes Codex) + GitHub Copilot ($10/mo)
 * Pattern C: Both A and B simultaneously.
 *
 * Pattern B is the #1 missed waste pattern in 2026 AI stacks.
 */
function ruleCodingAssistantOverlap(ctx: RuleContext): RuleResult {
    const { allTools, totalSpend } = ctx;

    const explicitCodingTools = allTools.filter(
        (t) => getCategory(t.name) === "coding-assistant"
    );
    const implicitCodingTools = allTools.filter((t) => hasImplicitCoding(t));

    const totalCodingCapable = explicitCodingTools.length + implicitCodingTools.length;
    if (totalCodingCapable < 2) return null;

    const hasImplicit = implicitCodingTools.length > 0;
    const hasExplicit = explicitCodingTools.length > 0;

    // Pattern B / C: general AI plan already bundles a coding agent
    if (hasImplicit && hasExplicit) {
        const savings = explicitCodingTools.reduce((s, t) => s + t.monthlyCost, 0);
        const cheapestExplicit = [...explicitCodingTools].sort(
            (a, b) => a.monthlyCost - b.monthlyCost
        )[0];

        const implicitDesc = implicitCodingTools
            .map((t) => `${t.name} ${t.plan} (includes ${getCodingAgentName(t.name)})`)
            .join(", ");
        const explicitNames = explicitCodingTools.map((t) => t.name).join(" + ");

        return {
            key: "coding-overlap-implicit",
            rec: {
                tool: [...implicitCodingTools, ...explicitCodingTools]
                    .map((t) => t.name)
                    .join(" + "),
                type: "consolidate",
                issue: `Paying for ${explicitNames} when your existing AI plan already includes a coding assistant`,
                suggestion: `${implicitDesc}. Before renewing ${cheapestExplicit.name}, run a 2-week trial using only the built-in agent. Most teams find 80–90% overlap with daily workflows at zero extra cost. Dropping the standalone tool saves ~$${savings}/mo.`,
                estimatedSavings: savings,
                severity: deriveSeverity(savings, totalSpend),
                confidence: 0.90,
            },
            savings,
        };
    }

    // Pattern A: two or more dedicated coding tools only
    if (explicitCodingTools.length >= 2) {
        const sorted = [...explicitCodingTools].sort(
            (a, b) => a.monthlyCost - b.monthlyCost
        );
        const savings = sorted[0].monthlyCost;

        return {
            key: "coding-overlap-explicit",
            rec: {
                tool: explicitCodingTools.map((t) => t.name).join(" + "),
                type: "cut",
                issue: `${explicitCodingTools.length} dedicated coding assistants — significant feature overlap`,
                suggestion: `Survey your devs: "If you could only keep one, which would it be?" Cancel the other. Saves ~$${savings}/mo.`,
                estimatedSavings: savings,
                severity: deriveSeverity(savings, totalSpend),
                confidence: 0.95,
            },
            savings,
        };
    }

    return null;
}

/**
 * RULE 2 — Multiple general-purpose AI chat tools
 * Running ChatGPT + Claude + Gemini simultaneously at paid tier is redundant
 * for most teams. Each has distinct strengths but 80%+ of daily tasks are
 * handled equally well by any one of them.
 */
function ruleGeneralAIOverlap(ctx: RuleContext): RuleResult {
    const { allTools, totalSpend } = ctx;
    const aiTools = allTools.filter((t) => getCategory(t.name) === "general-ai");
    if (aiTools.length < 2) return null;

    const sorted = [...aiTools].sort((a, b) => b.monthlyCost - a.monthlyCost);
    const toRemove = sorted.slice(1);
    const savings = toRemove.reduce((s, t) => s + t.monthlyCost, 0);

    return {
        key: "general-ai-overlap",
        rec: {
            tool: aiTools.map((t) => t.name).join(" + "),
            type: "consolidate",
            issue: `${aiTools.length} general-purpose AI assistants running simultaneously`,
            suggestion: `Run a 2-week team poll: "Which tool would you keep if you could only keep one?" Cancel the rest. Most teams consolidate without noticing a gap. Potential savings: $${savings}/mo.`,
            estimatedSavings: savings,
            severity: deriveSeverity(savings, totalSpend),
            confidence: 0.80,
        },
        savings,
    };
}

/**
 * RULE 3 — Cursor + GitHub Copilot direct conflict
 * Cursor is a VS Code fork with its own AI completion layer. GitHub Copilot
 * is a VS Code / JetBrains extension. For any developer using Cursor as their
 * primary IDE, the Copilot license is structurally redundant — they're paying
 * for two inline-completion engines that compete inside the same editor.
 */
function ruleGitHubCopilotCursorConflict(ctx: RuleContext): RuleResult {
    const { allTools, totalSpend } = ctx;

    const cursor = allTools.find((t) => t.name === "Cursor");
    const copilot = allTools.find((t) => t.name === "GitHub Copilot");
    if (!cursor || !copilot) return null;

    const savings = copilot.monthlyCost;

    return {
        key: "cursor-copilot-conflict",
        rec: {
            tool: "Cursor + GitHub Copilot",
            type: "cut",
            issue: `Cursor already replaces GitHub Copilot's inline completions for any developer using Cursor as their primary IDE`,
            suggestion: `Audit which devs use Cursor as their main editor. Remove their Copilot seats — they get zero additional value from it. For devs still on VS Code or JetBrains, keep Copilot. Targeted seat reduction saves ~$${savings}/mo.`,
            estimatedSavings: savings,
            severity: deriveSeverity(savings, totalSpend),
            confidence: 1.0,
        },
        savings,
    };
}

/**
 * RULE 4 — Multiple image generation tools
 * Midjourney + DALL-E + Adobe Firefly is almost always redundant for a startup.
 * Each has a distinct use case niche; teams rarely need all three.
 */
function ruleImageGenOverlap(ctx: RuleContext): RuleResult {
    const { allTools, totalSpend } = ctx;
    const imgTools = allTools.filter((t) => getCategory(t.name) === "image-generation");
    if (imgTools.length < 2) return null;

    const sorted = [...imgTools].sort((a, b) => a.monthlyCost - b.monthlyCost);
    const savings = sorted.slice(1).reduce((s, t) => s + t.monthlyCost, 0);

    return {
        key: "image-gen-overlap",
        rec: {
            tool: imgTools.map((t) => t.name).join(" + "),
            type: "consolidate",
            issue: `${imgTools.length} image generation tools — significant overlap`,
            suggestion: `Pick one based on primary use: Midjourney for artistic/brand quality, DALL-E for API integration inside your product, Firefly for Adobe-ecosystem users. Drop the others and save ~$${savings}/mo.`,
            estimatedSavings: savings,
            severity: deriveSeverity(savings, totalSpend),
            confidence: 0.85,
        },
        savings,
    };
}

/**
 * RULE 5 — Implicit image gen overlap
 * ChatGPT Plus and above include DALL-E. Gemini AI Ultra includes image gen.
 * Teams paying separately for Midjourney/Firefly/Leonardo on top of these
 * plans are running duplicate image generation without realising it.
 */
function ruleImplicitImageGenOverlap(ctx: RuleContext): RuleResult {
    const { allTools, totalSpend } = ctx;

    const implicitSource = allTools.find((t) => hasImplicitImageGen(t));
    if (!implicitSource) return null;

    const explicitImageTools = allTools.filter(
        (t) => getCategory(t.name) === "image-generation"
    );
    if (explicitImageTools.length === 0) return null;

    const savings = explicitImageTools.reduce((s, t) => s + t.monthlyCost, 0);

    return {
        key: "implicit-image-gen-overlap",
        rec: {
            tool: `${implicitSource.name} + ${explicitImageTools.map((t) => t.name).join("/")}`,
            type: "consolidate",
            issue: `${implicitSource.name} ${implicitSource.plan} includes image generation (DALL-E), making ${explicitImageTools.map((t) => t.name).join("/")} potentially redundant`,
            suggestion: `Run a 30-day trial using only the built-in image generation. If quality gap justifies the extra cost for brand/campaign work, keep it. For internal docs and ad hoc images, it's redundant. Potential savings: $${savings}/mo.`,
            estimatedSavings: savings,
            severity: deriveSeverity(savings, totalSpend),
            confidence: 0.75,
        },
        savings,
    };
}

/**
 * RULE 6 — Multiple writing assistants
 * Notion AI + Jasper + Grammarly often cover the same writing jobs.
 * Teams that onboarded writing tools pre-2024 rarely audit for overlap.
 */
function ruleWritingAssistantOverlap(ctx: RuleContext): RuleResult {
    const { allTools, totalSpend } = ctx;
    const writingTools = allTools.filter((t) => getCategory(t.name) === "writing-assistant");
    if (writingTools.length < 2) return null;

    const sorted = [...writingTools].sort((a, b) => a.monthlyCost - b.monthlyCost);
    const savings = sorted[0].monthlyCost;

    return {
        key: "writing-overlap",
        rec: {
            tool: writingTools.map((t) => t.name).join(" + "),
            type: "consolidate",
            issue: `${writingTools.length} writing assistant tools with overlapping capabilities`,
            suggestion: `If Notion AI (Business) is in your stack, it covers most writing and analysis needs — standalone writing tools are redundant for most teams. Drop the lowest-used one and save ~$${savings}/mo.`,
            estimatedSavings: savings,
            severity: deriveSeverity(savings, totalSpend),
            confidence: 0.80,
        },
        savings,
    };
}

/**
 * RULE 7 — Writing tool superseded by frontier general AI
 * Jasper, Copy.ai, Writesonic, and Rytr were category leaders pre-2024.
 * Teams running these alongside a paid Claude or ChatGPT plan are almost
 * certainly paying for heavily overlapping capability. This is the most
 * common "legacy subscription zombie" pattern in startup AI stacks.
 */
function ruleWritingToolSupersededByGeneralAI(ctx: RuleContext): RuleResult {
    const { allTools, totalSpend } = ctx;

    const hasStrongGeneralAI = allTools.some(
        (t) =>
            ["Claude", "ChatGPT", "Gemini"].includes(t.name) &&
            !["Free", "AI Plus"].includes(t.plan)
    );
    if (!hasStrongGeneralAI) return null;

    const supersededTools = allTools.filter((t) =>
        WRITING_TOOLS_SUPERSEDED_BY_GENERAL_AI.has(t.name)
    );
    if (supersededTools.length === 0) return null;

    const savings = supersededTools.reduce((s, t) => s + t.monthlyCost, 0);
    const names = supersededTools.map((t) => t.name).join("/");

    return {
        key: "writing-tool-superseded",
        rec: {
            tool: names,
            type: "cut",
            issue: `${names} running alongside a paid Claude/ChatGPT plan — largely feature-redundant since frontier AI models reached current capability levels`,
            suggestion: `Have your content team complete their normal work using only the general AI tool for 2 weeks. Most teams find 90%+ overlap. Dropping saves ~$${savings}/mo. If specific ${names} templates or workflows are critical, document them first — they can be rebuilt as Claude/ChatGPT prompts.`,
            estimatedSavings: savings,
            severity: deriveSeverity(savings, totalSpend),
            confidence: 0.75,
        },
        savings,
    };
}

/**
 * RULE 8 — AI spend health check (sprawl signal)
 * 4+ tools with a high average cost per tool signals unmanaged AI sprawl.
 * No single tool to blame — the portfolio itself is the problem.
 */
function ruleAISpendHealthCheck(ctx: RuleContext): RuleResult {
    const { allTools, totalSpend } = ctx;
    if (allTools.length < 4 || totalSpend < 500) return null;

    const avgPerTool = totalSpend / allTools.length;
    if (avgPerTool < 80) return null;

    const savings = Math.round(totalSpend * 0.2);

    return {
        key: "ai-spend-health",
        rec: {
            tool: "Overall AI Stack",
            type: "audit",
            issue: `$${totalSpend}/mo across ${allTools.length} AI tools — high average cost per tool ($${Math.round(avgPerTool)}) signals unreviewed sprawl`,
            suggestion: `Run a quarterly AI tool ROI review. For each tool, ask: "What would break if we cancelled this tomorrow?" Tools with vague answers are cancellation candidates. Set a standing rule: any tool unused by ≥80% of licensed seats for 30 days gets cancelled automatically.`,
            estimatedSavings: savings,
            severity: deriveSeverity(savings, totalSpend),
            confidence: 0.65,
        },
        savings,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// ── PER-TOOL RULES ────────────────────────────────────────────────────────────
// Evaluated once per tool in the stack.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * RULE 9 — Personal plan used at team scale
 * e.g. 8× Claude Pro ($20/ea) instead of Team Standard ($20/seat with SSO + admin).
 * Beyond the cost issue, personal plans lack admin controls, audit logs, and SSO —
 * which creates compliance risk as the team grows.
 */
function rulePersonalPlanAtTeamScale(ctx: RuleContext): RuleResult {
    const { tool, totalSpend } = ctx;
    if (!PERSONAL_PLANS.has(tool.plan) || tool.seats < TEAM_SEAT_THRESHOLD) return null;

    // Rough savings: team plans are typically $5–8/seat cheaper + reduce admin overhead
    const savings = Math.round(tool.seats * 7);

    return {
        key: `personal-plan-team-scale-${tool.name}`,
        rec: {
            tool: tool.name,
            type: "downgrade",
            issue: `Personal-tier plan (${tool.plan}) used across ${tool.seats} seats — missing SSO, centralized billing, and admin controls`,
            suggestion: `Switch to a Team or Business plan. Beyond cost, team plans add centralized billing, SSO, usage analytics, and audit logs — reducing compliance risk as you scale. Estimated savings: ~$${savings}/mo.`,
            estimatedSavings: savings,
            severity: deriveSeverity(savings, totalSpend),
            confidence: 0.85,
        },
        savings,
    };
}

/**
 * RULE 10 — Team plan for a very small team
 * e.g. ChatGPT Business at 2 seats — ChatGPT Plus is functionally equivalent
 * and costs less. Enterprise minimums (often 50–150 seats) make this worse.
 */
function ruleExpensivePlanForSmallTeam(ctx: RuleContext): RuleResult {
    const { tool, totalSpend } = ctx;
    const isTeamPlan = [
        "Team", "Team Standard", "Team Premium", "Business", "Teams",
    ].includes(tool.plan);
    if (!isTeamPlan || tool.seats > 3) return null;

    const savings = Math.round(tool.monthlyCost * 0.3);

    return {
        key: `team-plan-small-${tool.name}`,
        rec: {
            tool: tool.name,
            type: "downgrade",
            issue: `Team plan for only ${tool.seats} seat${tool.seats > 1 ? "s" : ""} — likely over-provisioned for this team size`,
            suggestion: `For ${tool.seats} user${tool.seats > 1 ? "s" : ""}, individual Pro/Plus plans are often cheaper and functionally equivalent. Calculate: ${tool.seats} × (individual plan price) vs current $${tool.monthlyCost}/mo before next renewal.`,
            estimatedSavings: savings,
            severity: deriveSeverity(savings, totalSpend),
            confidence: 0.80,
        },
        savings,
    };
}

/**
 * RULE 11 — Too many seats relative to active usage
 * Heuristic: if actual cost/seat is significantly below the published benchmark,
 * the account has likely grown seats beyond active users (e.g. onboarded 20,
 * 5 left, seats were never reclaimed).
 */
function ruleExcessSeats(ctx: RuleContext): RuleResult {
    const { tool, totalSpend } = ctx;
    if (tool.seats <= 5) return null;

    const benchmark = PLAN_SEAT_BENCHMARKS[tool.name]?.[tool.plan];
    if (!benchmark || benchmark === 0) return null;

    const actualPerSeat = costPerSeat(tool);
    // If actual per-seat is < 75% of benchmark, something doesn't add up — likely excess seats
    if (actualPerSeat >= benchmark * 0.75) return null;

    const excessSeats = Math.floor(tool.seats * 0.25);
    const savings = Math.round(excessSeats * benchmark);

    return {
        key: `excess-seats-${tool.name}`,
        rec: {
            tool: tool.name,
            type: "audit",
            issue: `${tool.seats} seats at $${actualPerSeat.toFixed(0)}/seat vs expected $${benchmark}/seat — gap suggests unused licenses`,
            suggestion: `Pull the admin dashboard and filter by last-active date. Remove any seat unused in the last 30 days. At ${tool.seats} seats, a 25% reduction saves ~$${savings}/mo. Set a recurring monthly reminder to audit seat count.`,
            estimatedSavings: savings,
            severity: deriveSeverity(savings, totalSpend),
            confidence: 0.75,
        },
        savings,
    };
}

/**
 * RULE 12 — High spend concentration in a single tool
 * One tool consuming >50% of total AI budget is both a concentration risk
 * and the single best negotiation or cancellation lever.
 */
function ruleSpendConcentration(ctx: RuleContext): RuleResult {
    const { tool, totalSpend } = ctx;
    if (totalSpend === 0) return null;

    const pct = (tool.monthlyCost / totalSpend) * 100;
    if (pct < 50) return null;

    const savings = Math.round(tool.monthlyCost * 0.15);

    return {
        key: `spend-concentration-${tool.name}`,
        rec: {
            tool: tool.name,
            type: "negotiate",
            issue: `${Math.round(pct)}% of total AI spend concentrated in a single tool`,
            suggestion: `${tool.name} is your biggest AI cost lever. High spend = strong negotiating position — push for a 15–20% annual-contract discount, especially at renewal. If utilisation is unclear, pull admin usage reports first; low utilisation makes it your top cancellation candidate instead.`,
            estimatedSavings: savings,
            severity: deriveSeverity(savings, totalSpend),
            confidence: 0.70,
        },
        savings,
    };
}

/**
 * RULE 13 — Enterprise plan without clear enterprise need
 * Small teams on Enterprise tier almost always overpay for features they
 * don't use: SCIM provisioning, audit logs, data residency, 150-seat minimums.
 * Enterprise pricing is designed for orgs 50–500+ seats.
 */
function ruleEnterprisePlanOverkill(ctx: RuleContext): RuleResult {
    const { tool, totalSpend } = ctx;
    if (!ENTERPRISE_PLANS.has(tool.plan) || tool.seats > 20) return null;

    const savings = Math.round(tool.monthlyCost * 0.35);

    return {
        key: `enterprise-overkill-${tool.name}`,
        rec: {
            tool: tool.name,
            type: "downgrade",
            issue: `Enterprise plan for ${tool.seats} seats — enterprise pricing targets 50–150+ seat orgs`,
            suggestion: `Unless you have a hard compliance requirement for SSO, SCIM, audit logs, or data residency, a Business or Team plan is equivalent for your size. Downgrading saves ~35%, roughly $${savings}/mo. Review at next renewal.`,
            estimatedSavings: savings,
            severity: deriveSeverity(savings, totalSpend),
            confidence: 0.80,
        },
        savings,
    };
}

/**
 * RULE 14 — Plan includes unused coding capability
 * The flip side of Rule 1. Teams on Claude Team Premium ($100/seat) or
 * ChatGPT Pro ($200/mo) who aren't using the bundled coding tools are
 * paying a significant premium for capability they ignore.
 *
 * Claude Team Premium is priced for engineering teams that need Claude Code.
 * Non-technical teams using Claude for writing/analysis should be on
 * Team Standard ($20/seat) — 5× cheaper, functionally identical for them.
 */
function rulePlanIncludesUnusedCodingCapability(ctx: RuleContext): RuleResult {
    const { tool, totalSpend } = ctx;

    const HIGH_COST_CODING_PLANS: Record<
        string,
        { codingPlan: string; cheaperAlt: string; savingsPerSeat: number }
    > = {
        Claude: {
            codingPlan: "Team Premium",
            cheaperAlt: "Team Standard",
            savingsPerSeat: 80,
        },
        ChatGPT: {
            codingPlan: "Pro",
            cheaperAlt: "Plus",
            savingsPerSeat: 180,
        },
    };

    const config = HIGH_COST_CODING_PLANS[tool.name];
    if (!config || tool.plan !== config.codingPlan) return null;

    if (indicatesCodingUseCase(tool.useCase)) return null; // Using it correctly

    const agentName = getCodingAgentName(tool.name);
    const totalSavings = Math.round(config.savingsPerSeat * Math.max(tool.seats, 1));

    return {
        key: `unused-coding-capability-${tool.name}`,
        rec: {
            tool: tool.name,
            type: "downgrade",
            issue: `${tool.plan} plan includes ${agentName} but use case doesn't indicate development work`,
            suggestion: `${tool.name} ${tool.plan} is priced for engineering teams that need ${agentName}. If your team uses ${tool.name} for writing, analysis, or general chat, downgrade to ${config.cheaperAlt} — saves ~$${config.savingsPerSeat}/seat/mo (~$${totalSavings}/mo across ${tool.seats} seat${tool.seats > 1 ? "s" : ""}).`,
            estimatedSavings: totalSavings,
            severity: deriveSeverity(totalSavings, totalSpend),
            confidence: 0.80,
        },
        savings: totalSavings,
    };
}

/**
 * RULE 15 — Monthly billing at team scale
 * Annual plans are typically 17–20% cheaper. Teams that started on monthly
 * billing and never switched are silently paying a recurring premium.
 * Most SaaS vendors allow mid-cycle conversion to annual.
 *
 * Requires: billingCycle field on AuditTool (optional, defaults to "unknown")
 */
function ruleMonthlyBillingAtTeamScale(ctx: RuleContext): RuleResult {
    const { tool, totalSpend } = ctx;
    const billingCycle = tool.billingCycle as string | undefined;
    if (billingCycle !== "monthly") return null;
    if (tool.seats < 3) return null;

    const discountRate = ANNUAL_DISCOUNT_RATE[tool.name] ?? 0.17;
    const savings = Math.round(tool.monthlyCost * discountRate);
    if (savings < 20) return null; // Not worth flagging for tiny amounts

    return {
        key: `monthly-billing-${tool.name}`,
        rec: {
            tool: tool.name,
            type: "negotiate",
            issue: `Monthly billing at ${tool.seats} seats — annual plans are ${Math.round(discountRate * 100)}% cheaper`,
            suggestion: `Switching ${tool.name} to annual billing saves ~$${savings}/mo ($${savings * 12}/yr). Most vendors allow mid-cycle annual upgrades — check the admin dashboard or email your account rep. One conversation, ~15 minutes, $${savings * 12}/yr saved.`,
            estimatedSavings: savings,
            severity: deriveSeverity(savings, totalSpend),
            confidence: 0.90,
        },
        savings,
    };
}

/**
 * RULE 16 — Free tier at team scale (productivity tax)
 * Teams running 5+ people on Free plans of ChatGPT/Claude/Gemini are hitting
 * rate limits, sharing credentials, or working with degraded context windows.
 * The real cost is invisible productivity loss, not subscription spend.
 *
 * Note: estimatedSavings = 0 because this is an upgrade rec, not a cut.
 * The UI should render this as an "opportunity" card, not a "waste" card.
 */
function ruleFreeToolsAtTeamScale(ctx: RuleContext): RuleResult {
    const { tool } = ctx;
    if (tool.plan !== "Free" || tool.seats < 5) return null;

    // Only flag if a paid plan exists and is reasonably priced
    const paidBenchmark = PLAN_SEAT_BENCHMARKS[tool.name]?.["Plus"] ?? 20;
    const upgradeCost = tool.seats * paidBenchmark;

    return {
        key: `free-at-scale-${tool.name}`,
        rec: {
            tool: tool.name,
            type: "upgrade",
            issue: `${tool.seats} users on Free tier — rate limits and context degradation are likely costing more in lost time than a paid plan`,
            suggestion: `Upgrading ${tool.seats} seats to a paid plan costs ~$${upgradeCost}/mo. Free tiers at this scale typically cause 1–2hr/week per person in workarounds and retries. Run a 2-week paid pilot on 2 power users and measure output delta before committing.`,
            estimatedSavings: 0, // Upgrade rec — flagged differently in UI
            severity: "medium",
            confidence: 0.55,
        },
        savings: 0,
    };
}

/**
 * RULE 17 — Developer tool power-tier overkill
 * Cursor Ultra ($200/seat), ChatGPT Pro ($200/mo), and Claude Max ($100/mo)
 * are power-user tiers whose limits most teams never come close to saturating.
 * The vast majority get equivalent value from the tier one step below.
 */
function ruleDeveloperToolOverkill(ctx: RuleContext): RuleResult {
    const { tool, totalSpend } = ctx;
    const config = OVERKILL_DEV_PLANS[tool.name];
    if (!config || tool.plan !== config.plan) return null;

    const totalSavings = Math.round(config.savingsPerSeat * Math.max(tool.seats, 1));

    return {
        key: `dev-overkill-${tool.name}`,
        rec: {
            tool: tool.name,
            type: "downgrade",
            issue: `${tool.name} ${tool.plan} — power tier with usage limits most teams never reach`,
            suggestion: `${config.rationale} Downgrade to ${config.cheaperAlt} for one billing cycle and watch the admin usage dashboard. If no one hits limits, stay on ${config.cheaperAlt} permanently. Saves ~$${totalSavings}/mo.`,
            estimatedSavings: totalSavings,
            severity: deriveSeverity(totalSavings, totalSpend),
            confidence: 0.70,
        },
        savings: totalSavings,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// RULE REGISTRY
// Cross-tool rules run first (highest value, multi-tool insights).
// Per-tool rules run once per tool.
// Add new rules here — order determines display priority within same severity.
// ─────────────────────────────────────────────────────────────────────────────

const CROSS_TOOL_RULES: Array<(ctx: RuleContext) => RuleResult> = [
    ruleCodingAssistantOverlap,          // Rule 1  — implicit + explicit coding overlap
    ruleGitHubCopilotCursorConflict,     // Rule 3  — structural IDE conflict
    ruleGeneralAIOverlap,                // Rule 2  — multiple general AI tools
    ruleImageGenOverlap,                 // Rule 4  — multiple image gen tools
    ruleImplicitImageGenOverlap,         // Rule 5  — image gen already bundled
    ruleWritingAssistantOverlap,         // Rule 6  — multiple writing tools
    ruleWritingToolSupersededByGeneralAI,// Rule 7  — legacy writing tools
    ruleAISpendHealthCheck,              // Rule 8  — portfolio sprawl signal
];

const PER_TOOL_RULES: Array<(ctx: RuleContext) => RuleResult> = [
    ruleEnterprisePlanOverkill,          // Rule 13 — enterprise for small team (highest priority)
    rulePlanIncludesUnusedCodingCapability, // Rule 14 — paying for coding capability unused
    ruleDeveloperToolOverkill,           // Rule 17 — power tier overkill
    rulePersonalPlanAtTeamScale,         // Rule 9  — personal plan at team scale
    ruleExpensivePlanForSmallTeam,       // Rule 10 — team plan for tiny team
    ruleExcessSeats,                     // Rule 11 — too many seats
    ruleSpendConcentration,              // Rule 12 — spend concentration
    ruleMonthlyBillingAtTeamScale,       // Rule 15 — monthly billing penalty
    ruleFreeToolsAtTeamScale,            // Rule 16 — free tier productivity tax
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN AUDIT RUNNER
// ─────────────────────────────────────────────────────────────────────────────

export function runAudit(tools: AuditTool[]): AuditResult {
    if (!tools.length) {
        return {
            totalMonthlySpend: 0,
            potentialMonthlySavings: 0,
            potentialYearlySavings: 0,
            recommendations: [],
        };
    }

    const recommendations: Recommendation[] = [];
    const seenKeys = new Set<string>();
    const totalSavings = { value: 0 };

    const totalMonthlySpend = tools.reduce((s, t) => s + t.monthlyCost, 0);

    function applyRule(result: RuleResult) {
        if (!result) return;
        push(
            recommendations,
            seenKeys,
            result.key,
            result.rec,
            result.savings,
            totalSavings
        );
    }

    // Cross-tool rules — use a sentinel so rules never accidentally read ctx.tool
    const sentinel: AuditTool = {
        name: "__cross_tool__",
        plan: "",
        monthlyCost: 0,
        seats: 0,
        useCase: "",
    };

    for (const rule of CROSS_TOOL_RULES) {
        applyRule(
            rule({
                tool: sentinel,
                allTools: tools,
                totalSpend: totalMonthlySpend,
                seenKeys,
            })
        );
    }

    // Per-tool rules
    for (const tool of tools) {
        const ctx: RuleContext = {
            tool,
            allTools: tools,
            totalSpend: totalMonthlySpend,
            seenKeys,
        };
        for (const rule of PER_TOOL_RULES) {
            applyRule(rule(ctx));
        }
    }

    // Sort: high severity first, then by savings descending, then by confidence descending
    const severityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    recommendations.sort((a, b) => {
        const sev = (severityOrder[a.severity] ?? 2) - (severityOrder[b.severity] ?? 2);
        if (sev !== 0) return sev;
        const savingsDiff = b.estimatedSavings - a.estimatedSavings;
        if (savingsDiff !== 0) return savingsDiff;
        return (b.confidence ?? 0) - (a.confidence ?? 0);
    });

    // Only count non-upgrade recs toward potential savings (upgrade recs have savings=0 by design)
    return {
        totalMonthlySpend,
        potentialMonthlySavings: totalSavings.value,
        potentialYearlySavings: totalSavings.value * 12,
        recommendations,
    };
}