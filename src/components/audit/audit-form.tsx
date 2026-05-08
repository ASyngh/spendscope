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

const COMMON_TOOLS = [
    "ChatGPT", "Claude", "Gemini", "Cursor", "GitHub Copilot", "Tabnine",
    "Midjourney", "Notion AI", "Perplexity", "Runway", "Grammarly", "Jasper", "Other"
];

const formSchema = z.object({
    name: z.string().min(1, "Tool name is required"),
    customName: z.string().optional(),
    plan: z.string().min(1, "Plan name is required"),
    monthlyCost: z.number().min(0, "Cost must be a positive number"),
    seats: z.number().min(1, "At least 1 seat is required"),
    useCase: z.string().min(1, "Use case is required"),
});


interface AuditFormProps {
    tools: AuditTool[];
    onAddTool: (tool: AuditTool) => void;
    onRemoveTool: (id: string) => void;
    onRunAudit: () => void;
}

export function AuditForm({ tools, onAddTool, onRemoveTool, onRunAudit }: AuditFormProps) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            customName: "",
            plan: "",
            monthlyCost: 0,
            seats: 1,
            useCase: "",
        },
    });

    const watchName = form.watch("name");

    const onSubmit: SubmitHandler<z.infer<typeof formSchema>> = (data) => {
        const finalName = data.name === "Other" ? (data.customName || "Unknown Tool") : data.name;

        onAddTool({
            id: crypto.randomUUID(),
            name: finalName,
            plan: data.plan,
            monthlyCost: data.monthlyCost,
            seats: data.seats,
            useCase: data.useCase,
        });

        form.reset({
            name: "",
            customName: "",
            plan: "",
            monthlyCost: 0,
            seats: 1,
            useCase: "",
        });
    };

    return (
        <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 space-y-6">
                <Card className="border-border/50 bg-card/50 backdrop-blur">
                    <CardHeader>
                        <CardTitle>Add Subscription</CardTitle>
                        <CardDescription>Enter details for each AI tool in your stack.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tool Name</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a tool" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {COMMON_TOOLS.map(tool => (
                                                        <SelectItem key={tool} value={tool}>{tool}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {watchName === "Other" && (
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

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="plan"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Plan Tier</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. Pro, Team, Enterprise" {...field} />
                                                </FormControl>
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
                                                    <Input type="number" min="1" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="monthlyCost"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Total Monthly Cost ($)</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="useCase"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Primary Use Case</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Briefly describe what this is used for" {...field} />
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

            <div className="lg:col-span-7 flex flex-col">
                <Card className="flex-1 flex flex-col border-border/50 bg-card/50 backdrop-blur">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div>
                            <CardTitle>Current Stack</CardTitle>
                            <CardDescription>Tools to be audited ({tools.length})</CardDescription>
                        </div>
                        {tools.length > 0 && (
                            <Button onClick={onRunAudit} className="shadow-[0_0_15px_rgba(0,255,255,0.2)]">
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
                                                <TableCell className="font-medium">{tool.name}</TableCell>
                                                <TableCell className="text-muted-foreground">{tool.plan}</TableCell>
                                                <TableCell className="text-right">${tool.monthlyCost.toFixed(2)}</TableCell>
                                                <TableCell className="text-right">{tool.seats}</TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="icon" onClick={() => onRemoveTool(tool.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow className="bg-muted/20 font-medium">
                                            <TableCell colSpan={2}>Total</TableCell>
                                            <TableCell className="text-right">
                                                ${tools.reduce((sum, t) => sum + t.monthlyCost, 0).toFixed(2)}/mo
                                            </TableCell><TableCell className="text-right">
                                            {tools.reduce((sum, t) => sum + t.seats, 0)}
                                        </TableCell><TableCell></TableCell>
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