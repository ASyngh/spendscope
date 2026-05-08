"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { AuditTool, AuditResult } from "@/types/audit";
import { runAudit } from "@/lib/audit-engine";
import { AuditForm } from "@/components/audit/audit-form";
import { AuditResults } from "@/components/audit/audit-results";
import { motion, AnimatePresence } from "framer-motion";

export default function AuditPage() {
    const [tools, setTools] = useState<AuditTool[]>([]);
    const [result, setResult] = useState<AuditResult | null>(null);

    const handleAddTool = (tool: AuditTool) => {
        setTools(prev => [...prev, tool]);
    };

    const handleRemoveTool = (id: string) => {
        setTools(prev => prev.filter(t => t.id !== id));
    };

    const handleRunAudit = () => {
        if (tools.length === 0) return;
        const res = runAudit(tools);
        setResult(res);
    };

    const handleReset = () => {
        setResult(null);
    };

    return (
        <div className="flex flex-col min-h-[100dvh]">
            <Navbar />
            <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight mb-2">AI Spend Audit</h1>
                    <p className="text-muted-foreground">Document your stack. We&apos;ll find the waste.</p>
                </div>

                <AnimatePresence mode="wait">
                    {!result ? (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <AuditForm
                                tools={tools}
                                onAddTool={handleAddTool}
                                onRemoveTool={handleRemoveTool}
                                onRunAudit={handleRunAudit}
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="results"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <AuditResults
                                result={result}
                                tools={tools}
                                onReset={handleReset}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
