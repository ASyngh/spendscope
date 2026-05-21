# Round 2 Reflection

## 1. What was the most uncomfortable trade-off you made because of the time pressure?

The staleness detection relies entirely on a `_version` string in `pricing.ts`. If a price changes but the developer forgets to bump the version, no audits get flagged as stale — even though the engine would now produce different output. The correct approach is to re-run the audit engine on every stored audit and diff the results directly, without any version string at all. That way, any change to the engine or pricing data is automatically detected.

I knew this when I built it. I chose the version-string approach because it's fast to implement and easy to explain, but it creates a silent failure mode that could erode user trust in production. The trade-off was correctness for speed. I documented it as an open risk in the PR rather than pretending it doesn't exist.

## 2. If we extended the deadline by another 24 hours right now, what's the first thing you'd do?

Replace the `_version` comparison in `detect-changes` with a direct re-run of the audit engine on every stored audit, diffing the output against stored recommendations. This removes the version-string failure mode entirely and makes the system self-correcting — any future change to the engine logic or pricing data automatically triggers re-notification without any manual version bump. It's a one-function change in `detect-changes/route.ts` and would take about an hour to implement and test.

## 3. Looking back at your Round 1 codebase as a now-experienced user of it: what's one thing your Round 1 self made harder for your Round 2 self?

The audit save flow in Round 1 had no email field — email was collected in a completely separate "Notify me" lead capture flow that wrote to a different table (leads), not the audits table. This meant Round 2's core requirement — "each audit persisted with the user's email" — required adding a new email input to the Share Audit button UI, which wasn't anticipated. If Round 1 had collected email at audit-save time (even optionally), the Round 2 wiring would have been trivial. The separation made sense for Round 1's product goals but created unnecessary friction for Round 2's feature. A single email?: string field on the audit save payload from the start would have cost nothing.
