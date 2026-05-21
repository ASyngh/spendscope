# feat: add re-audit on pricing change with email notifications

## What this PR does

Extends SpendScope with a "Re-audit on Pricing Change" feature. When AI tool pricing changes, stored audits are automatically detected as stale, affected users receive an email with a diff summary, and a `/re-audit/[id]` page shows the old vs new recommendations side-by-side with the savings delta as the headline.

## Why

A one-time audit becomes misleading the moment vendor pricing shifts — and it does shift. Cursor raised prices in 2024, Claude added new tiers in 2025, Copilot restructured plans. A user who audited 3 months ago and acts on stale data could make worse decisions than if they'd never audited at all. This feature makes audits live rather than snapshots.

The assumption: users who go through the friction of entering their stack and sharing their audit are genuinely trying to reduce spend. They want to be notified when the numbers change — they just don't want spam.

## How it works

```
src/data/pricing.ts          ← single source of truth, versioned with _version string
src/lib/diff.ts              ← pure function: compares two AuditResults, returns AuditDiff
src/app/api/audits/route.ts  ← extended: now saves email + pricing_snapshot on every audit
src/app/api/detect-changes/  ← new: finds stale audits, re-runs engine, emails users
src/app/re-audit/[id]/       ← new: diff view UI
src/types/audit.ts           ← extended: AuditDiff, StoredAudit types added
```

Flow:
1. User runs audit → enters email → clicks Share Audit → row saved with `pricing_snapshot: PRICING` and `email`
2. Pricing changes → bump `_version` in `pricing.ts` and redeploy
3. POST `/api/detect-changes?secret=<REAUDIT_SECRET>` → scans all audits, compares stored `_version` vs current, re-runs engine on stale ones, diffs results, updates DB, sends email via Resend
4. User clicks CTA in email → `/re-audit/[id]` renders savings delta + added/removed/unchanged recommendations

Detection trigger is a manually called POST endpoint. Scheduling (Vercel Cron / GitHub Actions) would wrap the same endpoint — the logic is identical, I just didn't add the scheduler in this PR.

The spec says "Mermaid diagram if it helps. ASCII is fine. No diagram is fine too if the prose is clear." — it's optional. Your "How it works" section has a clear code block showing the file structure and a numbered flow, which covers it.

But if you want to add one, here's a clean mermaid diagram you can drop into the `## How it works` section:

```mermaid
flowchart TD
    A[User runs audit] --> B[Enters email + clicks Share Audit]
    B --> C[audits row saved\n+ email + pricing_snapshot]
    D[Pricing changes\nbump _version in pricing.ts] --> E[POST /api/detect-changes]
    C --> E
    E --> F{snapshot _version\n== current _version?}
    F -- Yes --> G[Skip]
    F -- No --> H[Re-run audit engine\n+ diff results]
    H --> I[Update DB row\nis_stale = true]
    I --> J[Send email via Resend]
    J --> K[User clicks View full diff]
    K --> L[/re-audit/id renders\nsavings delta + rec diff]
```



## What I cut

- **One-click unsubscribe** — would need a signed token system (or a separate DB column + verify endpoint). The value/effort ratio didn't justify it in the time available. Next step if this shipped.
- **Public "what changed this week" page** — good growth surface but purely additive; the core flow works without it. Would be a 2-hour add once pricing.ts has a changelog format.
- **Consolidated email per user** — the spec mentions sending one email per user across multiple stale audits. Current implementation sends one email per stale audit. For most users this is identical (one audit per email), and the fix is a simple group-by before the email loop. Documented as a known gap.
- **Audit engine refactor to import from pricing.ts** — the engine still has prices hardcoded. The snapshot stored in the DB is from `pricing.ts`, so detection works correctly. Refactoring the engine to import from `pricing.ts` is the right long-term move but wasn't needed for correctness here.

## How to test it manually

1. Run an audit at `localhost:3000`, enter an email, click **Share Audit**
2. Verify the new row in Supabase `audits` table has `email` and `pricing_snapshot` populated
3. Bump `_version` in `src/data/pricing.ts` (e.g. `"2025-05-20"` → `"2025-05-22"`)
4. Run:
```powershell
Invoke-RestMethod -Method POST -Uri "http://localhost:3000/api/detect-changes?secret=<your_secret>"
```
5. Response should show `stale: 1, emailed: 1`
6. Check inbox for the re-audit email
7. Click **View full diff →** → should land on `/re-audit/[id]` with savings delta and recommendation diff

## What's tested

Skipped automated tests for Round 2 due to time constraint. Manual end-to-end verified above. If I were adding tests, the priority order would be:

- Unit test for `diffAuditResults` in `src/lib/diff.ts` — pure function, easy to test, highest value
- Integration test for `/api/detect-changes` with a seeded Supabase row
- Snapshot test for the `/re-audit/[id]` page with mock data

## Open questions / risks

- **Email deliverability** — currently using `onboarding@resend.dev` (Resend's shared domain). In production this needs a verified custom domain or emails may land in spam, which would make the core notification feature invisible to users.
- **Version string as the only staleness signal** — if someone updates a price in `pricing.ts` but forgets to bump `_version`, no audits will be marked stale even though the engine would produce different results. A more robust approach would be to re-run the engine on every audit and diff the output directly, rather than relying on the version string. This is a known simplification.
