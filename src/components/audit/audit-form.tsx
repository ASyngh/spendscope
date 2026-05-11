"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AuditTool } from "@/types/audit";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus, ArrowRight, Play } from "lucide-react";

// ─────────────────────────────────────────────
// TOOL → PLANS MAP
// label  : displayed in dropdown + stored in AuditTool.plan
// cost   : per-seat monthly benchmark (used for auto-fill)
// Matches PLAN_SEAT_BENCHMARKS in audit-engine.ts exactly.
// ─────────────────────────────────────────────

type PlanOption = { label: string; cost: number };

const TOOL_PLANS: Record<string, PlanOption[]> = {
    ChatGPT: [
        { label: "Free",       cost: 0   },
        { label: "Plus",       cost: 20  },
        { label: "Pro",        cost: 200 },
        { label: "Business",   cost: 20  }, // renamed from "Team" Apr 2026
        { label: "Enterprise", cost: 60  },
    ],
    Claude: [
        { label: "Free",          cost: 0   },
        { label: "Pro",           cost: 20  },
        { label: "Max",           cost: 100 },
        { label: "Team Standard", cost: 20  },
        { label: "Team Premium",  cost: 100 }, // includes Claude Code
        { label: "Enterprise",    cost: 20  },
    ],
    Gemini: [
        { label: "Free",               cost: 0   },
        { label: "AI Plus",            cost: 8   },
        { label: "AI Pro",             cost: 20  },
        { label: "AI Ultra",           cost: 250 },
        { label: "Workspace Business", cost: 14  },
    ],
    Cursor: [
        { label: "Free",       cost: 0   },
        { label: "Pro",        cost: 20  },
        { label: "Pro+",       cost: 60  },
        { label: "Ultra",      cost: 200 },
        { label: "Teams",      cost: 40  },
        { label: "Enterprise", cost: 50  },
    ],
    "GitHub Copilot": [
        { label: "Free",       cost: 0  },
        { label: "Pro",        cost: 10 },
        { label: "Pro+",       cost: 39 },
        { label: "Business",   cost: 19 },
        { label: "Enterprise", cost: 39 },
    ],
    Tabnine: [
        { label: "Free",       cost: 0  },
        { label: "Dev",        cost: 9  },
        { label: "Enterprise", cost: 39 },
    ],
    Midjourney: [
        { label: "Basic",    cost: 10  },
        { label: "Standard", cost: 30  },
        { label: "Pro",      cost: 60  },
        { label: "Mega",     cost: 120 },
    ],
    "Notion AI": [
        { label: "Free",       cost: 0  },
        { label: "Plus",       cost: 10 },
        { label: "Business",   cost: 20 },
        { label: "Enterprise", cost: 35 },
    ],
    Perplexity: [
        { label: "Free", cost: 0  },
        { label: "Pro",  cost: 20 },
    ],
    Runway: [
        { label: "Free",       cost: 0  },
        { label: "Standard",   cost: 15 },
        { label: "Pro",        cost: 35 },
        { label: "Unlimited",  cost: 95 },
        { label: "Enterprise", cost: 95 },
    ],
    Grammarly: [
        { label: "Free",       cost: 0  },
        { label: "Pro",        cost: 12 },
        { label: "Enterprise", cost: 25 },
    ],
    Jasper: [
        { label: "Creator",  cost: 49  },
        { label: "Pro",      cost: 69  },
        { label: "Business", cost: 125 },
    ],
    // "Other" intentionally has no plans — falls back to free-text input
    Other: [],
};

const COMMON_TOOLS = Object.keys(TOOL_PLANS);

// ─────────────────────────────────────────────
// SCHEMA
// billingCycle is optional — omitting it means Rule 15 won't fire,
// which is correct (can't flag monthly billing if we don't know).
// ─────────────────────────────────────────────

const formSchema = z.object({
    name:         z.string().min(1, "Tool name is required"),
    customName:   z.string().optional(),
    plan:         z.string().min(1, "Plan is required"),
    monthlyCost:  z.number().min(0, "Cost must be 0 or more"),
    seats:        z.number().min(1, "At least 1 seat required"),
    useCase:      z.string().min(1, "Use case is required"),
    billingCycle: z.enum(["monthly", "annual"]).optional(),
});

type FormValues = z.infer<typeof formSchema>;

// ─────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────

