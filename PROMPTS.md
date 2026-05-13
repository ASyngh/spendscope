# PROMPTS.md

SpendScope uses Groq with the `llama-3.3-70b-versatile` model for semantic use-case analysis and recommendation enrichment.

The actual audit logic and savings calculations are intentionally deterministic and rule-based.

This architectural split was deliberate:
- financial calculations should remain deterministic and explainable
- LLMs are better suited for interpretation, summarization, and human-readable communication
- reducing hallucination risk was prioritised over making the entire audit AI-generated

The Groq layer improves:
- semantic understanding
- recommendation clarity
- founder-facing tone
- stack-level reasoning

The Groq layer does NOT:
- calculate savings
- invent pricing
- decide raw audit math
- override deterministic audit rules

---

# Model Used

- Provider: Groq
- Model: `llama-3.3-70b-versatile`

Reasons for choosing Groq:
- low latency
- generous free-tier limits during MVP development
- OpenAI-compatible API shape
- fast enough for near-instant audit generation
- reliable structured JSON responses at low temperature

---

# System Prompt Strategy

Every structured-output call uses a strict system prompt:

```txt
You are a precise JSON-only responder. Never include markdown, code fences, or any text outside the JSON object.
```

This was added because earlier iterations occasionally returned:
- markdown code fences
- conversational filler
- malformed JSON

The strict JSON-only constraint significantly improved:
- parser reliability
- deterministic UI rendering
- fallback handling

---

# Semantic Stack Analysis

SpendScope first performs a semantic analysis pass before running the deterministic rules engine.

Instead of relying on keyword matching, the model interprets use-case descriptions semantically.

Examples:
- "everything except image generation"
- "mostly coding and documentation"
- "marketing copy with occasional analytics"
- "research-heavy workflow"

These are converted into structured capability flags.

Example structure:

```json
{
  "usesCoding": true,
  "usesImageGen": false,
  "usesWriting": true,
  "usesAnalysis": true,
  "usesChat": true
}
```

This allows the rules engine to:
- reduce false positives
- understand complementary tool usage
- avoid flagging intentional workflows as redundant
- reason across multiple overlapping tools

---

# Full Stack Analysis Prompt

```txt
You are a startup CFO's AI spend advisor analyzing a company's AI tool stack.

Here is their current stack with use case descriptions:
{toolDescriptions}

Your job:
1. For each tool, determine what capabilities the team actually uses based on their description.
2. Interpret descriptions semantically.
3. Assess whether the overall stack is well-optimised.
4. Determine whether tools are complementary or redundant.

A stack where ChatGPT is used for image generation and Claude is used for writing/research is deliberate and well-optimised, not redundant.

Respond with ONLY a JSON object.
No markdown.
No explanation.
```

Temperature:
- `0`

Reasoning:
- deterministic structured output
- stable capability extraction
- reduced hallucination risk

---

# Single Tool Capability Analysis

For some flows, SpendScope analyzes a single tool independently.

This prompt extracts capability flags from a single use-case description.

Example prompt:

```txt
You are analyzing how a startup uses an AI tool subscription.

Tool: Claude Team
Use case description:
"mostly writing investor updates and long-form strategy docs"

Determine what capabilities are actually used.

Respond with ONLY a JSON object:
{
  "usesCoding": boolean,
  "usesImageGen": boolean,
  "usesWriting": boolean,
  "usesAnalysis": boolean,
  "usesChat": boolean,
  "summary": "one sentence"
}
```

Fallback behaviour:
- if parsing fails, conservative assumptions are used
- all capabilities default to true
- avoids underestimating tool utility

This intentionally biases toward:
- fewer false-positive cuts
- safer recommendations

---

# Recommendation Enrichment

After the deterministic rules engine generates findings, Groq rewrites recommendations into founder-readable language.

The LLM does not generate the recommendations themselves.

It only improves:
- readability
- tone
- contextual specificity
- operational clarity

Inputs include:
- current stack
- plans
- seat counts
- costs
- rule-engine findings
- savings estimates

---

# Recommendation Enrichment Prompt

```txt
You are a blunt, senior CFO advisor writing spend recommendations for a startup founder who is not technical.

THEIR CURRENT AI STACK:
{stackContext}

FINDINGS TO REWRITE:
{recommendations}

Rewrite the "suggestion" field for each finding.

Requirements:
- Sound like a CFO talking directly to a founder
- Be direct and operational
- 2-3 sentences max
- No filler
- No generic SaaS language
- Reference exact tools, plans, seats, and savings
- Explain exactly what action to take
- Never repeat the issue text

Respond with ONLY a valid JSON array.
```

Temperature:
- `0.3`

Reasoning:
- low enough for consistency
- high enough for natural phrasing

---

# Tone Design Decisions

The prompt tone intentionally avoids:
- hype
- growth-hacker language
- exaggerated savings claims
- “AI magic” wording

The desired tone was:
- analytical
- financially responsible
- founder-friendly
- calm
- operational

The goal was to make SpendScope feel closer to:
- a CFO advisor
- infrastructure consultant
- procurement analyst

rather than:
- a flashy AI tool
- marketing software
- generic chatbot

---

# Prompt Iterations That Failed

## 1. Fully AI-generated audit reasoning

Early prototypes allowed the LLM to:
- determine savings
- suggest plan downgrades
- infer pricing

Problems:
- hallucinated vendor pricing
- inconsistent calculations
- contradictory recommendations
- unstable outputs

The approach was abandoned.

Final decision:
- deterministic audit logic
- AI only for interpretation + communication

---

## 2. Keyword-based use-case matching

Initial versions used keyword detection:

Examples:
- "code"
- "writing"
- "image"

Problems:
- poor semantic understanding
- false positives
- brittle edge cases
- failed on natural language descriptions

Examples that failed:
- "everything except image gen"
- "mostly engineering but some docs"
- "heavy product brainstorming"

This was replaced with semantic capability extraction.

---

## 3. Aggressive consultant tone

Earlier prompts used wording such as:
- "dramatically reduce spend"
- "massively inefficient stack"
- "huge savings opportunity"

This reduced trustworthiness.

The tone was revised toward:
- restrained
- evidence-driven
- financially literate

---

## 4. Long-form summaries

Initial outputs were 200-300 words.

Problems:
- visually heavy UI
- poor screenshotability
- users skimmed them
- key savings were buried

The final implementation constrained summaries to concise operational language.

---

# Reliability and Failure Handling

SpendScope includes defensive fallback behaviour for:
- API failures
- malformed JSON
- rate limits
- timeouts
- network failures

Fallback strategy:
- deterministic audit still executes
- original rule-engine recommendations remain visible
- enrichment layer gracefully degrades
- no broken UI state

This ensures:
- audits remain usable without the LLM layer
- savings calculations never depend on AI availability

---

# Security Considerations

- API keys stored in environment variables
- no user emails injected into prompts
- public share pages strip identifying details
- LLM output treated as presentation-layer enrichment only
- deterministic audit engine remains source-of-truth

---

# Why AI Was Limited Deliberately

A major architectural decision in SpendScope was intentionally limiting AI scope.

The assignment specifically evaluates:
- knowing when to use AI
- knowing when not to use AI

Financial audit logic benefits from:
- explainability
- consistency
- deterministic reasoning

LLMs benefit:
- interpretation
- semantic understanding
- human communication

SpendScope therefore uses both:
- deterministic systems for correctness
- AI systems for usability