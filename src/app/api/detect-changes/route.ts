import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { PRICING } from "@/data/pricing";
import { runAudit } from "@/lib/audit-engine";
import { diffAuditResults } from "@/lib/diff";
import { Resend } from "resend";
import type { StoredAudit } from "@/types/audit";

const resend = new Resend(process.env.RESEND_API_KEY);

// Protect with a simple secret — set REAUDIT_SECRET in your .env
function isAuthorized(req: Request): boolean {
    const { searchParams } = new URL(req.url);
    return searchParams.get("secret") === process.env.REAUDIT_SECRET;
}

export async function POST(req: Request) {
    if (!isAuthorized(req)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all audits that have a pricing snapshot and an email
    const { data: audits, error } = await supabase
        .from("audits")
        .select("*")
        .not("pricing_snapshot", "is", null)
        .not("email", "is", null);

    if (error) {
        return NextResponse.json({ error: "Failed to fetch audits" }, { status: 500 });
    }

    const results = { checked: 0, stale: 0, emailed: 0, errors: [] as string[] };

    for (const audit of (audits as StoredAudit[])) {
        results.checked++;

        // Skip if pricing hasn't changed since this audit was created
        if (audit.pricing_snapshot?._version === PRICING._version) continue;

        // Re-run the audit with current pricing
        // (engine uses its own internal constants; this triggers a fresh result)
        const newResult = runAudit(audit.tools);
        const prevResult = {
            totalMonthlySpend: audit.total_monthly_spend,
            potentialMonthlySavings: audit.potential_monthly_savings,
            potentialYearlySavings: audit.potential_monthly_savings * 12,
            recommendations: audit.recommendations,
        };

        const diff = diffAuditResults(prevResult, newResult);
        if (!diff.changed) continue;

        results.stale++;

        // Update the audit row
        const { error: updateError } = await supabase
            .from("audits")
            .update({
                previous_recommendations: audit.recommendations,
                previous_savings: audit.potential_monthly_savings,
                recommendations: newResult.recommendations,
                potential_monthly_savings: newResult.potentialMonthlySavings,
                potential_yearly_savings: newResult.potentialYearlySavings,
                pricing_snapshot: PRICING,
                is_stale: true,
                last_reaudited_at: new Date().toISOString(),
            })
            .eq("id", audit.id);

        if (updateError) {
            results.errors.push(`Update failed for ${audit.id}: ${updateError.message}`);
            continue;
        }

        // Send email
        if (audit.email) {
            try {
                await resend.emails.send({
                    from: "SpendScope <onboarding@resend.dev>", // update with your verified domain
                    to: audit.email,
                    subject: "Your AI spend audit has new recommendations",
                    html: buildEmail(audit.id, diff),
                });
                results.emailed++;
            } catch (e) {
                results.errors.push(`Email failed for ${audit.id}: ${String(e)}`);
            }
        }
    }

    return NextResponse.json(results);
}

function buildEmail(auditId: string, diff: ReturnType<typeof diffAuditResults>): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://spendscope-alpha.vercel.app";
    const deltaText = diff.savingsDelta >= 0
        ? `+$${diff.savingsDelta.toFixed(0)}/mo more savings identified`
        : `$${Math.abs(diff.savingsDelta).toFixed(0)}/mo savings reduction`;

    const addedList = diff.addedRecs
        .map((r) => `<li><strong>${r.tool}</strong>: ${r.issue} (~$${r.estimatedSavings}/mo)</li>`)
        .join("");
    const removedList = diff.removedRecs
        .map((r) => `<li>${r.tool}: ${r.issue}</li>`)
        .join("");

    return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2>Your AI spend audit has been updated</h2>
      <p>Pricing has changed since your last audit. We re-ran your stack and found new recommendations.</p>
      <h3 style="color:${diff.savingsDelta >= 0 ? '#16a34a' : '#dc2626'}">${deltaText}</h3>
      <p>Previous potential savings: <strong>$${diff.prevSavings.toFixed(0)}/mo</strong><br/>
         Updated potential savings: <strong>$${diff.newSavings.toFixed(0)}/mo</strong></p>
      ${addedList ? `<h4>New recommendations</h4><ul>${addedList}</ul>` : ""}
      ${removedList ? `<h4>Resolved recommendations</h4><ul>${removedList}</ul>` : ""}
      <a href="${baseUrl}/re-audit/${auditId}"
         style="display:inline-block;background:#1d4ed8;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;margin-top:16px">
        View full diff →
      </a>
    </div>
  `;
}