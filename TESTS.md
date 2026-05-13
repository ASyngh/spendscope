# TESTS.md — SpendScope

## How to run

```bash
npm test
```

Runs all tests via Vitest. Expected output: 10 tests, 10 passing.

```bash
npm test -- --reporter=verbose
```

For the full per-test breakdown shown below.

---

## Test file

**`src/tests/audit-engine.test.ts`**

All 10 tests cover the core audit engine (`src/lib/audit-engine.ts`). No mocks — tests call `runAudit()` directly with constructed `AuditTool` inputs and assert on the returned `AuditResult`.

---

## Test list

### 1. Empty tools array returns zero savings
**Describe block:** `runAudit with empty tools`  
**What it covers:** Base case — `runAudit([])` should return `totalMonthlySpend: 0`, `potentialMonthlySavings: 0`, `potentialYearlySavings: 0`, and an empty recommendations array. Guards against regressions in the early-return path.

---

### 2. Coding assistant overlap fires when Claude Pro + Cursor both present
**Describe block:** `ruleCodingAssistantOverlap`  
**What it covers:** Pattern B implicit coding overlap — Claude Pro includes Claude Code, so a simultaneous Cursor Pro subscription is redundant. Asserts that a `consolidate` or `cut` recommendation is generated and that both tool names appear in `rec.tool`.

---

### 3. General AI overlap fires when Claude and ChatGPT are both paid
**Describe block:** `ruleGeneralAIOverlap`  
**What it covers:** Two paid general-purpose AI tools in the same stack should trigger a `consolidate` recommendation. Asserts the rec is defined, both tool names are present, and `estimatedSavings > 0`.

---

### 4. Monthly billing rule fires for 3+ seats on monthly billing
**Describe block:** `ruleMonthlyBillingAtTeamScale`  
**What it covers:** A tool with `billingCycle: "monthly"` and `seats: 3` should generate a `negotiate` recommendation referencing annual billing. Asserts rec is defined, `estimatedSavings > 0`, and `confidence >= 0.9`.

---

### 5. Monthly billing rule does NOT fire for fewer than 3 seats
**Describe block:** `ruleMonthlyBillingAtTeamScale`  
**What it covers:** Boundary condition — `seats: 2` on monthly billing should not trigger the rule. The overhead of switching billing cycle isn't worth flagging for 1–2 seat accounts. Asserts rec is `undefined`.

---

### 6. Personal plan at team scale fires for 3+ seats on personal plan
**Describe block:** `rulePersonalPlanAtTeamScale`  
**What it covers:** Claude Pro (a personal-tier plan) used across 5 seats should trigger a `downgrade` recommendation. Asserts `rec.type === "downgrade"`, `rec.tool === "Claude"`, and `estimatedSavings > 0`.

---

### 7. Spend concentration does NOT fire for a single Claude tool with 3 seats
**Describe block:** `ruleSpendConcentration`  
**What it covers:** The spend concentration rule should only fire when there are 2+ tools in the stack. A single-tool stack by definition has 100% concentration but no alternative to recommend. Asserts rec is `undefined`.

---

### 8. Spend concentration does NOT fire when only one tool in stack regardless of spend
**Describe block:** `ruleSpendConcentration`  
**What it covers:** Same rule, stress-tested with a high-spend single tool (51 seats, $5100/mo). Even above the `NEGOTIATE_MIN_SEATS` threshold for Claude (50), the rule should stay silent with only one tool present. Asserts rec is `undefined`.

---

### 9. Unused coding capability fires for Claude Team Premium with non-coding use case
**Describe block:** `rulePlanIncludesUnusedCodingCapability`  
**What it covers:** Claude Team Premium ($100/seat) includes Claude Code and is priced for engineering teams. A non-technical use case ("writing marketing copy") should trigger a `downgrade` recommendation to Team Standard. Asserts `rec.issue` includes "Claude Code", `rec.type === "downgrade"`, and `estimatedSavings === 800` (10 seats × $80/seat).

---

### 10. Unused coding capability does NOT fire when use case indicates coding
**Describe block:** `rulePlanIncludesUnusedCodingCapability`  
**What it covers:** Inverse of test 9 — if the use case contains coding keywords, the plan is being used correctly and no recommendation should fire. Asserts rec is `undefined`.

---

## Coverage summary

| Rule | Tested |
|---|---|
| `ruleCodingAssistantOverlap` | ✓ |
| `ruleGeneralAIOverlap` | ✓ |
| `ruleMonthlyBillingAtTeamScale` | ✓ (fires + does not fire) |
| `rulePersonalPlanAtTeamScale` | ✓ |
| `ruleSpendConcentration` | ✓ (two not-fire cases) |
| `rulePlanIncludesUnusedCodingCapability` | ✓ (fires + does not fire) |
| Empty input base case | ✓ |