export const AI_TOOLS = [
    {
        name: "ChatGPT",
        category: "general-ai",
        useCases: ["writing", "reasoning","brainstorming"],
        plans: [
            {
                name: "Plus",
                monthlyPrice: 20,
            },
            {
                name: "Team",
                monthlyPrice: 30,
            },
        ],
        alternatives: ["Claude", "Gemini"],
    },

    {
        name: "Claude",
        category: "general-ai",
        useCases: ["writing", "reasoning","brainstorming"],
        plans: [
            {
                name: "Pro",
                monthlyPrice: 17,
            },
            {
                name: "Max 5x",
                monthlyPrice: 100,
            },
            {
                name: "Max 20x",
                monthlyPrice: 200,
            },
        ],
        alternatives: ["ChatGPT", "Gemini"],
    },

    {
        name: "Gemini",
        category: "general-ai",
        useCases: ["writing", "reasoning","brainstorming"],
        plans: [
            {
                name: "Plus",
                monthlyPrice: 4.78,
            },
            {
                name: "Pro",
                monthlyPrice: 23.35,
            },
            {
                name: "Ultra",
                monthlyPrice: 293.40,
            },
        ],
        alternatives: ["ChatGPT", "Gemini"],
    },

    {
        name: "Cursor",
        category: "developer-tools",
        plans: [
            {
                name: "Pro",
                monthlyPrice: 20,
            },
        ],
        alternatives: ["GitHub Copilot"],
    },

    {
        name: "GitHub Copilot",
        category: "developer-tools",
        plans: [
            {
                name: "Individual",
                monthlyPrice: 10,
            },
        ],
        alternatives: ["Cursor"],
    },

];