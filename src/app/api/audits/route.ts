import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { PRICING } from "@/data/pricing";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const {
            email,
            tools,
            recommendations,
            totalMonthlySpend,
            potentialMonthlySavings,
            potentialYearlySavings,
            stackIsWellOptimised,
            optimisationNotes,
        } = body;

        const { data, error } = await supabase
            .from("audits")
            .insert([
                {
                    email: email?? null,
                    tools,
                    recommendations,
                    total_monthly_spend: totalMonthlySpend,
                    potential_monthly_savings:
                    potentialMonthlySavings,
                    potential_yearly_savings:
                    potentialYearlySavings,
                    stack_is_well_optimised:
                    stackIsWellOptimised,
                    optimisation_notes:
                    optimisationNotes,
                    pricing_snapshot: PRICING, // snapshot at time of audit
                },
            ])
            .select("id")
            .single();

        if (error) {
            console.error("Audit insert error:", error);

            return NextResponse.json(
                { error: "Failed to save audit" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            id: data.id,
        });

    } catch (error) {
        console.error("Audit API error:", error);

        return NextResponse.json(
            { error: "Server error" },
            { status: 500 }
        );
    }
}