// Centralized pricing source. Bump _version whenever any price changes.
// detect-changes compares stored snapshot _version vs this to find stale audits.

export const PRICING = {
    _version: "2025-05-19",

    // Per-seat monthly benchmarks — mirrors PLAN_SEAT_BENCHMARKS in audit-engine
    benchmarks: {
        ChatGPT: { Free: 0, Plus: 20, Pro: 200, Business: 20, Enterprise: 60 },
        Claude:  { Free: 0, Pro: 20, Max: 100, "Team Standard": 20, "Team Premium": 100, Enterprise: 20 },
        Gemini:  { Free: 0, "AI Plus": 8, "AI Pro": 20, "AI Ultra": 250, "Workspace Business": 14 },
        Cursor:  { Free: 0, Pro: 20, "Pro+": 60, Ultra: 200, Teams: 40, Enterprise: 50 },
        "GitHub Copilot": { Free: 0, Pro: 10, "Pro+": 39, Business: 19, Enterprise: 39 },
        "Notion AI": { Free: 0, Plus: 10, Business: 20, Enterprise: 35 },
        Midjourney: { Basic: 10, Standard: 30, Pro: 60, Mega: 120 },
        Jasper: { Creator: 49, Pro: 69, Business: 125 },
    },

    annualDiscountRates: {
        Claude: 0.20,
        ChatGPT: 0.17,
        Cursor: 0.17,
        "GitHub Copilot": 0.17,
        "Notion AI": 0.20,
        Gemini: 0.15,
        Jasper: 0.20,
    },

    overkillPlans: {
        Cursor:  { plan: "Ultra",  cheaperAlt: "Pro",  savingsPerSeat: 180 },
        ChatGPT: { plan: "Pro",    cheaperAlt: "Plus", savingsPerSeat: 180 },
        Claude:  { plan: "Max",    cheaperAlt: "Pro",  savingsPerSeat: 80  },
    },
} as const;

export type PricingSnapshot = typeof PRICING;