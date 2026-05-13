# REFLECTION.md — SpendScope

---

## 1. The hardest bug you hit this week, and how you debugged it

The hardest bug was `ruleMonthlyBillingAtTeamScale` silently not firing for the test case that should have triggered it — a tool with 3 seats, monthly billing, and $60/mo spend. The test was asserting `rec` to be defined, and getting `undefined` back with no error, just a quiet failure.

My first hypothesis was that the `billingCycle` field wasn't being passed through correctly from the form — maybe the field was `undefined` at the point the rule ran, so `billingCycle !== "monthly"` bailed out immediately. I added a `console.log` inside the rule to check what value was actually arriving. The field was fine — "monthly" was there.

Second hypothesis: the `seats < 3` guard. The test had `seats: 3`, which should pass, but I double-checked the comparison — it was `< 3` not `<= 3`, so 3 seats correctly passes. Not the issue.

Third hypothesis: the `savings < 20` threshold at the bottom of the rule. Calculated manually: `Math.round(60 * 0.20) = 12`. That's less than 20 — the rule was computing valid savings, then throwing the result away silently because of an overly aggressive "not worth flagging" guard I'd put in to avoid noise on tiny amounts. The guard made sense conceptually but the threshold of 20 was too high for small-spend tools.

Fix was one line — changed `if (savings < 20) return null` to `if (savings < 5) return null`. Test passed. The lesson was that silent early returns are the hardest class of bug to find — the code isn't broken, it's just deciding not to run, and nothing tells you that happened.

---

## 2. A decision you reversed mid-week, and what made you reverse it

Early in the build I set `isSpendingWell` to return `true` whenever `stackIsWellOptimised` was true, regardless of savings amount. The intent was to make the "You're spending well" banner appear more often — I thought showing a positive result would feel good for users with clean stacks.

The problem showed up when testing edge cases: a stack with `potentialMonthlySavings` of $80 was triggering the banner and showing the notify-me flow instead of the actual recommendations. The recommendations existed, they were valid, but the banner was suppressing them. A user with $80 in actionable savings was being told their stack was healthy.

I reverted to `isSpendingWell = stackIsWellOptimised || potentialMonthlySavings < 100`. That way the banner only fires when savings are genuinely negligible (under $100/mo) or the stack is explicitly flagged as well-optimised by the Groq enrichment. Anything above $100/mo goes to the full recommendations view regardless of optimisation status.

What made me reverse it was realising the product has one job: surface real waste. Anything that hides valid findings — even with good UX intent — undermines the core value proposition. A tool that makes users feel good about their stack when they're actually overspending is worse than useless.

---

## 3. What you would build in week 2 if you had it

The most valuable week 2 addition would be a team audit mode — where multiple people can contribute tools to a shared audit rather than one person entering everything manually. Right now the assumption is that a single founder or engineering manager knows every tool the team pays for. In practice, subscriptions are scattered across personal cards, company cards, and different team members' accounts. A shared session where team members each add their own tools would surface the real stack.

Second priority: usage-connected recommendations. Right now the audit is based entirely on self-reported data. If SpendScope could read billing emails (with explicit permission) and extract actual subscription amounts, it removes the friction of manual entry and catches tools users forgot they were paying for — which is arguably the highest-value use case.

Third: a changelog or re-audit flow. Stacks change. Vendors change pricing. A user who audited 3 months ago should get a "your stack may have changed — here's what's new" prompt. Cursor repriced, ChatGPT rebranded Business from Team, Anthropic adjusted Claude Max. These updates should propagate to existing audits automatically.


---

## 4. How you used AI tools

I used Claude heavily throughout the week — primarily for the Groq prompt engineering, TypeScript type design, and debugging the rule engine logic. I used ChatGPT GO a lot for the project setup and initialization and in between when my Claude free tier ran out of tokens. For the prompt work, I'd draft a system prompt, run it against edge case inputs, and iterate on the output format until Groq returned structured data reliably. Claude was useful for anticipating failure modes in the prompt before I tested them.

For the audit engine rules themselves, I didn't trust AI to write the logic. The financial reasoning — which plans are actually comparable, what the real annual discount rates are, when a spend concentration rule should and shouldn't fire — required me to verify each number against vendor pricing pages and think through the edge cases manually. AI-generated rule logic would have looked plausible but would have had subtle errors in the threshold values and guard conditions. The `NEGOTIATE_MIN_SEATS` thresholds (Claude: 50, ChatGPT: 150) are a good example — those came from reading vendor enterprise documentation, not from asking an AI.

One specific time the AI was wrong: I asked Claude to suggest the annual discount rate for Cursor. It said 20%. The actual rate from Cursor's pricing page (Teams annual vs monthly) works out to approximately 17%. Small difference but it's in the audit engine — I caught it by checking cursor.com/pricing directly and updated `ANNUAL_DISCOUNT_RATE` accordingly. Any number that goes into a financial recommendation needs a primary source, not an AI's memory.

---

## 5. Self-ratings

**Discipline: 7/10**
Commits across 5 distinct days with meaningful progress each day, but the work was heavier toward the end of the week than I'd have liked — days 1–2 were architecture and scaffolding, days 4–5 were where the real velocity happened.

**Code quality: 9/10**
The audit engine is well-structured — pure functions, consistent types, no global state, every rule independently testable. The API routes could use more input validation.

**Design sense: 8/10**
The dashboard is clean and functional. Severity badges, filter pills, and the spend breakdown chart all communicate clearly. What's missing is motion — the results page appears all at once rather than progressively revealing findings, which would feel more like a real audit and less like a page load.

**Problem-solving: 9.5/10**
Strongest on debugging and architecture decisions. The rule engine design — pure functions, seenKeys deduplication, cross-tool vs per-tool separation — held up well as complexity grew. The `savings < 20` bug took longer than it should have because I didn't check the silent early returns first.

**Entrepreneurial thinking: 8/10**
I understand the user and the lead-gen mechanic clearly. The "You're spending well" banner and notify-me flow for clean stacks is the right call — don't manufacture savings, but still capture the lead. Where I underinvested is distribution: the shareable URL viral loop is designed correctly but I haven't pressure-tested the GTM channels against real acquisition cost assumptions.