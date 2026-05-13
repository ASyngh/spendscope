# DEVLOG — SpendScope

Daily engineering log for the Credex Web Dev Intern Assignment.
Format: `## YYYY-MM-DD — <what changed>`

---

## 2026-05-07 — Project bootstrap & type system

Initialized Next.js 15 App Router project with TypeScript, TailwindCSS, and shadcn/ui.
Chose Groq (llama-3.3-70b-versatile) over OpenAI for latency — significantly faster
median response times in early tests. Set up folder structure: `lib/`, `types/`,
`components/`, `app/api/`.

Wrote the core `AuditTool` and `AuditResult` types in `types/audit.ts`. Established
the foundational architecture: pure-function rules with a `RuleContext` input so each
rule is independently testable. Updated README with initial project description.

---

## 2026-05-08 — Core MVP audit flow & frontend

Built the core SpendScope MVP: audit form, rule engine skeleton, and results dashboard.
Stabilized the frontend — wired up the form to the audit engine, got the results
rendering correctly with savings summary, severity badges, and recommendation cards.

Decided to keep all rule logic in a single `audit-engine.ts` file for now — easier
to review and iterate on than splitting across modules at this stage.

---

## 2026-05-10 — 17-rule engine overhaul & Groq enrichment

Overhauled the audit engine to 17 rules covering coding overlap, general AI overlap,
image gen overlap, writing tool redundancy, billing cycle penalties, seat scaling,
and spend concentration. Added dynamic plan dropdowns and `billingCycle` field support.

Added per-tool `NEGOTIATE_MIN_SEATS` thresholds (Claude: 50, ChatGPT: 150,
GitHub Copilot: 50, Cursor: 30) — `ruleSpendConcentration` was firing for small teams
nowhere near enterprise discount thresholds, fixed that.

Integrated Groq API for semantic use-case analysis and CFO-tone recommendation
enrichment. First prompt attempt used JSON schema in the system prompt — Groq returned
malformed JSON ~30% of the time. Switched to explicit output structure with stricter
parsing, failure rate dropped significantly.

---

## 2026-05-12 — Supabase persistence & shareable audit URLs

Added Supabase for lead capture and audit persistence. Hit a Vercel build error
immediately: was using the service role key client-side — switched to anon key,
build passed.

Implemented shareable audit URLs via `/audit/[id]` — results persisted to Supabase
on submission, fetched by ID on load. Added `localStorage` persistence so users
don't lose results on refresh before sharing. Set up Resend for transactional
confirmation email on lead submission.

---

## 2026-05-13 — Landing page, CI, bug fixes & stabilization

Fixed `stackIsWellOptimised` filter — was incorrectly including `consolidate` and
`cut` recs. Added landing page polish: stats bar, how-it-works, social proof,
bottom CTA, `SpendingWellBanner` for stacks under $100/mo savings. Added honeypot
field on lead capture for abuse protection.

Fixed a Supabase anon key issue that was causing an API key leak. Fixed a cascading
render bug in the results dashboard.

Set up `.github/workflows/ci.yml` — ESLint + Vitest on every push to main. Wrote
10 Vitest unit tests covering all major rule branches. Fixed 2 failing tests in
`ruleMonthlyBillingAtTeamScale` — one had a redundant tool filter in the find
predicate, the other had wrong seat count for the boundary case. All 10 pass.

CI passed. Lighthouse in incognito: 98 Performance, 100 Accessibility, 100 Best
Practices, 100 SEO. Live at `https://spendscope-alpha.vercel.app`.