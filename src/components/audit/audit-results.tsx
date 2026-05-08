import { AuditResult, AuditTool, Recommendation } from "@/types/audit";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { AlertTriangle, ArrowLeft, CheckCircle2, TrendingDown, Info } from "lucide-react";

interface AuditResultsProps {
    result: AuditResult;
    tools: AuditTool[];
    onReset: () => void;
}

export function AuditResults({ result, tools, onReset }: AuditResultsProps) {
    const chartData = tools.map(t => ({
        name: t.name,
        cost: t.monthlyCost,
    })).sort((a, b) => b.cost - a.cost);

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case "high": return "bg-destructive text-destructive-foreground hover:bg-destructive/90";
            case "medium": return "bg-chart-4 text-chart-4-foreground hover:bg-chart-4/90";
            case "low": return "bg-muted text-muted-foreground hover:bg-muted/90";
            default: return "bg-secondary text-secondary-foreground hover:bg-secondary/90";
        }
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case "high": return <AlertTriangle className="h-4 w-4" />;
            case "medium": return <Info className="h-4 w-4" />;
            case "low": return <CheckCircle2 className="h-4 w-4" />;
            default: return null;
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Audit Report</h2>
                    <p className="text-muted-foreground">Analysis complete. Found {result.recommendations.length} optimization opportunities.</p>
                </div>
                <Button variant="outline" onClick={onReset}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Edit Stack
                </Button>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <Card className="border-border/50 bg-card/50 backdrop-blur">
                    <CardHeader className="pb-2">
                        <CardDescription>Current Monthly Spend</CardDescription>
                        <CardTitle className="text-4xl font-mono">${result.totalMonthlySpend.toFixed(2)}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-primary/50 bg-primary/5 backdrop-blur">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-primary font-medium flex items-center gap-2">
                            <TrendingDown className="h-4 w-4" /> Potential Monthly Savings
                        </CardDescription>
                        <CardTitle className="text-4xl font-mono text-primary">${result.potentialMonthlySavings.toFixed(2)}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-border/50 bg-card/50 backdrop-blur">
                    <CardHeader className="pb-2">
                        <CardDescription>Projected Yearly Savings</CardDescription>
                        <CardTitle className="text-4xl font-mono text-muted-foreground">${result.potentialYearlySavings.toFixed(2)}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <h3 className="text-xl font-semibold border-b border-border/50 pb-2">Action Items</h3>

                    {result.recommendations.length === 0 ? (
                        <Card className="border-dashed bg-muted/10">
                            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                                <CheckCircle2 className="h-12 w-12 text-primary mb-4" />
                                <h4 className="text-lg font-medium mb-2">Highly Optimized Stack</h4>
                                <p className="text-sm text-muted-foreground">We didn&apos;t find any obvious waste in your current configuration. Great job.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {result.recommendations.map((rec, i) => (
                                <Card key={i} className="border-border/50 overflow-hidden relative">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-border/50" />
                                    {rec.severity === "high" && <div className="absolute left-0 top-0 bottom-0 w-1 bg-destructive" />}
                                    {rec.severity === "medium" && <div className="absolute left-0 top-0 bottom-0 w-1 bg-chart-4" />}
                                    <CardHeader className="pb-2 pt-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="font-mono text-xs">{rec.tool}</Badge>
                                                <Badge className={getSeverityColor(rec.severity)}>
                                                    {rec.severity.toUpperCase()}
                                                </Badge>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-medium text-muted-foreground">Est. Savings</div>
                                                <div className="text-lg font-bold text-primary font-mono">${rec.estimatedSavings.toFixed(2)}<span className="text-xs text-muted-foreground">/mo</span></div>
                                            </div>
                                        </div>
                                        <CardTitle className="text-base mt-2 flex items-center gap-2">
                                            {getSeverityIcon(rec.severity)} {rec.issue}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">{rec.suggestion}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <h3 className="text-xl font-semibold border-b border-border/50 pb-2">Spend Breakdown</h3>
                    <Card className="border-border/50 bg-card/50 backdrop-blur p-6">
                        <div className="h-[400px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 0, left: 40, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                                    <XAxis type="number" tickFormatter={(value) => `$${value}`} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                    <Tooltip
                                        formatter={(value) => typeof value === 'number' ? [`$${value.toFixed(2)}`, 'Cost'] : ['N/A', 'Cost']}
                                        contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '0.5rem' }}
                                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                                    />
                                    <Bar dataKey="cost" radius={[0, 4, 4, 0]}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={`hsl(var(--primary))`} opacity={1 - (index * 0.15)} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}