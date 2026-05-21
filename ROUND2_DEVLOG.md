# Round 2 Devlog

## 2026-05-20 10:00 — Received assignment
Read the full brief. Round 2 is shorter and narrower — execution and communication, not ideation. The feature is clear: re-audit on pricing change, email notification, diff view. Planned the architecture before touching any code.

## 2026-05-20 12:30 — Architecture decision
Decided on: centralized `pricing.ts` with a `_version` field as the staleness signal, extend existing `/api/audits` route rather than create a new one, manual POST endpoint for detection rather than a cron (simpler, same logic, scheduler is just a wrapper). No scraping, no queues, no websockets.

## 2026-05-20 13:00 — Got pulled away
Had to step away from the keyboard. Lost the afternoon block.

## 2026-05-20 19:30 — Resumed. Started implementation
Created `src/data/pricing.ts` as the centralized pricing source with `_version: "2025-05-20"`. Added new columns to Supabase via SQL migration: `email`, `pricing_snapshot`, `previous_recommendations`, `previous_savings`, `is_stale`, `last_reaudited_at`.

## 2026-05-20 20:15 — Extended types and audit save route
Added `AuditDiff` and `StoredAudit` to `src/types/audit.ts`. Extended `/api/audits/route.ts` to accept `email` and attach `PRICING` snapshot on every insert.

## 2026-05-20 21:00 — Dinner break

## 2026-05-20 23:30 — Resumed. Built diff utility and detect-changes endpoint
Wrote `src/lib/diff.ts` — pure function comparing two `AuditResult` objects by `tool + type` key. Built `/api/detect-changes` route: fetches audits with email + snapshot, compares `_version`, re-runs engine, diffs, updates DB, sends email via Resend.

## 2026-05-21 00:30 — Built /re-audit/[id] page
Scaffolded the diff view page. Hit a Next.js 15 breaking change immediately — `params` is now a Promise and must be awaited. Took ~10 minutes to diagnose from the error message.

## 2026-05-21 01:00 — First end-to-end test. Hit Supabase 401
Clicked Share Audit. Got `permission denied for table audits` (code 42501). The `anon` role had SELECT/INSERT but not UPDATE. Ran `GRANT UPDATE` + added RLS UPDATE policy. Fixed.

## 2026-05-21 01:20 — Email not delivering
`detect-changes` ran successfully (`stale: 1`) but `emailed: 0`. Traced it to the `from` address being a placeholder (`noreply@yourdomain.com`). Swapped to `onboarding@resend.dev` — same sender used in `leads/route.ts`. Email delivered.

## 2026-05-21 01:35 — Email field was null on all audit rows
`checked: 0` on first detect-changes run because `email` was never sent in the audit save request. The audit form didn't collect email — only the leads "Notify me" flow did. Added an email input field next to the Share Audit button in `audit-results.tsx`. Now email is required before sharing and is persisted with the audit.

## 2026-05-21 02:00 — Full flow working end-to-end
Submitted audit with email → Supabase row has `email` + `pricing_snapshot` → bumped `_version` → hit detect-changes → `stale: 1, emailed: 1` → email received → clicked diff link → `/re-audit/[id]` renders with savings delta and recommendation cards. All 4 required features working.

## 2026-05-21 02:15 — Slept 2 hours

## 2026-05-21 04:15 — Resumed. Writing docs and committing
Writing `ROUND2_PR.md`, `ROUND2_DEVLOG.md`, `ROUND2_REFLECTION.md`. Cleaning up commits, pushing branch, opening PR.

## 2026-05-21 13:35 — Bonus: admin dashboard
Added `src/app/admin/page.tsx` — shows total audits, audits with email, emails sent, currently stale count, and approximate click-through %. Protected by existing `REAUDIT_SECRET`. No new env vars or DB changes needed.