interface AuditFormProps {
    tools: AuditTool[];
    onAddTool: (tool: AuditTool) => void;
    onRemoveTool: (id: string) => void;
    onRunAudit: () => void;
    loading?:boolean;
}

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────

export function AuditForm({ tools, onAddTool, onRemoveTool, onRunAudit, loading }: AuditFormProps) {
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name:         "",
            customName:   "",
            plan:         "",
            monthlyCost:  0,
            seats:        1,
            useCase:      "",
            billingCycle: undefined,
        },
    });

    const watchName         = form.watch("name");
    const watchPlan         = form.watch("plan");
    const watchSeats        = form.watch("seats");
    const watchBillingCycle = form.watch("billingCycle");

    const availablePlans: PlanOption[] = TOOL_PLANS[watchName] ?? [];
    const isOtherTool = watchName === "Other";

    // ── Handlers ──────────────────────────────

    // Tool change → reset plan, cost, billingCycle
    const handleToolChange = (value: string) => {
        form.setValue("name", value);
        form.setValue("plan", "");
        form.setValue("monthlyCost", 0);
        form.setValue("billingCycle", undefined);
    };

    // Plan change → auto-fill cost = benchmark × seats
    const handlePlanChange = (value: string) => {
        form.setValue("plan", value);
        const planOption = availablePlans.find((p) => p.label === value);
        if (planOption) {
            const seats = form.getValues("seats") || 1;
            form.setValue("monthlyCost", planOption.cost * seats);
        }
    };

    // Seats change → recalculate cost if plan already selected
    const handleSeatsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const seats = Number(e.target.value);
        form.setValue("seats", seats);
        const planOption = availablePlans.find((p) => p.label === watchPlan);
        if (planOption && seats > 0) {
            form.setValue("monthlyCost", planOption.cost * seats);
        }
    };

    // ── Submit ────────────────────────────────

    const onSubmit: SubmitHandler<FormValues> = (data) => {
        const finalName = isOtherTool
            ? data.customName?.trim() || "Unknown Tool"
            : data.name;

        const alreadyExists = tools.some(
            (t) => t.name.toLowerCase() === finalName.toLowerCase()
        );

        if (alreadyExists) {
            alert("This tool already exists in your stack.");
            return;
        }

        const tool: AuditTool = {
            id: crypto.randomUUID(),
            name: finalName,
            plan: data.plan,
            monthlyCost: data.monthlyCost,
            seats: data.seats,
            useCase: data.useCase,
            ...(data.billingCycle ? { billingCycle: data.billingCycle } : {}),
        };

        onAddTool(tool);

        form.reset({
            name: "",
            customName: "",
            plan: "",
            monthlyCost: 0,
            seats: 1,
            useCase: "",
            billingCycle: undefined,
        });
    };

    // ── Derived UI state ──────────────────────

    // Show billing cycle selector only when seats ≥ 3 (Rule 15 threshold)
    // and a paid plan is selected — no point asking for Free tier billing
    const selectedPlanCost = availablePlans.find((p) => p.label === watchPlan)?.cost ?? 0;
    const showBillingCycle = watchSeats >= 3 && selectedPlanCost > 0;

    // Cost label hint
    const costIsAutoFilled = !!watchPlan && selectedPlanCost > 0;

    return (
        <div className="grid lg:grid-cols-12 gap-8">

            {/* ── LEFT: Add Subscription ── */}
            <div className="lg:col-span-5 space-y-6">
                <Card className="border-border/50 bg-card/50 backdrop-blur">
                    <CardHeader>
                        <CardTitle>Add Subscription</CardTitle>
                        <CardDescription>Enter details for each AI tool in your stack.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                                {/* Tool Name */}
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tool Name</FormLabel>
                                            <Select onValueChange={handleToolChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a tool" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {COMMON_TOOLS.map((tool) => (
                                                        <SelectItem key={tool} value={tool}>
                                                            {tool}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Custom Tool Name — only when "Other" */}
                                {isOtherTool && (
                                    <FormField
                                        control={form.control}
                                        name="customName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Custom Tool Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter tool name" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                {/* Plan Tier + Seats */}
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="plan"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Plan Tier</FormLabel>
                                                {availablePlans.length > 0 ? (
                                                    <Select
                                                        onValueChange={handlePlanChange}
                                                        value={field.value}
                                                        disabled={!watchName}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select plan" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {availablePlans.map((p) => (
                                                                <SelectItem key={p.label} value={p.label}>
                                                                    <span>{p.label}</span>
                                                                    {p.cost > 0 && (
                                                                        <span className="ml-2 text-xs text-muted-foreground">
                                                                            ${p.cost}/seat
                                                                        </span>
                                                                    )}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    // Free-text fallback for "Other" tools
                                                    <FormControl>
                                                        <Input
                                                            placeholder="e.g. Pro, Team, Enterprise"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                )}
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="seats"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Seats / Users</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        {...field}
                                                        onChange={handleSeatsChange}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Monthly Cost */}
                                <FormField
                                    control={form.control}
                                    name="monthlyCost"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Total Monthly Cost ($)
                                                {costIsAutoFilled && (
                                                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                                                        auto-filled · adjust if needed
                                                    </span>
                                                )}
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    placeholder="0.00"
                                                    {...field}
                                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Billing Cycle — only shown when seats ≥ 3 + paid plan
                                    Activates Rule 15 (monthly billing penalty) in the engine.
                                    Kept optional: omitting it is valid, rule just won't fire. */}
                                {showBillingCycle && (
                                    <FormField
                                        control={form.control}
                                        name="billingCycle"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Billing Cycle
                                                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                                                        optional
                                                    </span>
                                                </FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    value={field.value ?? ""}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Monthly or annual?" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="monthly">
                                                            Monthly
                                                            <span className="ml-2 text-xs text-muted-foreground">
                                                                may be overpaying vs annual
                                                            </span>
                                                        </SelectItem>
                                                        <SelectItem value="annual">
                                                            Annual
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                {/* Primary Use Case
                                    Critical for Rule 14 (unused coding capability).
                                    Prompt copy explicitly nudges users to mention "coding" or "writing"
                                    so the engine has signal to detect mismatched plan tiers. */}
                                <FormField
                                    control={form.control}
                                    name="useCase"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Primary Use Case</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="e.g. coding, writing, data analysis, marketing"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button type="submit" className="w-full" variant="secondary">
                                    <Plus className="mr-2 h-4 w-4" /> Add Tool
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>

            {/* ── RIGHT: Current Stack ── */}
            <div className="lg:col-span-7 flex flex-col">
                <Card className="flex-1 flex flex-col border-border/50 bg-card/50 backdrop-blur">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div>
                            <CardTitle>Current Stack</CardTitle>
                            <CardDescription>Tools to be audited ({tools.length})</CardDescription>
                        </div>
                        {tools.length > 0 && (
                            <Button
                                onClick={onRunAudit}
                                className="shadow-[0_0_15px_rgba(0,255,255,0.2)]"
                            >
                                <Play className="mr-2 h-4 w-4 fill-current" /> Run Audit
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col mt-4">
                        {tools.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-border/50 rounded-lg bg-muted/10">
                                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                                    <ArrowRight className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-medium mb-1">No tools added yet</h3>
                                <p className="text-sm text-muted-foreground max-w-[250px]">
                                    Add your subscriptions on the left to start building your stack profile.
                                </p>
                            </div>
                        ) : (
                            <div className="rounded-md border border-border/50 overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow>
                                            <TableHead>Tool</TableHead>
                                            <TableHead>Plan</TableHead>
                                            <TableHead className="text-right">Cost</TableHead>
                                            <TableHead className="text-right">Seats</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {tools.map((tool) => (
                                            <TableRow key={tool.id}>
                                                <TableCell className="font-medium">
                                                    {tool.name}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    <span>{tool.plan}</span>
                                                    {tool.billingCycle && (
                                                        <span className="ml-1.5 text-xs text-muted-foreground/60">
                                                            {tool.billingCycle === "monthly" ? "mo" : "ann"}
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    ${tool.monthlyCost.toFixed(2)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {tool.seats}
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => onRemoveTool(tool.id!)}
                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow className="bg-muted/20 font-medium">
                                            <TableCell colSpan={2}>Total</TableCell>
                                            <TableCell className="text-right">
                                                ${tools.reduce((sum, t) => sum + t.monthlyCost, 0).toFixed(2)}/mo
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {tools.reduce((sum, t) => sum + t.seats, 0)}
                                            </TableCell>
                                            <TableCell />
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}