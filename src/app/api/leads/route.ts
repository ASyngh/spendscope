import { resend } from "@/lib/resend";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const {
            email,
            companyName,
            role,
            teamSize,
            estimatedMonthlySavings,
            totalMonthlySpend,
            auditSummary,
        } = body;

        if (!email) {
            return NextResponse.json(
                { error: "Email is required" },
                { status: 400 }
            );
        }

        const { error } = await supabase
            .from("leads")
            .insert([
                {
                    email,
                    company_name: companyName || null,
                    role: role || null,
                    team_size: teamSize || null,
                    estimated_monthly_savings:
                        estimatedMonthlySavings || 0,
                    total_monthly_spend:
                        totalMonthlySpend || 0,
                    audit_summary: auditSummary || null,
                },
            ]);

        if (error) {
            console.error("Supabase insert error:", error);

            return NextResponse.json(
                { error: "Failed to save lead" },
                { status: 500 }
            );
        }

        await resend.emails.send({
            from: "SpendScope <onboarding@resend.dev>",
            to: email,
            subject: "Your SpendScope audit was saved",
            html: `
        <div style="font-family: sans-serif; line-height: 1.6;">
            <h2>SpendScope Audit Saved</h2>

            <p>
                Your AI spend audit has been successfully saved.
            </p>

            <p>
                Estimated monthly savings:
                <strong>$${estimatedMonthlySavings}</strong>
            </p>

            <p>
                If your stack qualifies for deeper optimisation,
                Credex may reach out with additional savings opportunities.
            </p>

            <p style="margin-top: 24px; color: #666;">
                — SpendScope
            </p>
        </div>
    `,
        });

        return NextResponse.json({
            success: true,
        });
    } catch (error) {
        console.error("API route error:", error);

        return NextResponse.json(
            { error: "Server error" },
            { status: 500 }
        );
    }
}